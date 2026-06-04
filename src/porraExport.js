import {
  GROUP_LETTERS,
  GROUPS,
  GROUP_STAGE_MATCHES,
  calculateGroupTable,
  computeFullKnockout,
} from './bracketLogic.js'
import { mergeSpecials } from './porraSpecials.js'
import { scoreCellIsComplete } from './porraProgress.js'

/**
 * @param {unknown} cell
 */
function formatScore(cell) {
  if (!scoreCellIsComplete(cell)) return '—'
  const row = /** @type {{ home?: unknown, away?: unknown, pensHome?: unknown, pensAway?: unknown }} */ (
    cell
  )
  const home = Number(row.home)
  const away = Number(row.away)
  let text = `${home}–${away}`
  if (home === away) {
    const ph = row.pensHome
    const pa = row.pensAway
    if (ph !== '' && ph != null && pa !== '' && pa != null) {
      text += ` (pen. ${ph}–${pa})`
    }
  }
  return text
}

/**
 * @param {Record<string, unknown>} predictions
 * @param {Record<string, unknown>} knockoutScores
 * @param {Record<string, unknown>} specials
 * @param {string} displayName
 */
export function buildPorraSummaryText(predictions, knockoutScores, specials, displayName) {
  const name = String(displayName || '').trim() || 'Participante'
  const merged = mergeSpecials(specials)
  const bracket = computeFullKnockout(predictions, knockoutScores)
  const lines = [
    `PORRA MUNDIAL 2026 — Resumen de pronóstico`,
    `Participante: ${name}`,
    `Generado: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}`,
    '',
    '═══ FASE DE GRUPOS ═══',
    '',
  ]

  for (const letter of GROUP_LETTERS) {
    const teams = GROUPS[letter]
    const matches = GROUP_STAGE_MATCHES.filter(m => m.group === letter)
    lines.push(`--- Grupo ${letter} ---`)
    for (const match of matches) {
      const cell = predictions?.[match.id]
      lines.push(
        `  #${match.fifa} J${match.matchday}: ${match.home} – ${match.away} → ${formatScore(cell)}`,
      )
    }
    const table = calculateGroupTable(predictions, teams, matches, letter)
    lines.push('  Clasificación:')
    table.forEach((row, index) => {
      lines.push(
        `    ${index + 1}. ${row.team} — ${row.pts} pts, DG ${row.dg}, GF ${row.gf}`,
      )
    })
    lines.push('')
  }

  lines.push('═══ ELIMINATORIAS ═══', '')
  const koRows = [
    ...(bracket.round32 || []),
    ...(bracket.round16 || []),
    ...(bracket.quarter || []),
    ...(bracket.semi || []),
    ...(bracket.thirdPlace ? [bracket.thirdPlace] : []),
    ...(bracket.final ? [bracket.final] : []),
  ]
  for (const row of koRows) {
    const cell = knockoutScores?.[row.scoreKey]
    const teams =
      row.homeTeam && row.awayTeam
        ? `${row.homeTeam} – ${row.awayTeam}`
        : `${row.homeLabel} – ${row.awayLabel}`
    lines.push(`  #${row.fifa} ${teams} → ${formatScore(cell)}`)
  }

  lines.push('', '═══ PREMIOS Y ESPECIALES ═══', '')
  const podium = {
    champion: merged.champion,
    runnerUp: merged.runnerUp,
    thirdPlace: merged.thirdPlace,
  }
  lines.push(`  Campeón (desde final): ${podium.champion || '—'}`)
  lines.push(`  Subcampeón: ${podium.runnerUp || '—'}`)
  lines.push(`  3.er puesto: ${podium.thirdPlace || '—'}`)
  lines.push(`  Pichichi 1.º: ${merged.topScorer || '—'}`)
  lines.push(`  Pichichi 2.º: ${merged.topScorer2 || '—'}`)
  lines.push(`  Pichichi 3.º: ${merged.topScorer3 || '—'}`)
  lines.push(`  Mejor jugador 1.º: ${merged.bestPlayer || '—'}`)
  lines.push(`  Mejor jugador 2.º: ${merged.bestPlayer2 || '—'}`)
  lines.push(`  Mejor jugador 3.º: ${merged.bestPlayer3 || '—'}`)
  lines.push(`  Máximo asistente: ${merged.topAssist || '—'}`)
  lines.push(`  Guante de oro: ${merged.goldenGlove || '—'}`)

  return lines.join('\n')
}

/**
 * @param {string} text
 * @param {string} displayName
 */
export function downloadPorraSummaryFile(text, displayName) {
  const safe = String(displayName || 'porra')
    .trim()
    .replace(/[^\w\s-áéíóúñü]/gi, '')
    .replace(/\s+/g, '-')
    .slice(0, 40)
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `porra-mundial-2026-${safe || 'resumen'}.txt`
  anchor.click()
  URL.revokeObjectURL(url)
}
