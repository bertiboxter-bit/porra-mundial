const UNDEFINED_MATCHUP = 'Cruce por definir'

/**
 * @param {string} matchupLine
 */
export function parseMatchupLine(matchupLine) {
  if (!matchupLine || matchupLine === UNDEFINED_MATCHUP) return null
  const parts = matchupLine.split(' – ')
  if (parts.length !== 2) return null
  const home = parts[0].trim()
  const away = parts[1].trim()
  if (!home || !away) return null
  return { home, away }
}

/**
 * @param {{ matchupLine?: string }[]} predictionEntries
 * @param {string | null | undefined} officialMatchupLine
 */
export function buildKnockoutMatchupStats(predictionEntries, officialMatchupLine) {
  const validEntries = (predictionEntries || []).filter(
    entry => entry.matchupLine && entry.matchupLine !== UNDEFINED_MATCHUP,
  )
  const totalWithMatchup = validEntries.length

  /** @type {Map<string, number>} */
  const countByMatchup = new Map()
  for (const entry of validEntries) {
    const line = entry.matchupLine
    countByMatchup.set(line, (countByMatchup.get(line) ?? 0) + 1)
  }

  const officialMatchCount = officialMatchupLine
    ? countByMatchup.get(officialMatchupLine) ?? 0
    : 0

  const topMatchups = [...countByMatchup.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([matchupLine, count]) => ({
      matchupLine,
      count,
      percent: totalWithMatchup > 0 ? Math.round((count / totalWithMatchup) * 100) : 0,
      isOfficial: Boolean(officialMatchupLine && matchupLine === officialMatchupLine),
      teams: parseMatchupLine(matchupLine),
    }))

  const leadingMatchup = topMatchups[0] ?? null

  return {
    totalWithMatchup,
    officialMatchCount,
    hasOfficialMatchup: Boolean(officialMatchupLine),
    officialTeams: parseMatchupLine(officialMatchupLine ?? ''),
    topMatchups,
    leadingMatchup,
  }
}

/**
 * @param {ReturnType<typeof buildKnockoutMatchupStats>} stats
 */
export function formatKnockoutMatchupSummaryLabel(stats) {
  if (stats.totalWithMatchup === 0) {
    return 'Nadie tiene aún un cruce definido en este hueco'
  }

  if (stats.hasOfficialMatchup) {
    return `${stats.officialMatchCount} de ${stats.totalWithMatchup} acertaron el cruce`
  }

  if (stats.leadingMatchup) {
    return `Cruce más pronosticado: ${stats.leadingMatchup.count} de ${stats.totalWithMatchup}`
  }

  return null
}
