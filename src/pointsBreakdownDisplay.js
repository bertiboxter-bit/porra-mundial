import { sortBreakdownLinesChronologicalDesc } from './scoreBreakdownSort.js'

/**
 * @typedef {{
 *   matchLabel: string
 *   points: number
 *   reason: string
 *   sortKey?: number
 *   kind?: string
 *   teams?: string[]
 * }} BreakdownLine
 */

/**
 * Agrupa líneas de avance en eliminatorias (misma fase) en una sola fila legible.
 * @param {BreakdownLine[]} lines
 */
export function prepareBreakdownLinesForDisplay(lines) {
  const sorted = sortBreakdownLinesChronologicalDesc(lines)
  /** @type {BreakdownLine[]} */
  const result = []

  let index = 0
  while (index < sorted.length) {
    const line = sorted[index]
    if (line.kind !== 'knockout-advancement') {
      result.push(line)
      index += 1
      continue
    }

    const phaseLabel = line.matchLabel
    const phasePoints = line.points
    /** @type {string[]} */
    const teams = []
    /** @type {BreakdownLine[]} */
    const bucket = []

    while (
      index < sorted.length &&
      sorted[index].kind === 'knockout-advancement' &&
      sorted[index].matchLabel === phaseLabel &&
      sorted[index].points === phasePoints
    ) {
      const current = sorted[index]
      bucket.push(current)
      const teamMatch = current.reason?.match(/«([^»]+)»/)
      if (teamMatch?.[1]) teams.push(teamMatch[1])
      index += 1
    }

    if (bucket.length === 1) {
      result.push(bucket[0])
      continue
    }

    const pointsEach = phasePoints ?? 0
    const totalPoints = pointsEach * bucket.length
    const teamList = teams.join(', ')
    result.push({
      matchLabel: phaseLabel,
      points: totalPoints,
      sortKey: bucket[0].sortKey,
      kind: 'knockout-advancement',
      teams,
      reason:
        bucket.length === 1
          ? bucket[0].reason
          : `${bucket.length} selecciones acertadas (+${pointsEach} pts c/u): ${teamList}.`,
    })
  }

  return result
}
