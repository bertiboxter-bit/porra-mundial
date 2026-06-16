export const OFFICIAL_RESULTS_HASH = '#resultados-oficiales'
export const OFFICIAL_MATCH_PARAM = 'partido'

/**
 * @param {string} [hash]
 */
export function isOfficialResultsHash(hash = typeof window !== 'undefined' ? window.location.hash : '') {
  return hash === OFFICIAL_RESULTS_HASH || hash.startsWith(`${OFFICIAL_RESULTS_HASH}?`)
}

/**
 * @param {string} scrollTargetId p. ej. group-match-1 o knockout-r32-73
 */
export function buildOfficialMatchUrl(scrollTargetId) {
  const params = new URLSearchParams({ [OFFICIAL_MATCH_PARAM]: scrollTargetId })
  return `${OFFICIAL_RESULTS_HASH}?${params.toString()}`
}

/**
 * @param {string} [hash]
 * @returns {string | null}
 */
export function parseOfficialMatchTargetFromHash(hash = typeof window !== 'undefined' ? window.location.hash : '') {
  if (!isOfficialResultsHash(hash)) return null
  const queryIndex = hash.indexOf('?')
  if (queryIndex < 0) return null
  return new URLSearchParams(hash.slice(queryIndex + 1)).get(OFFICIAL_MATCH_PARAM)
}
