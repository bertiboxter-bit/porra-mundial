import { supabase } from './supabase'
import { computeFullKnockout } from './bracketLogic.js'
import { scorePredictionRow } from './scoring.js'
import { mergeSpecials } from './porraSpecials.js'
import {
  normalizeOfficialSavedByName,
  validateOfficialSavedByName,
} from './officialAdminName.js'
import { buildRankByIdentity, sortRankingUsers } from './rankingUtils.js'

const OFFICIAL_ID = 'default'

export async function fetchOfficialState() {
  const { data, error } = await supabase.from('official_state').select('*').eq('id', OFFICIAL_ID).maybeSingle()
  if (error) {
    console.error(error)
    return null
  }
  if (!data) return null
  return {
    predictions: typeof data.predictions === 'object' && data.predictions ? data.predictions : {},
    knockout: typeof data.knockout === 'object' && data.knockout ? data.knockout : {},
    specials: mergeSpecials(data.specials),
    updatedAt: data.updated_at ?? data.updatedAt,
    predictionsLocked: Boolean(data.predictions_locked),
  }
}

/** Bloqueo global de edición de porras (lectura pública desde official_state). */
export async function fetchPredictionsGloballyLocked() {
  const { data, error } = await supabase
    .from('official_state')
    .select('predictions_locked')
    .eq('id', OFFICIAL_ID)
    .maybeSingle()
  if (error) {
    console.error(error)
    return false
  }
  return Boolean(data?.predictions_locked)
}

export async function setPredictionsGloballyLocked(locked) {
  const { error } = await supabase
    .from('official_state')
    .update({ predictions_locked: locked, updated_at: new Date().toISOString() })
    .eq('id', OFFICIAL_ID)
  if (error) throw error
  window.dispatchEvent(new Event('worldcup-sync'))
}

export async function fetchOfficialResultsLog(limit = 25) {
  const { data, error } = await supabase
    .from('official_results_log')
    .select('id, saved_at, saved_by, participants_count')
    .order('saved_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error(error)
    return { rows: [], error }
  }
  return { rows: data || [], error: null }
}

export async function fetchLatestOfficialUpdate() {
  const { rows, error } = await fetchOfficialResultsLog(1)
  if (error || rows.length === 0) return null
  return rows[0]
}

function predictionRowIdentity(row) {
  return row.username ?? row.nickname ?? null
}

async function updatePredictionPointsAndRanking(row, updatePayload) {
  if (row.username) {
    return supabase.from('predictions').update(updatePayload).eq('username', row.username)
  }
  const id = row.nickname
  if (!id) return { error: null }
  return supabase.from('predictions').update(updatePayload).eq('nickname', id)
}

/**
 * Guarda resultados oficiales, registra historial y actualiza puntos + variación de puesto.
 */
export async function saveOfficialAndRecalculatePoints({ predictions, knockout, specials, savedByName }) {
  const savedByError = validateOfficialSavedByName(savedByName)
  if (savedByError) throw new Error(savedByError)

  const payload = {
    id: OFFICIAL_ID,
    predictions: predictions ?? {},
    knockout: knockout ?? {},
    specials: mergeSpecials(specials ?? {}),
    updated_at: new Date().toISOString(),
  }

  const { error: upErr } = await supabase.from('official_state').upsert(payload, { onConflict: 'id' })
  if (upErr) throw upErr

  const officialBracket = computeFullKnockout(payload.predictions, payload.knockout)

  const { data: users, error: listErr } = await supabase
    .from('predictions')
    .select(
      'username, nickname, predictions, knockout, specials, points, points_previous, rank_movement, updated_at, updatedAt',
    )
  if (listErr) throw listErr

  const rows = users || []
  const rowsWithMeta = rows.map(row => ({
    ...row,
    updatedAt: row.updatedAt ?? row.updated_at ?? new Date().toISOString(),
    points: row.points ?? 0,
  }))

  const rankBeforeByIdentity = buildRankByIdentity(sortRankingUsers(rowsWithMeta))

  const scoredRows = rows.map(row => {
    const newPoints = scorePredictionRow(
      row,
      payload.predictions,
      payload.knockout,
      officialBracket,
      payload.specials,
    )
    const identity = predictionRowIdentity(row)
    const rankBefore = identity ? rankBeforeByIdentity.get(identity) : null
    return {
      row,
      newPoints,
      oldPoints: row.points ?? 0,
      identity,
      rankBefore,
    }
  })

  const rowsForRankAfter = scoredRows.map(({ row, newPoints }) => ({
    ...row,
    updatedAt: row.updatedAt ?? row.updated_at,
    points: newPoints,
  }))
  const rankAfterByIdentity = buildRankByIdentity(sortRankingUsers(rowsForRankAfter))

  const results = await Promise.all(
    scoredRows.map(({ row, newPoints, oldPoints, identity, rankBefore }) => {
      const rankAfter = identity ? rankAfterByIdentity.get(identity) : null
      const rankMovement =
        rankBefore != null && rankAfter != null ? rankBefore - rankAfter : null
      return updatePredictionPointsAndRanking(row, {
        points: newPoints,
        points_previous: oldPoints,
        rank_movement: rankMovement,
      })
    }),
  )
  const firstErr = results.find(r => r.error)?.error
  if (firstErr) throw firstErr

  const { error: logErr } = await supabase.from('official_results_log').insert({
    saved_by: normalizeOfficialSavedByName(savedByName),
    participants_count: rows.length,
  })
  if (logErr) throw logErr

  window.dispatchEvent(new Event('worldcup-sync'))
}
