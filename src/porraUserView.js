import { computeFullKnockout } from './bracketLogic.js'
import { mergeSpecials } from './porraSpecials.js'
import { podiumTeamsFromBracket } from './porraBracketPodium.js'
import { rankingDisplayName } from './userIdentity.js'

/**
 * @param {Record<string, unknown> | null | undefined} user
 */
export function getPorraDataFromUser(user) {
  const predictions =
    user?.predictions && typeof user.predictions === 'object' ? user.predictions : {}
  const knockoutScores = user?.knockout && typeof user.knockout === 'object' ? user.knockout : {}
  const mergedSpecials = mergeSpecials(user?.specials)
  const bracket = computeFullKnockout(predictions, knockoutScores)
  const podium = podiumTeamsFromBracket(bracket)
  const specials = { ...mergedSpecials, ...podium }

  return {
    predictions,
    knockoutScores,
    specials,
    displayName: rankingDisplayName(user),
    points: user?.points ?? 0,
    bracket,
    podium,
  }
}

/**
 * @param {Record<string, unknown>[]} users
 */
export function buildAllPorrasSummaryRows(users) {
  return (users || []).map(user => {
    const { displayName, points, podium, bracket } = getPorraDataFromUser(user)
    const final = bracket?.final
    const finalLabel =
      final?.homeTeam && final?.awayTeam ? `${final.homeTeam} – ${final.awayTeam}` : '—'

    return {
      user,
      key: String(user.username ?? user.nickname ?? displayName),
      displayName,
      points,
      champion: podium.champion || '—',
      runnerUp: podium.runnerUp || '—',
      thirdPlace: podium.thirdPlace || '—',
      finalLabel,
    }
  })
}
