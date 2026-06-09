import { getPorraDataFromUser } from './porraUserView.js'

/**
 * @param {string} value
 */
function trimValue(value) {
  return String(value ?? '').trim()
}

/**
 * @param {string[]} values
 * @param {{ caseInsensitive?: boolean, totalParticipants: number }} options
 */
function aggregateChoiceCounts(values, { caseInsensitive = false, totalParticipants }) {
  /** @type {Map<string, { count: number, labels: Map<string, number> }>} */
  const map = new Map()
  let answeredCount = 0

  for (const raw of values) {
    const trimmed = trimValue(raw)
    if (!trimmed) continue
    answeredCount++
    const key = caseInsensitive ? trimmed.toLocaleLowerCase('es') : trimmed
    const existing = map.get(key)
    if (existing) {
      existing.count++
      existing.labels.set(trimmed, (existing.labels.get(trimmed) || 0) + 1)
    } else {
      map.set(key, { count: 1, labels: new Map([[trimmed, 1]]) })
    }
  }

  const rows = Array.from(map.values())
    .map(entry => {
      let label = ''
      let labelVotes = 0
      for (const [candidate, votes] of entry.labels) {
        if (votes > labelVotes) {
          label = candidate
          labelVotes = votes
        }
      }
      const percent = totalParticipants > 0 ? (entry.count / totalParticipants) * 100 : 0
      return {
        label,
        count: entry.count,
        percent,
      }
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'))

  return { rows, answeredCount }
}

/**
 * @param {Record<string, unknown>[]} users
 */
function extractSemiTeamsUnique(bracket) {
  const teams = new Set()
  for (const row of bracket?.semi || []) {
    if (row.homeTeam) teams.add(row.homeTeam)
    if (row.awayTeam) teams.add(row.awayTeam)
  }
  return [...teams]
}

/**
 * @param {Record<string, unknown>[]} users
 */
export function buildPorraStatistics(users) {
  const participants = users || []
  const totalParticipants = participants.length
  const porraDataList = participants.map(user => getPorraDataFromUser(user))

  const championValues = porraDataList.map(data => data.podium.champion)
  const runnerUpValues = porraDataList.map(data => data.podium.runnerUp)
  const thirdPlaceValues = porraDataList.map(data => data.podium.thirdPlace)
  const finalValues = porraDataList.map(data => {
    const final = data.bracket?.final
    if (final?.homeTeam && final?.awayTeam) {
      return `${final.homeTeam} – ${final.awayTeam}`
    }
    return ''
  })
  const semiValues = porraDataList.flatMap(data => extractSemiTeamsUnique(data.bracket))

  const specials = porraDataList.map(data => data.specials)

  /**
   * @param {string} title
   * @param {string} description
   * @param {ReturnType<typeof aggregateChoiceCounts>} stats
   */
  function toCategory(title, description, stats) {
    return {
      title,
      description,
      rows: stats.rows,
      answeredCount: stats.answeredCount,
    }
  }

  return {
    totalParticipants,
    groups: [
      {
        title: 'Podio y final',
        categories: [
          toCategory(
            'Campeón',
            'Equipo ganador según la final de cada cuadro.',
            aggregateChoiceCounts(championValues, { totalParticipants }),
          ),
          toCategory(
            'Subcampeón',
            'Perdedor de la final en cada porra.',
            aggregateChoiceCounts(runnerUpValues, { totalParticipants }),
          ),
          toCategory(
            '3.er puesto',
            'Ganador del partido por el tercer puesto.',
            aggregateChoiceCounts(thirdPlaceValues, { totalParticipants }),
          ),
          toCategory(
            'Final prevista',
            'Cruce exacto marcado en la final.',
            aggregateChoiceCounts(finalValues, { totalParticipants }),
          ),
          toCategory(
            'Semifinalistas',
            'Veces que cada equipo aparece en semifinales (máx. una por participante).',
            aggregateChoiceCounts(semiValues, { totalParticipants }),
          ),
        ],
      },
      {
        title: 'Goleadores',
        categories: [
          toCategory(
            'Pichichi · 1.º',
            'Máximo goleador del torneo.',
            aggregateChoiceCounts(
              specials.map(s => s.topScorer),
              { caseInsensitive: true, totalParticipants },
            ),
          ),
          toCategory(
            'Pichichi · 2.º',
            'Segundo goleador.',
            aggregateChoiceCounts(
              specials.map(s => s.topScorer2),
              { caseInsensitive: true, totalParticipants },
            ),
          ),
          toCategory(
            'Pichichi · 3.º',
            'Tercer goleador.',
            aggregateChoiceCounts(
              specials.map(s => s.topScorer3),
              { caseInsensitive: true, totalParticipants },
            ),
          ),
        ],
      },
      {
        title: 'Premios individuales',
        categories: [
          toCategory(
            'Mejor jugador · 1.º',
            'Balón de oro previsto.',
            aggregateChoiceCounts(
              specials.map(s => s.bestPlayer),
              { caseInsensitive: true, totalParticipants },
            ),
          ),
          toCategory(
            'Mejor jugador · 2.º',
            'Segundo en mejor jugador.',
            aggregateChoiceCounts(
              specials.map(s => s.bestPlayer2),
              { caseInsensitive: true, totalParticipants },
            ),
          ),
          toCategory(
            'Mejor jugador · 3.º',
            'Tercero en mejor jugador.',
            aggregateChoiceCounts(
              specials.map(s => s.bestPlayer3),
              { caseInsensitive: true, totalParticipants },
            ),
          ),
          toCategory(
            'Máximo asistente',
            'Jugador con más asistencias previsto.',
            aggregateChoiceCounts(
              specials.map(s => s.topAssist),
              { caseInsensitive: true, totalParticipants },
            ),
          ),
          toCategory(
            'Guante de oro',
            'Mejor portero del torneo.',
            aggregateChoiceCounts(
              specials.map(s => s.goldenGlove),
              { caseInsensitive: true, totalParticipants },
            ),
          ),
        ],
      },
    ],
  }
}

/**
 * @param {number} percent
 */
export function formatStatisticPercent(percent) {
  return percent.toLocaleString('es-ES', { maximumFractionDigits: 1, minimumFractionDigits: 0 })
}
