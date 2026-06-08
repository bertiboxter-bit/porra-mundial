import {
  GROUP_LETTERS,
  GROUPS,
  GROUP_STAGE_MATCHES,
  calculateGroupTable,
  computeFullKnockout,
  getKnockoutWinnerFromCell,
} from './bracketLogic.js'
import { mergeSpecials } from './porraSpecials.js'
import { getKnockoutMatchScoreParts } from './scoring.js'
import { getKnockoutPhaseAdvancementScoreParts } from './knockoutPhaseAdvancement.js'
function norm(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function pickPred(map, id) {
  if (!map || typeof map !== 'object') return undefined
  const k = String(id)
  return map[k] ?? map[id]
}

/** @returns {{ h: number, a: number } | null} */
function parseScoreCell(p) {
  if (!p || typeof p !== 'object') return null
  const h = Number(p.home)
  const a = Number(p.away)
  if (Number.isNaN(h) || Number.isNaN(a)) return null
  return { h, a }
}

function groupOutcome(h, a) {
  if (h > a) return 'H'
  if (a > h) return 'A'
  return 'D'
}

function groupOfficialComplete(officialPred, groupLetter) {
  const matches = GROUP_STAGE_MATCHES.filter(m => m.group === groupLetter)
  return matches.every(m => parseScoreCell(pickPred(officialPred, m.id)))
}

/**
 * @typedef {'pending' | 'exact' | 'partial' | 'miss' | 'no_official' | 'ok' | 'wrong'} CompareStatus
 * @typedef {{ id: string, category: string, label: string, detail: string, status: CompareStatus, points?: number }} CompareRow
 */

/**
 * @param {Record<string, unknown>} userPred
 * @param {Record<string, unknown>} userKo
 * @param {Record<string, unknown>} userSpecials
 * @param {Record<string, unknown>} officialPred
 * @param {Record<string, unknown>} officialKo
 * @param {Record<string, unknown>} officialSpecials
 */
export function buildPorraComparison(
  userPred,
  userKo,
  userSpecials,
  officialPred,
  officialKo,
  officialSpecials,
) {
  /** @type {CompareRow[]} */
  const rows = []
  let exactCount = 0
  let partialCount = 0
  let missCount = 0
  let pendingOfficial = 0

  for (const m of GROUP_STAGE_MATCHES) {
    const op = parseScoreCell(pickPred(officialPred, m.id))
    const up = parseScoreCell(pickPred(userPred, m.id))
    const label = `Grupo ${m.group} · ${m.home} – ${m.away}`

    if (!op) {
      if (!up) continue
      rows.push({
        id: `g-${m.id}`,
        category: 'Grupos',
        label,
        detail: `Tu pronóstico: ${up.h}–${up.a} · Sin resultado oficial`,
        status: 'no_official',
      })
      pendingOfficial += 1
      continue
    }

    if (!up) {
      rows.push({
        id: `g-${m.id}`,
        category: 'Grupos',
        label,
        detail: `Oficial: ${op.h}–${op.a} · No rellenaste este partido`,
        status: 'pending',
      })
      continue
    }

    if (up.h === op.h && up.a === op.a) {
      exactCount += 1
      rows.push({
        id: `g-${m.id}`,
        category: 'Grupos',
        label,
        detail: `${up.h}–${up.a} (exacto, +3 pts)`,
        status: 'exact',
        points: 3,
      })
    } else if (groupOutcome(up.h, up.a) === groupOutcome(op.h, op.a)) {
      partialCount += 1
      rows.push({
        id: `g-${m.id}`,
        category: 'Grupos',
        label,
        detail: `Tu ${up.h}–${up.a} vs oficial ${op.h}–${op.a} (+1 pt)`,
        status: 'partial',
        points: 1,
      })
    } else {
      missCount += 1
      rows.push({
        id: `g-${m.id}`,
        category: 'Grupos',
        label,
        detail: `Tu ${up.h}–${up.a} vs oficial ${op.h}–${op.a}`,
        status: 'miss',
        points: 0,
      })
    }
  }

  for (const g of GROUP_LETTERS) {
    if (!groupOfficialComplete(officialPred, g)) continue
    const teams = GROUPS[g]
    const matches = GROUP_STAGE_MATCHES.filter(m => m.group === g)
    const oTable = calculateGroupTable(officialPred, teams, matches, g)
    const uTable = calculateGroupTable(userPred, teams, matches, g)
    const n = Math.min(oTable.length, uTable.length)
    for (let i = 0; i < n; i++) {
      if (oTable[i].team !== uTable[i].team) {
        rows.push({
          id: `pos-${g}-${i}`,
          category: 'Clasificación',
          label: `Grupo ${g} · ${i + 1}.º puesto`,
          detail: `Tu ${uTable[i]?.team ?? '—'} vs oficial ${oTable[i].team}`,
          status: 'miss',
        })
        continue
      }
      rows.push({
        id: `pos-${g}-${i}`,
        category: 'Clasificación',
        label: `Grupo ${g} · ${i + 1}.º puesto`,
        detail: `${oTable[i].team} (+2 pts)`,
        status: 'exact',
        points: 2,
      })
    }
  }

  const officialBracket = computeFullKnockout(officialPred, officialKo)
  const userBracket = computeFullKnockout(userPred, userKo)
  const officialKoRows = [
    ...(officialBracket.round32 || []),
    ...(officialBracket.round16 || []),
    ...(officialBracket.quarter || []),
    ...(officialBracket.semi || []),
    ...(officialBracket.thirdPlace ? [officialBracket.thirdPlace] : []),
    ...(officialBracket.final ? [officialBracket.final] : []),
  ]

  for (const part of getKnockoutPhaseAdvancementScoreParts(officialBracket, officialKo, userBracket)) {
    partialCount += 1
    rows.push({
      id: `phase-${part.phaseId}-${part.team}`,
      category: 'Fase alcanzada',
      label: part.matchLabel,
      detail: `${part.reason} (+${part.points} pt${part.points === 1 ? '' : 's'})`,
      status: 'partial',
      points: part.points,
    })
  }

  for (const row of officialKoRows) {
    const key = row.scoreKey
    const oCell = officialKo[key]
    const uCell = userKo[key]
    const os = parseScoreCell(oCell)
    const us = parseScoreCell(uCell)
    const pair =
      row.homeTeam && row.awayTeam
        ? `${row.homeTeam} – ${row.awayTeam}`
        : `${row.homeLabel} – ${row.awayLabel}`

    if (!os) {
      if (us) {
        rows.push({
          id: `ko-${key}`,
          category: 'Eliminatorias',
          label: pair,
          detail: 'Sin resultado oficial aún',
          status: 'no_official',
        })
        pendingOfficial += 1
      }
      continue
    }

    const uTeams = findKoTeams(userBracket, key)
    if (!row.homeTeam || !row.awayTeam || !uTeams?.home || !uTeams?.away) continue
    if (row.homeTeam !== uTeams.home || row.awayTeam !== uTeams.away) {
      rows.push({
        id: `ko-${key}`,
        category: 'Eliminatorias',
        label: pair,
        detail: 'Tu cruce de equipos no coincide con el oficial',
        status: 'miss',
      })
      missCount += 1
      continue
    }

    if (!us) {
      rows.push({
        id: `ko-${key}`,
        category: 'Eliminatorias',
        label: pair,
        detail: `Oficial ${os.h}–${os.a} · Sin tu marcador`,
        status: 'pending',
      })
      continue
    }

    const ow = getKnockoutWinnerFromCell(row.homeTeam, row.awayTeam, oCell)
    const scoreParts = getKnockoutMatchScoreParts(oCell, uCell, row.homeTeam, row.awayTeam)
    const koPoints = scoreParts.reduce((sum, part) => sum + part.points, 0)

    if (koPoints >= 3) {
      exactCount += 1
      rows.push({
        id: `ko-${key}`,
        category: 'Eliminatorias',
        label: pair,
        detail: `${scoreParts.map(part => part.reason).join(' · ')} (+${koPoints} pts)`,
        status: 'exact',
        points: koPoints,
      })
    } else if (koPoints > 0) {
      partialCount += 1
      rows.push({
        id: `ko-${key}`,
        category: 'Eliminatorias',
        label: pair,
        detail: `${scoreParts.map(part => part.reason).join(' · ')} (+${koPoints} pt${koPoints === 1 ? '' : 's'})`,
        status: 'partial',
        points: koPoints,
      })
    } else {
      missCount += 1
      const pensNote =
        ow && os.h === os.a
          ? ' · Oficial a penaltis: hace falta acertar el empate a 120 minutos para sumar por la tanda'
          : ''
      rows.push({
        id: `ko-${key}`,
        category: 'Eliminatorias',
        label: pair,
        detail: `Tu ${us.h}–${us.a} vs oficial ${os.h}–${os.a}${pensNote}`,
        status: 'miss',
      })
    }
  }

  const us = mergeSpecials(userSpecials)
  const os = mergeSpecials(officialSpecials)
  const specialTriples = [
    ['topScorer', 'topScorer2', 'topScorer3', 'Pichichi'],
    ['bestPlayer', 'bestPlayer2', 'bestPlayer3', 'Mejor jugador'],
  ]
  for (const [k1, k2, k3, base] of specialTriples) {
    for (const [i, key] of [[0, k1], [1, k2], [2, k3]]) {
      const o = norm(os[key])
      const u = norm(us[key])
      if (!o) {
        if (u) pendingOfficial += 1
        continue
      }
      if (!u) {
        rows.push({
          id: `sp-${key}`,
          category: 'Premios',
          label: `${base} (${i + 1}.º)`,
          detail: `Oficial: ${os[key]} · Sin tu respuesta`,
          status: 'pending',
        })
        continue
      }
      rows.push({
        id: `sp-${key}`,
        category: 'Premios',
        label: `${base} (${i + 1}.º)`,
        detail: u === o ? `Acertado: ${os[key]}` : `Tu «${us[key]}» vs «${os[key]}»`,
        status: u === o ? 'exact' : 'miss',
        points: u === o ? [5, 3, 2][i] : 0,
      })
      if (u === o) exactCount += 1
      else missCount += 1
    }
  }

  for (const [key, label] of [
    ['topAssist', 'Máximo asistente'],
    ['goldenGlove', 'Guante de oro'],
  ]) {
    const o = norm(os[key])
    const u = norm(us[key])
    if (!o) {
      if (u) pendingOfficial += 1
      continue
    }
    if (!u) {
      rows.push({
        id: `sp-${key}`,
        category: 'Premios',
        label,
        detail: `Oficial: ${os[key]}`,
        status: 'pending',
      })
      continue
    }
    rows.push({
      id: `sp-${key}`,
      category: 'Premios',
      label,
      detail: u === o ? `Acertado: ${os[key]} (+5 pts)` : `Tu «${us[key]}» vs «${os[key]}»`,
      status: u === o ? 'exact' : 'miss',
      points: u === o ? 5 : 0,
    })
    if (u === o) exactCount += 1
    else missCount += 1
  }

  const scoredRows = rows.filter(r => r.status !== 'no_official' && r.status !== 'pending')
  const pointsEarned = rows.reduce((s, r) => s + (r.points ?? 0), 0)

  return {
    rows,
    summary: {
      exactCount,
      partialCount,
      missCount,
      pendingOfficial,
      comparedCount: scoredRows.length,
      pointsEarned,
    },
    hasOfficialData: rows.some(r => r.status !== 'no_official'),
  }
}

/**
 * @param {ReturnType<typeof computeFullKnockout>} bracket
 * @param {string} scoreKey
 */
function findKoTeams(bracket, scoreKey) {
  const all = [
    ...(bracket.round32 || []),
    ...(bracket.round16 || []),
    ...(bracket.quarter || []),
    ...(bracket.semi || []),
    ...(bracket.thirdPlace ? [bracket.thirdPlace] : []),
    ...(bracket.final ? [bracket.final] : []),
  ]
  const row = all.find(r => r.scoreKey === scoreKey)
  return row ? { home: row.homeTeam, away: row.awayTeam } : null
}

/** @param {CompareStatus} status */
export function compareStatusLabel(status) {
  switch (status) {
    case 'exact':
      return 'Pleno'
    case 'partial':
      return 'Parcial'
    case 'miss':
      return 'Fallo'
    case 'pending':
      return 'Sin rellenar'
    case 'no_official':
      return 'Sin oficial'
    default:
      return '—'
  }
}
