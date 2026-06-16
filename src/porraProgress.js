import { GROUP_STAGE_MATCHES } from './worldCup2026Data.js'
import { computeFullKnockout, listPendingGroupTieBreaks } from './bracketLogic.js'
import { mergeSpecials } from './porraSpecials.js'

export const PORRA_TARGET_ATTR = 'data-porra-target'

/**
 * @param {unknown} cell
 */
export function scoreCellIsComplete(cell) {
  if (!cell || typeof cell !== 'object') return false
  const row = /** @type {{ home?: unknown, away?: unknown }} */ (cell)
  const homeRaw = row.home
  const awayRaw = row.away
  if (homeRaw === '' || homeRaw == null || awayRaw === '' || awayRaw == null) return false
  const home = Number(homeRaw)
  const away = Number(awayRaw)
  return !Number.isNaN(home) && !Number.isNaN(away)
}

/**
 * @param {string | null | undefined} homeTeam
 * @param {string | null | undefined} awayTeam
 * @param {unknown} cell
 */
export function knockoutMatchIncomplete(homeTeam, awayTeam, cell) {
  if (!homeTeam || !awayTeam) return false
  if (!scoreCellIsComplete(cell)) return true
  const row = /** @type {{ home?: unknown, away?: unknown, pensHome?: unknown, pensAway?: unknown }} */ (
    cell
  )
  const home = Number(row.home)
  const away = Number(row.away)
  if (home !== away) return false
  const pensHome = Number(row.pensHome)
  const pensAway = Number(row.pensAway)
  return Number.isNaN(pensHome) || Number.isNaN(pensAway)
}

/** @returns {import('./bracketLogic.js').ReturnType<typeof computeFullKnockout>['round32']} */
function allKnockoutRows(predictions, knockoutScores) {
  const bracket = computeFullKnockout(predictions, knockoutScores)
  return [
    ...(bracket.round32 || []),
    ...(bracket.round16 || []),
    ...(bracket.quarter || []),
    ...(bracket.semi || []),
    ...(bracket.thirdPlace ? [bracket.thirdPlace] : []),
    ...(bracket.final ? [bracket.final] : []),
  ]
}

const SPECIAL_FIELD_KEYS = [
  ['topScorer', 'Pichichi (1.º)'],
  ['topScorer2', 'Pichichi (2.º)'],
  ['topScorer3', 'Pichichi (3.º)'],
  ['bestPlayer', 'Mejor jugador (1.º)'],
  ['bestPlayer2', 'Mejor jugador (2.º)'],
  ['bestPlayer3', 'Mejor jugador (3.º)'],
  ['topAssist', 'Máximo asistente'],
  ['goldenGlove', 'Guante de oro'],
]

/**
 * @param {Record<string, unknown>} predictions
 * @param {Record<string, unknown>} knockoutScores
 * @param {Record<string, unknown>} specials
 */
export function computePorraProgress(predictions, knockoutScores, specials) {
  const groupTotal = GROUP_STAGE_MATCHES.length
  const groupDone = GROUP_STAGE_MATCHES.filter(m =>
    scoreCellIsComplete(predictions?.[m.id]),
  ).length

  const koRows = allKnockoutRows(predictions, knockoutScores)
  const koPlayable = koRows.filter(r => r.homeTeam && r.awayTeam)
  const koDone = koPlayable.filter(
    r => !knockoutMatchIncomplete(r.homeTeam, r.awayTeam, knockoutScores?.[r.scoreKey]),
  ).length

  const merged = mergeSpecials(specials)
  const specialsTotal = SPECIAL_FIELD_KEYS.length
  const specialsDone = SPECIAL_FIELD_KEYS.filter(([key]) =>
    String(merged[key] ?? '').trim(),
  ).length

  const pendingTies = listPendingGroupTieBreaks(predictions)
  const tiesPending = pendingTies.length

  const items = [
    { key: 'groups', label: 'Grupos', done: groupDone, total: groupTotal },
    {
      key: 'knockout',
      label: 'Eliminatorias',
      done: koDone,
      total: koPlayable.length,
    },
    { key: 'specials', label: 'Premios', done: specialsDone, total: specialsTotal },
  ]
  if (tiesPending > 0) {
    items.push({
      key: 'ties',
      label: 'Empates',
      done: 0,
      total: tiesPending,
    })
  }

  const totalUnits =
    groupTotal + koPlayable.length + specialsTotal + tiesPending
  const doneUnits =
    groupDone + koDone + specialsDone

  return {
    percent: totalUnits > 0 ? Math.round((doneUnits / totalUnits) * 100) : 100,
    doneUnits,
    totalUnits,
    items,
    isComplete: doneUnits >= totalUnits && tiesPending === 0,
  }
}

/**
 * @typedef {{ targetId: string, section: 'grupos' | 'knockout' | 'specials', label: string, group?: string }} PorraPendingTarget
 */

/**
 * @param {Record<string, unknown>} predictions
 * @param {Record<string, unknown>} knockoutScores
 * @param {Record<string, unknown>} specials
 * @returns {PorraPendingTarget | null}
 */
export function findNextPendingTarget(predictions, knockoutScores, specials) {
  for (const pending of listPendingGroupTieBreaks(predictions)) {
    return {
      targetId: `tie-group-${pending.group}`,
      section: 'grupos',
      label: `Confirmar orden · Grupo ${pending.group}`,
      group: pending.group,
    }
  }

  const missingGroup = GROUP_STAGE_MATCHES.find(
    m => !scoreCellIsComplete(predictions?.[m.id]),
  )
  if (missingGroup) {
    return {
      targetId: `group-match-${missingGroup.id}`,
      section: 'grupos',
      label: `Grupo ${missingGroup.group} · ${missingGroup.home} – ${missingGroup.away}`,
      group: missingGroup.group,
    }
  }

  const koRows = allKnockoutRows(predictions, knockoutScores)
  const missingKo = koRows.find(row =>
    knockoutMatchIncomplete(
      row.homeTeam,
      row.awayTeam,
      knockoutScores?.[row.scoreKey],
    ),
  )
  if (missingKo) {
    const label =
      missingKo.homeTeam && missingKo.awayTeam
        ? `${missingKo.homeTeam} – ${missingKo.awayTeam}`
        : `Partido FIFA ${missingKo.fifa}`
    return {
      targetId: `knockout-${missingKo.scoreKey}`,
      section: 'knockout',
      label,
    }
  }

  const merged = mergeSpecials(specials)
  for (const [key, label] of SPECIAL_FIELD_KEYS) {
    if (!String(merged[key] ?? '').trim()) {
      return {
        targetId: `special-${key}`,
        section: 'specials',
        label,
      }
    }
  }

  return null
}

/**
 * @param {string} targetId
 */
export function porraTargetSelector(targetId) {
  return `[${PORRA_TARGET_ATTR}="${targetId}"]`
}

/**
 * @param {string} targetId
 * @param {{ onFound?: (el: Element) => void }} [options]
 */
export function scrollToPorraTarget(targetId, options = {}) {
  let attempts = 0
  const maxAttempts = 8

  const attemptScroll = () => {
    const el = document.querySelector(porraTargetSelector(targetId))
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      options.onFound?.(el)
      return
    }
    attempts += 1
    if (attempts < maxAttempts) {
      window.setTimeout(attemptScroll, 100)
    }
  }

  window.setTimeout(attemptScroll, 150)
}
