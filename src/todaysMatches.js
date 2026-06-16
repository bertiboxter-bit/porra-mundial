import { GROUP_STAGE_MATCHES } from './worldCup2026Data.js'
import {
  FINAL_MATCH,
  QF_BRACKET,
  R16_BRACKET,
  R32_DATES,
  SF_BRACKET,
  THIRD_PLACE_MATCH,
} from './knockoutSchedule.js'
import { getTodayCalendarKeyMadrid } from './tournamentCalendar.js'
import {
  formatOfficialGroupScoreLine,
  formatOfficialKnockoutScoreLine,
  getGroupMatchHitTier,
  getKnockoutMatchPointsEarned,
  groupHitPoints,
  hasOfficialGroupMatchResult,
  hasOfficialKnockoutMatchResult,
} from './officialMatchHighlight.js'
import {
  collectGroupMatchPredictions,
  collectKnockoutMatchPredictions,
  formatGroupScoreLine,
  formatKnockoutScoreLine,
} from './matchPredictions.js'

const MADRID_TZ = 'Europe/Madrid'

/**
 * @param {string} isoUtc
 */
function calendarDateKeyMadrid(isoUtc) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MADRID_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(isoUtc))
}

/**
 * @param {string} dateKey YYYY-MM-DD
 */
export function formatDayPanelLabel(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const label = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: MADRID_TZ,
  }).format(new Date(Date.UTC(y, m - 1, d, 12, 0, 0)))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/**
 * @param {string} kickoffLabelEs
 */
function kickoffTimeFromLabel(kickoffLabelEs) {
  if (typeof kickoffLabelEs !== 'string') return null
  return kickoffLabelEs.split('·').pop()?.trim() ?? null
}

/** @returns {string[]} */
export function getTournamentDateKeys() {
  /** @type {Set<string>} */
  const keys = new Set()

  for (const match of GROUP_STAGE_MATCHES) {
    if (match.kickoffUtc) keys.add(calendarDateKeyMadrid(match.kickoffUtc))
  }

  for (const meta of Object.values(R32_DATES)) keys.add(meta.dateIso)

  for (const row of R16_BRACKET) keys.add(row.dateIso)
  for (const row of QF_BRACKET) keys.add(row.dateIso)
  for (const row of SF_BRACKET) keys.add(row.dateIso)
  keys.add(THIRD_PLACE_MATCH.dateIso)
  keys.add(FINAL_MATCH.dateIso)

  return [...keys].sort()
}

/** Día por defecto: hoy si hay partidos; si no, el próximo día con partidos. */
export function resolveDefaultDayKey() {
  const today = getTodayCalendarKeyMadrid()
  const keys = getTournamentDateKeys()
  if (keys.length === 0) return today
  if (keys.includes(today)) return today
  const next = keys.find(key => key > today)
  if (next) return next
  return keys[keys.length - 1]
}

/**
 * @param {string} dateKey
 * @param {number} deltaDays
 */
export function shiftCalendarDateKey(dateKey, deltaDays) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const shifted = new Date(Date.UTC(y, m - 1, d + deltaDays, 12, 0, 0))
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MADRID_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(shifted)
}

/**
 * @param {string} dateKey
 * @param {string[]} sortedKeys
 */
export function adjacentTournamentDay(dateKey, sortedKeys, direction) {
  const idx = sortedKeys.indexOf(dateKey)
  if (idx < 0) return null
  const nextIdx = direction === 'prev' ? idx - 1 : idx + 1
  return sortedKeys[nextIdx] ?? null
}

/**
 * @param {import('./bracketLogic.js').computeFullKnockout extends (...args: any) => infer R ? R : never} bracket
 * @param {string} dateKey
 */
function collectKnockoutRowsForDay(bracket, dateKey) {
  /** @type {Array<{ row: Record<string, unknown>, phase: string, dateIso: string }>} */
  const out = []

  for (const row of bracket.round32) {
    const dateIso = R32_DATES[row.fifa]?.dateIso
    if (dateIso === dateKey) out.push({ row, phase: '32avos de final', dateIso })
  }

  for (const row of bracket.round16) {
    if (row.dateIso === dateKey) out.push({ row, phase: 'Octavos de final', dateIso: row.dateIso })
  }

  for (const row of bracket.quarter) {
    if (row.dateIso === dateKey) out.push({ row, phase: 'Cuartos de final', dateIso: row.dateIso })
  }

  for (const row of bracket.semi) {
    if (row.dateIso === dateKey) out.push({ row, phase: 'Semifinal', dateIso: row.dateIso })
  }

  if (THIRD_PLACE_MATCH.dateIso === dateKey) {
    out.push({ row: bracket.thirdPlace, phase: 'Tercer puesto', dateIso: THIRD_PLACE_MATCH.dateIso })
  }

  if (FINAL_MATCH.dateIso === dateKey) {
    out.push({ row: bracket.final, phase: 'Final', dateIso: FINAL_MATCH.dateIso })
  }

  return out
}

