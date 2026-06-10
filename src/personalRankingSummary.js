import { PORRA_PRIZE_TIERS } from './porraPrizes.js'
import { normalizeUsername, rankingDisplayName } from './userIdentity.js'
import { formatRankMovementLabel } from './rankingUtils.js'

/**
 * @param {ReturnType<import('./rankingUtils.js').enrichRankingRows>} ranking
 * @param {number} targetRank
 */
function pointsAtRank(ranking, targetRank) {
  const row = ranking.find(user => user.rank === targetRank)
  return row?.points ?? null
}

/**
 * @param {ReturnType<import('./rankingUtils.js').enrichRankingRows>} ranking
 * @param {string} username
 */
export function buildPersonalRankingSummary(ranking, username) {
  const normalizedUsername = normalizeUsername(username)
  if (!normalizedUsername) return null

  const userRow = ranking.find(
    row => normalizeUsername(String(row.username ?? '')) === normalizedUsername,
  )
  if (!userRow) return null

  const rank = userRow.rank
  const points = userRow.points ?? 0
  const movementLabel = formatRankMovementLabel(userRow.movement)
  const pointsDelta = userRow.pointsDelta

  const prizeTier = PORRA_PRIZE_TIERS.find(tier => tier.rank === rank) ?? null

  /** @type {{ rank: number, label: string, amount: string, gap: number }[]} */
  const gapsToPrizeRanks = []
  for (const tier of PORRA_PRIZE_TIERS) {
    if (rank <= tier.rank) continue
    const targetPoints = pointsAtRank(ranking, tier.rank)
    if (targetPoints == null) continue
    const gap = targetPoints - points
    if (gap > 0) {
      gapsToPrizeRanks.push({
        rank: tier.rank,
        label: tier.label,
        amount: tier.amount,
        gap,
      })
    }
  }

  return {
    displayName: rankingDisplayName(userRow),
    rank,
    points,
    movement: userRow.movement,
    movementLabel,
    pointsDelta,
    prizeTier,
    gapsToPrizeRanks,
    isLeader: rank === 1,
  }
}
