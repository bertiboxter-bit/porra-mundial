import {
  FIFA_MATCH_CENTRE_PATH,
  getFifaCentreIdForTeams,
} from './fifaMatchCentreIds.js'

/** Calendario general (eliminatorias sin id publicado, o reserva). */
export const FIFA_FIXTURES_URL =
  'https://www.fifa.com/es/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures?country=ES&wtw-filter=ALL'

/**
 * URL del match-centre FIFA (horario, sede, dónde ver, resultado).
 * @param {{ home?: string, away?: string, fifaMatchNumber?: number | string }} opts
 * @returns {string | null}
 */
export function getFifaMatchUrl({ home, away, fifaMatchNumber } = {}) {
  const centreId = home && away ? getFifaCentreIdForTeams(home, away) : null
  if (centreId) {
    return `${FIFA_MATCH_CENTRE_PATH}/${centreId}?country=ES`
  }
  // Eliminatorias: aún sin ids públicos por partido → calendario oficial
  if (fifaMatchNumber != null && fifaMatchNumber !== '') {
    return FIFA_FIXTURES_URL
  }
  return null
}
