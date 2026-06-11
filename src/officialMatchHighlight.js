import { getKnockoutMatchScoreParts, getTeamsForScoreKey } from './scoring.js'
import { formatGroupScoreLine, formatKnockoutScoreLine } from './matchPredictions.js'

function pickPred(map, id) {
  if (!map || typeof map !== 'object') return undefined
  const k = String(id)
  return map[k] ?? map[id]
}

/** @returns {{ h: number, a: number } | null} */
export function parseScoreCell(p) {
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

export function hasOfficialGroupMatchResult(officialPred, matchId) {
  return parseScoreCell(pickPred(officialPred, matchId)) != null
}

export function hasOfficialKnockoutMatchResult(officialKo, scoreKey) {
  return parseScoreCell(officialKo?.[scoreKey]) != null
}

/**
 * @returns {'exact' | 'outcome' | 'miss' | null}
 */
export function getGroupMatchHitTier(officialPred, matchId, userPred) {
  const op = parseScoreCell(pickPred(officialPred, matchId))
  const up = parseScoreCell(userPred)
  if (!op || !up) return null
  if (up.h === op.h && up.a === op.a) return 'exact'
  if (groupOutcome(up.h, up.a) === groupOutcome(op.h, op.a)) return 'outcome'
  return 'miss'
}

/** @param {'exact' | 'outcome' | 'miss' | null} tier */
export function groupHitPoints(tier) {
  if (tier === 'exact') return 3
  if (tier === 'outcome') return 1
  return 0
}

/**
 * @returns {number | null} null si aún no hay resultado oficial
 */
export function getKnockoutMatchPointsEarned(officialKo, officialBracket, userKo, userBracket, scoreKey) {
  const oCell = officialKo?.[scoreKey]
  if (!parseScoreCell(oCell)) return null

  const oTeams = getTeamsForScoreKey(officialBracket, scoreKey)
  const uTeams = getTeamsForScoreKey(userBracket, scoreKey)
  if (!oTeams?.home || !uTeams?.home) return null
  if (oTeams.home !== uTeams.home || oTeams.away !== uTeams.away) return 0

  const parts = getKnockoutMatchScoreParts(
    oCell,
    userKo?.[scoreKey],
    oTeams.home,
    oTeams.away,
  )
  return parts.reduce((sum, part) => sum + part.points, 0)
}

export function formatOfficialGroupScoreLine(officialPred, matchId) {
  return formatGroupScoreLine(pickPred(officialPred, matchId))
}

export function formatOfficialKnockoutScoreLine(officialKo, scoreKey) {
  return formatKnockoutScoreLine(officialKo?.[scoreKey])
}
