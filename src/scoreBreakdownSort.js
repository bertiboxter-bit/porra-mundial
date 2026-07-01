import { GROUP_LETTERS } from './bracketLogic.js'

/** @typedef {'group-match' | 'group-standing' | 'knockout-match' | 'knockout-advancement' | 'special'} BreakdownLineKind */

/** @param {number} fifa */
export function groupMatchSortKey(fifa) {
  return fifa
}

/** @param {string} groupLetter */
export function groupStandingSortKey(groupLetter) {
  const index = GROUP_LETTERS.indexOf(groupLetter)
  return 72 + (index >= 0 ? index + 1 : 13) * 0.01
}

/** @param {string} scoreKey */
export function knockoutMatchSortKey(scoreKey) {
  const match = String(scoreKey).match(/(\d+)$/)
  return match ? Number(match[1]) : 150
}

/** @param {'octavos' | 'cuartos' | 'semis' | 'final'} phaseId */
export function knockoutAdvancementSortKey(phaseId) {
  const byPhase = {
    octavos: 88.5,
    cuartos: 96.5,
    semis: 100.5,
    final: 102.5,
  }
  return byPhase[phaseId] ?? 150
}

/** @param {'champion' | 'runnerUp' | 'thirdPlace' | 'podium' | 'other'} kind */
export function specialSortKey(kind) {
  const byKind = {
    champion: 104.3,
    runnerUp: 104.25,
    thirdPlace: 103.3,
    podium: 105,
    other: 105.5,
  }
  return byKind[kind] ?? 106
}

/**
 * @param {{ sortKey?: number, points?: number }[]} lines
 */
export function sortBreakdownLinesChronologicalDesc(lines) {
  return [...lines].sort((a, b) => {
    const keyDiff = (b.sortKey ?? 0) - (a.sortKey ?? 0)
    if (keyDiff !== 0) return keyDiff
    return (b.points ?? 0) - (a.points ?? 0)
  })
}
