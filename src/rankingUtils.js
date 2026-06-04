import { rankingDisplayName } from './userIdentity.js'

/** Orden de clasificación: puntos ↓, fecha de actualización ↓, usuario ↑. */
export function sortRankingUsers(list) {
  const source = Array.isArray(list) ? list : []
  return [...source].sort((a, b) => {
    const pointsDelta = (b.points ?? 0) - (a.points ?? 0)
    if (pointsDelta !== 0) return pointsDelta
    const dateDelta = String(b.updatedAt ?? b.updated_at ?? '').localeCompare(
      String(a.updatedAt ?? a.updated_at ?? ''),
    )
    if (dateDelta !== 0) return dateDelta
    return String(a.username ?? a.nickname ?? '').localeCompare(String(b.username ?? b.nickname ?? ''))
  })
}

function rowIdentity(row) {
  return row?.username ?? row?.nickname ?? null
}

/** Mapa identidad → puesto (1-based) según el orden de `sortedUsers`. */
export function buildRankByIdentity(sortedUsers) {
  const rankByIdentity = new Map()
  sortedUsers.forEach((row, index) => {
    const identity = rowIdentity(row)
    if (identity) rankByIdentity.set(identity, index + 1)
  })
  return rankByIdentity
}

/**
 * Añade puesto actual, variación de puesto, delta de puntos y hueco con el de arriba.
 */
export function enrichRankingRows(sortedUsers) {
  return sortedUsers.map((user, index) => {
    const rank = index + 1
    const rawMovement = user.rank_movement ?? user.rankMovement
    const movement =
      rawMovement == null || rawMovement === '' || Number.isNaN(Number(rawMovement))
        ? null
        : Number(rawMovement)

    const points = user.points ?? 0
    const rawPreviousPoints = user.points_previous ?? user.pointsPrevious
    const pointsDelta =
      rawPreviousPoints != null &&
      rawPreviousPoints !== '' &&
      !Number.isNaN(Number(rawPreviousPoints))
        ? points - Number(rawPreviousPoints)
        : null

    const above = index > 0 ? sortedUsers[index - 1] : null
    const gapAbove = above != null ? (above.points ?? 0) - points : null

    return {
      ...user,
      rank,
      movement,
      pointsDelta,
      gapAbove,
      gapAboveDisplayName: above ? rankingDisplayName(above) : null,
    }
  })
}

export function formatRankMovementLabel(movement) {
  if (movement == null) return null
  if (movement > 0) return `+${movement}`
  if (movement < 0) return String(movement)
  return '='
}

export function formatGapAboveLabel({ rank, gapAbove, gapAboveDisplayName }) {
  if (gapAbove == null || gapAbove <= 0) {
    if (rank === 1) return 'Líder'
    return null
  }
  if (rank === 2) return `A ${gapAbove} pts del líder`
  if (gapAboveDisplayName) return `A ${gapAbove} pts de ${gapAboveDisplayName}`
  return `A ${gapAbove} pts del de arriba`
}