/**
 * @param {{
 *   dateKey: string
 *   savedUsers: Record<string, unknown>[]
 *   userPredictions: Record<string, unknown>
 *   userKnockout: Record<string, unknown>
 *   userBracket: ReturnType<typeof import('./bracketLogic.js').computeFullKnockout>
 *   displayBracket: ReturnType<typeof import('./bracketLogic.js').computeFullKnockout>
 *   officialPredictions: Record<string, unknown> | null
 *   officialKnockout: Record<string, unknown> | null
 *   officialBracket: ReturnType<typeof import('./bracketLogic.js').computeFullKnockout> | null
 *   predictionsLockedGlobally: boolean
 * }} options
 */
export function buildDayMatchesPanelData({
  dateKey,
  savedUsers,
  userPredictions,
  userKnockout,
  userBracket,
  displayBracket,
  officialPredictions,
  officialKnockout,
  officialBracket,
  predictionsLockedGlobally,
}) {
  /** @type {Array<Record<string, unknown>>} */
  const matches = []

  for (const match of GROUP_STAGE_MATCHES) {
    const matchDate = match.kickoffUtc ? calendarDateKeyMadrid(match.kickoffUtc) : null
    if (matchDate !== dateKey) continue

    const hasOfficial = hasOfficialGroupMatchResult(officialPredictions, match.id)
    const userPred = userPredictions?.[match.id]
    const hitTier = hasOfficial
      ? getGroupMatchHitTier(officialPredictions, match.id, userPred)
      : null
    const userPointsEarned = hitTier != null ? groupHitPoints(hitTier) : null

    matches.push({
      key: `group-${match.id}`,
      kind: 'group',
      fifa: match.fifa,
      phase: `Grupo ${match.group} · J${match.matchday}`,
      home: match.home,
      away: match.away,
      kickoff: kickoffTimeFromLabel(match.kickoffLabelEs),
      kickoffUtc: match.kickoffUtc,
      scrollTargetId: `group-match-${match.id}`,
      hasOfficial,
      officialScoreLine: hasOfficial
        ? formatOfficialGroupScoreLine(officialPredictions, match.id)
        : null,
      userScoreLine: userPred ? formatGroupScoreLine(userPred) : null,
      userPointsEarned,
      predictionEntries: predictionsLockedGlobally
        ? collectGroupMatchPredictions(savedUsers, match.id, officialPredictions)
        : [],
      groupMatch: match,
    })
  }

  for (const { row, phase } of collectKnockoutRowsForDay(displayBracket, dateKey)) {
    const scoreKey = row.scoreKey
    const homeTeam = row.homeTeam
    const awayTeam = row.awayTeam
    const homeLabel = row.homeLabel
    const awayLabel = row.awayLabel
    const fifa = row.fifa

    const hasOfficial = hasOfficialKnockoutMatchResult(officialKnockout, scoreKey)
    const userCell = userKnockout?.[scoreKey]
    const userPointsEarned =
      hasOfficial && officialBracket && userBracket
        ? getKnockoutMatchPointsEarned(
            officialKnockout,
            officialBracket,
            userKnockout,
            userBracket,
            scoreKey,
          )
        : null

    matches.push({
      key: `ko-${scoreKey}`,
      kind: 'knockout',
      fifa,
      phase,
      home: homeTeam,
      away: awayTeam,
      homeLabel,
      awayLabel,
      kickoff: null,
      kickoffUtc: `${dateKey}T12:00:00.000Z`,
      scrollTargetId: `knockout-${scoreKey}`,
      hasOfficial,
      officialScoreLine: hasOfficial
        ? formatOfficialKnockoutScoreLine(officialKnockout, scoreKey)
        : null,
      userScoreLine: userCell ? formatKnockoutScoreLine(userCell) : null,
      userPointsEarned,
      predictionEntries: predictionsLockedGlobally
        ? collectKnockoutMatchPredictions(savedUsers, scoreKey, officialKnockout, officialBracket)
        : [],
      knockoutMeta: {
        title:
          homeTeam && awayTeam ? `${homeTeam} – ${awayTeam}` : `${homeLabel} – ${awayLabel}`,
        subtitle: `Partido ${fifa}`,
        scoreKey,
      },
    })
  }

  matches.sort((a, b) => {
    if (a.kickoffUtc && b.kickoffUtc && a.kickoffUtc !== b.kickoffUtc) {
      return String(a.kickoffUtc).localeCompare(String(b.kickoffUtc))
    }
    return Number(a.fifa) - Number(b.fifa)
  })

  const todayKey = getTodayCalendarKeyMadrid()

  return {
    dateKey,
    dayLabel: formatDayPanelLabel(dateKey),
    isToday: dateKey === todayKey,
    matches,
    matchesWithOfficial: matches.filter(match => match.hasOfficial).length,
    matchesTotal: matches.length,
  }
}
