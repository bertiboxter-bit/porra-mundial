import { getFixtureKickoffLabelEs } from './groupStageFixtures.js'

/**
 * Hora de inicio en España para un partido de grupos (local FIFA → visitante).
 * @param {string} home
 * @param {string} away
 * @returns {string | null}
 */
export function getGroupMatchKickoffLabelEs(home, away) {
  if (!home || !away) return null
  return getFixtureKickoffLabelEs(home, away)
}
