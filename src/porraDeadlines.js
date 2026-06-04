import { GROUP_STAGE_FIXTURES } from './groupStageFixtures.js'

/** Lunes 8 jun 2026, 23:59:59 (hora peninsular España, UTC+2). */
export const PORRA_CLOSING_AT_MS = Date.parse('2026-06-08T23:59:59+02:00')

/** Primer partido del torneo (México – Sudáfrica), según calendario FIFA. */
export const WORLD_CUP_START_AT_MS = Date.parse(
  GROUP_STAGE_FIXTURES[0]?.kickoffUtc ?? '2026-06-11T19:00:00.000Z',
)

/**
 * @param {number} targetMs
 * @param {number} [nowMs]
 */
export function millisecondsRemainingUntil(targetMs, nowMs = Date.now()) {
  return Math.max(0, targetMs - nowMs)
}

/** True cuando ya pasó el cierre de envío de la porra (8 jun 2026, 23:59 España). */
export function isPorraPastClosingDeadline(nowMs = Date.now()) {
  return nowMs > PORRA_CLOSING_AT_MS
}

/**
 * @param {number} remainingMs
 */
export function splitCountdownParts(remainingMs) {
  const totalSeconds = Math.floor(remainingMs / 1000)
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

/**
 * @param {number} value
 */
export function padCountdownUnit(value) {
  return String(value).padStart(2, '0')
}
