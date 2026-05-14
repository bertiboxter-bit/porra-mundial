/** Estructura JSON `specials` en predictions y official_state (compatible con datos antiguos). */
export function defaultSpecials() {
  return {
    champion: '',
    runnerUp: '',
    thirdPlace: '',
    topScorer: '',
    topScorer2: '',
    topScorer3: '',
    bestPlayer: '',
    bestPlayer2: '',
    bestPlayer3: '',
    topAssist: '',
  }
}

export function mergeSpecials(raw) {
  return { ...defaultSpecials(), ...(typeof raw === 'object' && raw ? raw : {}) }
}
