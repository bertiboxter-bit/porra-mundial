import { computeFullKnockout } from './bracketLogic.js'
import {
  getGroupMatchHitTier,
  getKnockoutMatchPointsEarned,
  groupHitPoints,
} from './officialMatchHighlight.js'
import { getTeamsForScoreKey } from './scoring.js'
import { rankingDisplayName } from './userIdentity.js'

function displayPart(v) {
  if (v === '' || v == null) return '—'
  return String(v)
}

/** @param {{ home?: string, away?: string }} pred */
export function formatGroupScoreLine(pred) {
  if (!pred) return '— – —'
  return `${displayPart(pred.home)} – ${displayPart(pred.away)}`
}

/** @param {{ home?: string, away?: string, pensHome?: string, pensAway?: string }} cell */
export function formatKnockoutScoreLine(cell) {
  if (!cell || typeof cell !== 'object') return '— – —'
  let line = `${displayPart(cell.home)} – ${displayPart(cell.away)}`
  const h = Number(cell.home)
  const a = Number(cell.away)
  if (!Number.isNaN(h) && !Number.isNaN(a) && h === a) {
    const ph = cell.pensHome
    const pa = cell.pensAway
    if (ph !== '' && ph != null && pa !== '' && pa != null) {
      line += ` (${ph}-${pa} pen.)`
    }
  }
  return line
}

/**
 * @param {Record<string, unknown>[]} users
 * @param {string} matchId
 * @param {Record<string, unknown> | null | undefined} officialPred
 */
export function collectGroupMatchPredictions(users, matchId, officialPred) {
  return (users || [])
    .map(user => {
      const pred =
        user?.predictions && typeof user.predictions === 'object'
          ? user.predictions[matchId]
          : null
      const name = rankingDisplayName(user)
      const hitTier = officialPred ? getGroupMatchHitTier(officialPred, matchId, pred) : null
      const pointsEarned = hitTier != null ? groupHitPoints(hitTier) : null
      return {
        key: String(user.username ?? user.nickname ?? name),
        name,
        scoreLine: formatGroupScoreLine(pred),
        hitTier,
        pointsEarned,
        sortKey: name.toLocaleLowerCase('es'),
      }
    })
    .sort((a, b) => {
      const pointsA = a.pointsEarned ?? -1
      const pointsB = b.pointsEarned ?? -1
      if (pointsB !== pointsA) return pointsB - pointsA
      return a.sortKey.localeCompare(b.sortKey, 'es')
    })
}

/**
 * @param {Record<string, unknown>[]} users
 * @param {string} scoreKey
 */
function formatKnockoutMatchupLine(teams) {
  if (!teams?.home || !teams?.away) return 'Cruce por definir'
  return `${teams.home} – ${teams.away}`
}

/**
 * @param {Record<string, unknown>[]} users
 * @param {string} scoreKey
 * @param {Record<string, unknown> | null | undefined} officialKo
 * @param {ReturnType<typeof computeFullKnockout> | null | undefined} officialBracket
 */
export function collectKnockoutMatchPredictions(users, scoreKey, officialKo, officialBracket) {
  return (users || [])
    .map(user => {
      const predictions =
        user?.predictions && typeof user.predictions === 'object' ? user.predictions : {}
      const ko = user?.knockout && typeof user.knockout === 'object' ? user.knockout : {}
      const cell = ko[scoreKey]
      const bracket = computeFullKnockout(predictions, ko)
      const teams = getTeamsForScoreKey(bracket, scoreKey)
      const name = rankingDisplayName(user)
      const pointsEarned =
        officialKo && officialBracket
          ? getKnockoutMatchPointsEarned(officialKo, officialBracket, ko, bracket, scoreKey)
          : null
      return {
        key: String(user.username ?? user.nickname ?? name),
        name,
        matchupLine: formatKnockoutMatchupLine(teams),
        scoreLine: formatKnockoutScoreLine(cell),
        pointsEarned,
        sortKey: name.toLocaleLowerCase('es'),
      }
    })
    .sort((a, b) => {
      const pointsA = a.pointsEarned ?? -1
      const pointsB = b.pointsEarned ?? -1
      if (pointsB !== pointsA) return pointsB - pointsA
      return a.sortKey.localeCompare(b.sortKey, 'es')
    })
}
