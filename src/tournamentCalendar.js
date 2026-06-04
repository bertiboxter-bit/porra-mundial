import { GROUP_STAGE_MATCHES } from './worldCup2026Data.js'
import {
  FINAL_MATCH,
  QF_BRACKET,
  R16_BRACKET,
  R32_DATES,
  SF_BRACKET,
  THIRD_PLACE_MATCH,
} from './knockoutSchedule.js'

const MADRID_TZ = 'Europe/Madrid'

/**
 * @param {string} isoUtc
 * @returns {string}
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
function formatCalendarDayLabel(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const noonUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  const label = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: MADRID_TZ,
  }).format(noonUtc)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/**
 * @typedef {{ fifa: number, phase: string, summary: string, kickoff?: string }} TournamentCalendarMatch
 * @typedef {{ sortKey: string, label: string, matches: TournamentCalendarMatch[] }} TournamentCalendarDay
 */

/**
 * Calendario del torneo agrupado por día (hora España en fase de grupos).
 * @returns {TournamentCalendarDay[]}
 */
export function buildTournamentCalendarDays() {
  /** @type {Map<string, TournamentCalendarDay>} */
  const byDay = new Map()

  /**
   * @param {string} dateKey
   * @param {TournamentCalendarMatch} match
   */
  function addMatch(dateKey, match) {
    let day = byDay.get(dateKey)
    if (!day) {
      day = {
        sortKey: dateKey,
        label: formatCalendarDayLabel(dateKey),
        matches: [],
      }
      byDay.set(dateKey, day)
    }
    day.matches.push(match)
  }

  for (const match of GROUP_STAGE_MATCHES) {
    if (!match.kickoffUtc) continue
    const dateKey = calendarDateKeyMadrid(match.kickoffUtc)
    const kickoff =
      typeof match.kickoffLabelEs === 'string'
        ? match.kickoffLabelEs.split('·').pop()?.trim()
        : undefined
    addMatch(dateKey, {
      fifa: match.fifa,
      phase: `Grupo ${match.group} · J${match.matchday}`,
      summary: `${match.home} – ${match.away}`,
      kickoff,
    })
  }

  for (const [fifaKey, meta] of Object.entries(R32_DATES)) {
    addMatch(meta.dateIso, {
      fifa: Number(fifaKey),
      phase: '32avos de final',
      summary: `Partido FIFA ${fifaKey}`,
    })
  }

  for (const row of R16_BRACKET) {
    addMatch(row.dateIso, {
      fifa: row.fifa,
      phase: 'Octavos de final',
      summary: `Partido FIFA ${row.fifa}`,
    })
  }

  for (const row of QF_BRACKET) {
    addMatch(row.dateIso, {
      fifa: row.fifa,
      phase: 'Cuartos de final',
      summary: `Partido FIFA ${row.fifa}`,
    })
  }

  for (const row of SF_BRACKET) {
    addMatch(row.dateIso, {
      fifa: row.fifa,
      phase: 'Semifinal',
      summary: `Partido FIFA ${row.fifa}`,
    })
  }

  addMatch(THIRD_PLACE_MATCH.dateIso, {
    fifa: THIRD_PLACE_MATCH.fifa,
    phase: 'Tercer puesto',
    summary: `Partido FIFA ${THIRD_PLACE_MATCH.fifa}`,
  })

  addMatch(FINAL_MATCH.dateIso, {
    fifa: FINAL_MATCH.fifa,
    phase: 'Final',
    summary: `Partido FIFA ${FINAL_MATCH.fifa}`,
  })

  return [...byDay.values()]
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(day => ({
      ...day,
      matches: [...day.matches].sort((a, b) => a.fifa - b.fifa),
    }))
}
