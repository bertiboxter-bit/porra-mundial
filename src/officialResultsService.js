import { supabase } from './supabase'
import { computeFullKnockout } from './bracketLogic.js'
import { scorePredictionRow } from './scoring.js'
import { mergeSpecials } from './porraSpecials.js'

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

/**
 * Guarda resultados oficiales y actualiza `points` de todas las porras.
 */
export async function saveOfficialAndRecalculatePoints({ predictions, knockout, specials }) {
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
    .select('username, nickname, predictions, knockout, specials')
  if (listErr) throw listErr

  const rows = users || []
  const results = await Promise.all(
    rows.map(row => {
      const pts = scorePredictionRow(row, payload.predictions, payload.knockout, officialBracket, payload.specials)
      const id = row.username ?? row.nickname
      if (!id) return Promise.resolve({ error: null })
      if (row.username) {
        return supabase.from('predictions').update({ points: pts }).eq('username', row.username)
      }
      return supabase.from('predictions').update({ points: pts }).eq('nickname', id)
    }),
  )
  const firstErr = results.find(r => r.error)?.error
  if (firstErr) throw firstErr

  window.dispatchEvent(new Event('worldcup-sync'))
}
