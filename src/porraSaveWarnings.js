import { GROUP_STAGE_MATCHES } from './worldCup2026Data.js'
import { computeFullKnockout, listPendingGroupTieBreaks } from './bracketLogic.js'
import { mergeSpecials } from './porraSpecials.js'
import { scoreCellIsComplete, knockoutMatchIncomplete } from './porraProgress.js'

/**
 * @param {Record<string, unknown>} predictions
 * @param {Record<string, unknown>} knockoutScores
 * @param {Record<string, unknown>} specials
 * @returns {string[]}
 */
export function collectPorraSaveWarnings(predictions, knockoutScores, specials) {
  /** @type {string[]} */
  const warnings = []

  const missingGroupMatches = GROUP_STAGE_MATCHES.filter(
    match => !scoreCellIsComplete(predictions?.[match.id]),
  )
  if (missingGroupMatches.length > 0) {
    const groups = [...new Set(missingGroupMatches.map(match => match.group))]
      .sort()
      .join(', ')
    warnings.push(
      `Fase de grupos: ${missingGroupMatches.length} partido(s) sin marcador (grupos ${groups}).`,
    )
  }

  const bracket = computeFullKnockout(predictions, knockoutScores)
  const knockoutRows = [
    ...(bracket.round32 || []),
    ...(bracket.round16 || []),
    ...(bracket.quarter || []),
    ...(bracket.semi || []),
    ...(bracket.thirdPlace ? [bracket.thirdPlace] : []),
    ...(bracket.final ? [bracket.final] : []),
  ]
  const missingKnockout = knockoutRows.filter(row =>
    knockoutMatchIncomplete(
      row.homeTeam,
      row.awayTeam,
      knockoutScores?.[row.scoreKey],
    ),
  )
  if (missingKnockout.length > 0) {
    warnings.push(
      `Eliminatorias: ${missingKnockout.length} cruce(s) sin marcador completo (o penaltis si hay empate).`,
    )
  }

  const mergedSpecials = mergeSpecials(specials)
  /** @type {[string, string][]} */
  const specialFields = [
    ['topScorer', 'Pichichi (1.º)'],
    ['topScorer2', 'Pichichi (2.º)'],
    ['topScorer3', 'Pichichi (3.º)'],
    ['bestPlayer', 'Mejor jugador (1.º)'],
    ['bestPlayer2', 'Mejor jugador (2.º)'],
    ['bestPlayer3', 'Mejor jugador (3.º)'],
    ['topAssist', 'Máximo asistente'],
    ['goldenGlove', 'Guante de oro'],
  ]
  const emptySpecials = specialFields
    .filter(([key]) => !String(mergedSpecials[key] ?? '').trim())
    .map(([, label]) => label)
  if (emptySpecials.length > 0) {
    warnings.push(`Premios individuales sin rellenar: ${emptySpecials.join(', ')}.`)
  }

  const pendingTies = listPendingGroupTieBreaks(predictions)
  for (const pending of pendingTies) {
    warnings.push(
      `Empate sin confirmar en grupo ${pending.group} (${pending.teams.join(', ')}).`,
    )
  }

  return warnings
}

/**
 * @param {string[]} warnings
 */
export function formatPorraSaveWarningsMessage(warnings) {
  if (warnings.length === 0) {
    return 'Los datos se han guardado correctamente en la base de datos.'
  }
  return [
    'Los datos se han guardado correctamente en la base de datos.',
    '',
    'Aún faltan por completar:',
    ...warnings.map(line => `• ${line}`),
  ].join('\n')
}
