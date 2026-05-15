/**
 * Enlaces al detalle oficial de cada partido en FIFA.com (horario, sede, dónde ver, resultado).
 * Numeración FIFA del torneo: fase de grupos 1–72, eliminatorias 73–104.
 */
const FIFA_WC26_BASE =
  'https://www.fifa.com/es/tournaments/mens/worldcup/canadamexicousa2026'

/**
 * @param {number | string | null | undefined} fifaMatchNumber — número de partido oficial (1–104)
 * @returns {string | null}
 */
export function getFifaMatchUrl(fifaMatchNumber) {
  const n = Number(fifaMatchNumber)
  if (!Number.isInteger(n) || n < 1 || n > 104) return null
  return `${FIFA_WC26_BASE}/match/${n}?country=ES`
}
