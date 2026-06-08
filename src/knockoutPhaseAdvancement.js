import { getKnockoutWinnerFromCell } from './bracketLogic.js'

/** @typedef {'octavos' | 'cuartos' | 'semis' | 'final'} KnockoutAdvancementPhase */

/** @type {{ id: KnockoutAdvancementPhase, label: string, points: number, bracketKey: string, sourceRowsKey: string }[]} */
export const KNOCKOUT_ADVANCEMENT_PHASES = [
  {
    id: 'octavos',
    label: 'Octavos de final',
    points: 2,
    bracketKey: 'round16',
    sourceRowsKey: 'round32',
  },
  {
    id: 'cuartos',
    label: 'Cuartos de final',
    points: 3,
    bracketKey: 'quarter',
    sourceRowsKey: 'round16',
  },
  {
    id: 'semis',
    label: 'Semifinales',
    points: 4,
    bracketKey: 'semi',
    sourceRowsKey: 'quarter',
  },
  {
    id: 'final',
    label: 'Final',
    points: 5,
    bracketKey: 'final',
    sourceRowsKey: 'semi',
  },
]

function koCell(koScores, scoreKey) {
  const cell = koScores?.[scoreKey]
  return cell && typeof cell === 'object' ? cell : {}
}

/**
 * Equipos que oficialmente ya han ganado el cruce anterior y pasan a esta fase.
 * @param {ReturnType<import('./bracketLogic.js').computeFullKnockout>} bracket
 * @param {Record<string, unknown>} koScores
 * @param {string} sourceRowsKey
 */
function getOfficiallyAdvancedTeams(bracket, koScores, sourceRowsKey) {
  const rows = bracket?.[sourceRowsKey]
  if (!Array.isArray(rows)) return new Set()
  const advanced = new Set()
  for (const row of rows) {
    const home = row.homeTeam
    const away = row.awayTeam
    if (!home || !away) continue
    const winner = getKnockoutWinnerFromCell(home, away, koCell(koScores, row.scoreKey))
    if (winner) advanced.add(winner)
  }
  return advanced
}

/**
 * Equipos que el usuario tiene en los cruces de esta fase (aunque el rival no coincida con el oficial).
 * @param {ReturnType<import('./bracketLogic.js').computeFullKnockout>} bracket
 * @param {string} bracketKey
 */
function getUserTeamsInPhase(bracket, bracketKey) {
  if (bracketKey === 'final') {
    const fin = bracket?.final
    const teams = new Set()
    if (fin?.homeTeam) teams.add(fin.homeTeam)
    if (fin?.awayTeam) teams.add(fin.awayTeam)
    return teams
  }

  const rows = bracket?.[bracketKey]
  if (!Array.isArray(rows)) return new Set()
  const teams = new Set()
  for (const row of rows) {
    if (row.homeTeam) teams.add(row.homeTeam)
    if (row.awayTeam) teams.add(row.awayTeam)
  }
  return teams
}

/**
 * Puntos por acertar que una selección pasa de fase (independiente del cruce exacto).
 * La clasificación a dieciseisavos se puntúa solo con la posición en grupo (+2).
 * @param {ReturnType<import('./bracketLogic.js').computeFullKnockout>} officialBracket
 * @param {Record<string, unknown>} officialKo
 * @param {ReturnType<import('./bracketLogic.js').computeFullKnockout>} userBracket
 * @returns {{ phaseId: KnockoutAdvancementPhase, team: string, matchLabel: string, points: number, reason: string }[]}
 */
export function getKnockoutPhaseAdvancementScoreParts(officialBracket, officialKo, userBracket) {
  /** @type {{ phaseId: KnockoutAdvancementPhase, team: string, matchLabel: string, points: number, reason: string }[]} */
  const parts = []

  for (const phase of KNOCKOUT_ADVANCEMENT_PHASES) {
    const officiallyAdvanced = getOfficiallyAdvancedTeams(
      officialBracket,
      officialKo,
      phase.sourceRowsKey,
    )
    if (officiallyAdvanced.size === 0) continue

    const userInPhase = getUserTeamsInPhase(userBracket, phase.bracketKey)

    for (const team of officiallyAdvanced) {
      if (!userInPhase.has(team)) continue
      parts.push({
        phaseId: phase.id,
        team,
        matchLabel: `Eliminatorias · ${phase.label}`,
        points: phase.points,
        reason: `«${team}» llega a ${phase.label.toLowerCase()} en el cuadro oficial y también en tu porra (aunque el rival del cruce sea distinto).`,
      })
    }
  }

  return parts
}

/** Texto del reglamento para la sección «Sistema de puntos». */
export function knockoutPhaseAdvancementRulesText() {
  const lines = KNOCKOUT_ADVANCEMENT_PHASES.map(
    phase => `${phase.label}: +${phase.points} pts por selección acertada`,
  )
  return lines.join(' · ')
}
