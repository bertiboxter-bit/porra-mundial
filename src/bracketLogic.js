import {
  GROUP_LETTERS,
  GROUPS,
  GROUP_STAGE_MATCHES,
  ROUND_OF_32,
} from './worldCup2026Data.js'
import {
  FINAL_MATCH,
  QF_BRACKET,
  R16_BRACKET,
  R32_DATES,
  SF_BRACKET,
  THIRD_PLACE_MATCH,
} from './knockoutSchedule.js'

/** @typedef {{ team: string, pts: number, gf: number, gc: number, dg: number }} TableRow */

/**
 * @param {Record<number, { home?: string, away?: string }>} predictions
 * @param {string[]} teams
 * @param {{ id: number, home: string, away: string }[]} matches
 */
export function calculateGroupTable(predictions, teams, matches) {
  /** @type {Record<string, TableRow>} */
  const table = {}

  teams.forEach(team => {
    table[team] = { team, pts: 0, gf: 0, gc: 0, dg: 0 }
  })

  matches.forEach(match => {
    const prediction = predictions[match.id]
    if (!prediction) return

    const homeGoals = Number(prediction.home)
    const awayGoals = Number(prediction.away)
    if (Number.isNaN(homeGoals) || Number.isNaN(awayGoals)) return

    table[match.home].gf += homeGoals
    table[match.home].gc += awayGoals
    table[match.away].gf += awayGoals
    table[match.away].gc += homeGoals
    table[match.home].dg = table[match.home].gf - table[match.home].gc
    table[match.away].dg = table[match.away].gf - table[match.away].gc

    if (homeGoals > awayGoals) table[match.home].pts += 3
    else if (awayGoals > homeGoals) table[match.away].pts += 3
    else {
      table[match.home].pts += 1
      table[match.away].pts += 1
    }
  })

  return Object.values(table).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.dg !== a.dg) return b.dg - a.dg
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.team.localeCompare(b.team, 'es')
  })
}

function tableForGroup(predictions, groupLetter) {
  const teams = GROUPS[groupLetter]
  const matches = GROUP_STAGE_MATCHES.filter(m => m.group === groupLetter)
  return calculateGroupTable(predictions, teams, matches)
}

function allThirdPlaces(predictions) {
  return GROUP_LETTERS.map(g => {
    const table = tableForGroup(predictions, g)
    const third = table[2]
    if (!third) return { group: g, team: '—', pts: -1, dg: 0, gf: 0 }
    return {
      group: g,
      team: third.team,
      pts: third.pts,
      dg: third.dg,
      gf: third.gf,
    }
  }).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.dg !== a.dg) return b.dg - a.dg
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.group.localeCompare(b.group)
  })
}

function thirdPlaceGlobalOrder(predictions) {
  return allThirdPlaces(predictions).filter(t => t.pts >= 0)
}

function createQualifierContext(predictions) {
  /** @type {Record<string, TableRow[]>} */
  const tablesByGroup = {}
  GROUP_LETTERS.forEach(g => {
    tablesByGroup[g] = tableForGroup(predictions, g)
  })
  const rankedThirds = thirdPlaceGlobalOrder(predictions)
  const advancing = rankedThirds.slice(0, 8)
  const thirdRankGroups = advancing.map(t => t.group)
  const thirdTeamByGroup = new Map(rankedThirds.map(t => [t.group, t.team]))
  return { tablesByGroup, thirdRankGroups, thirdTeamByGroup, advancing }
}

/**
 * @param {{ kind: string, group?: string, thirdFrom?: string[] }} side
 * @param {Set<string>} pool
 */
function resolveTeamForSide(side, tablesByGroup, thirdTeamByGroup, thirdRankGroups, pool) {
  if (side.kind === 'first') {
    return tablesByGroup[side.group]?.[0]?.team ?? null
  }
  if (side.kind === 'second') {
    return tablesByGroup[side.group]?.[1]?.team ?? null
  }
  if (side.kind === 'third' && side.thirdFrom) {
    for (const g of thirdRankGroups) {
      if (!pool.has(g)) continue
      if (!side.thirdFrom.includes(g)) continue
      pool.delete(g)
      return thirdTeamByGroup.get(g) ?? null
    }
    return null
  }
  return null
}

/**
 * @param {Record<number, { home?: string, away?: string }>} predictions
 * @returns {{ fifa: number, homeTeam: string | null, awayTeam: string | null }[]}
 */
export function buildRoundOf32Teams(predictions) {
  const ctx = createQualifierContext(predictions)
  const pool = new Set(ctx.advancing.map(t => t.group))
  return ROUND_OF_32.map(m => ({
    fifa: m.fifa,
    homeTeam: resolveTeamForSide(
      m.home,
      ctx.tablesByGroup,
      ctx.thirdTeamByGroup,
      ctx.thirdRankGroups,
      pool,
    ),
    awayTeam: resolveTeamForSide(
      m.away,
      ctx.tablesByGroup,
      ctx.thirdTeamByGroup,
      ctx.thirdRankGroups,
      pool,
    ),
  }))
}

/**
 * Ganador del cruce: marcador tras 90' o 120' (incl. prórroga); si empate, tanda de penaltis (`pensHome` / `pensAway`).
 * @param {string | null} homeTeam
 * @param {string | null} awayTeam
 * @param {{ home?: string|number, away?: string|number, pensHome?: string|number, pensAway?: string|number }|null|undefined} cell
 */
export function getKnockoutWinnerFromCell(homeTeam, awayTeam, cell) {
  if (!homeTeam || !awayTeam || !cell || typeof cell !== 'object') return null
  const h = Number(cell.home)
  const a = Number(cell.away)
  if (Number.isNaN(h) || Number.isNaN(a)) return null
  if (h > a) return homeTeam
  if (a > h) return awayTeam
  const ph = Number(cell.pensHome)
  const pa = Number(cell.pensAway)
  if (Number.isNaN(ph) || Number.isNaN(pa)) return null
  if (ph > pa) return homeTeam
  if (pa > ph) return awayTeam
  return null
}

/**
 * @param {string | null} homeTeam
 * @param {string | null} awayTeam
 * @param {string | undefined} rawHome
 * @param {string | undefined} rawAway
 */
export function getKnockoutWinner(homeTeam, awayTeam, rawHome, rawAway) {
  return getKnockoutWinnerFromCell(homeTeam, awayTeam, { home: rawHome, away: rawAway })
}

export function getKnockoutLoserFromCell(homeTeam, awayTeam, cell) {
  const w = getKnockoutWinnerFromCell(homeTeam, awayTeam, cell)
  if (!w) return null
  return w === homeTeam ? awayTeam : homeTeam
}

export function getKnockoutLoser(homeTeam, awayTeam, rawHome, rawAway) {
  return getKnockoutLoserFromCell(homeTeam, awayTeam, { home: rawHome, away: rawAway })
}

/**
 * @param {Record<string, { home?: string, away?: string, pensHome?: string, pensAway?: string }>} prev
 * @param {string} key
 * @param {'home' | 'away' | 'pensHome' | 'pensAway'} side
 * @param {string} val
 */
export function applyKnockoutScorePatch(prev, key, side, val) {
  const cur = { ...(prev[key] || {}), [side]: val }
  const h = Number(cur.home)
  const a = Number(cur.away)
  if (!Number.isNaN(h) && !Number.isNaN(a) && h !== a) {
    delete cur.pensHome
    delete cur.pensAway
  }
  return { ...prev, [key]: cur }
}

function labelOrWinner(team, prevFifa) {
  return team || `Ganador del ${prevFifa}`
}

/**
 * @param {Record<number, { home?: string, away?: string }>} predictions
 * @param {Record<string, { home?: string, away?: string, pensHome?: string, pensAway?: string }>} koScores — claves r32-73, r16-90, qf-97, sf-101, fin-104, tp-103
 */
export function computeFullKnockout(predictions, koScores) {
  /** @type {Record<number, string | null>} */
  const winnerOf = {}

  const r32 = buildRoundOf32Teams(predictions).map(m => {
    const d = R32_DATES[m.fifa]
    const key = `r32-${m.fifa}`
    const cell = koScores[key] && typeof koScores[key] === 'object' ? koScores[key] : {}
    const w = getKnockoutWinnerFromCell(m.homeTeam, m.awayTeam, cell)
    winnerOf[m.fifa] = w
    return {
      fifa: m.fifa,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeLabel: m.homeTeam || 'Por definir (grupos)',
      awayLabel: m.awayTeam || 'Por definir (grupos)',
      dateLabel: d?.labelEs ?? '',
      winner: w,
      scoreKey: key,
    }
  })

  const r16 = R16_BRACKET.map(row => {
    const ht = winnerOf[row.from[0]]
    const at = winnerOf[row.from[1]]
    const key = `r16-${row.fifa}`
    const cell = koScores[key] && typeof koScores[key] === 'object' ? koScores[key] : {}
    const w = getKnockoutWinnerFromCell(ht, at, cell)
    winnerOf[row.fifa] = w
    return {
      ...row,
      homeTeam: ht,
      awayTeam: at,
      homeLabel: labelOrWinner(ht, row.from[0]),
      awayLabel: labelOrWinner(at, row.from[1]),
      winner: w,
      scoreKey: key,
    }
  })

  const qf = QF_BRACKET.map(row => {
    const ht = winnerOf[row.from[0]]
    const at = winnerOf[row.from[1]]
    const key = `qf-${row.fifa}`
    const cell = koScores[key] && typeof koScores[key] === 'object' ? koScores[key] : {}
    const w = getKnockoutWinnerFromCell(ht, at, cell)
    winnerOf[row.fifa] = w
    return {
      ...row,
      homeTeam: ht,
      awayTeam: at,
      homeLabel: labelOrWinner(ht, row.from[0]),
      awayLabel: labelOrWinner(at, row.from[1]),
      winner: w,
      scoreKey: key,
    }
  })

  const semiRows = SF_BRACKET.map(row => {
    const ht = winnerOf[row.from[0]]
    const at = winnerOf[row.from[1]]
    const key = `sf-${row.fifa}`
    const cell = koScores[key] && typeof koScores[key] === 'object' ? koScores[key] : {}
    const w = getKnockoutWinnerFromCell(ht, at, cell)
    winnerOf[row.fifa] = w
    return {
      ...row,
      homeTeam: ht,
      awayTeam: at,
      homeLabel: labelOrWinner(ht, row.from[0]),
      awayLabel: labelOrWinner(at, row.from[1]),
      winner: w,
      scoreKey: key,
    }
  })

  const sf101 = semiRows.find(s => s.fifa === 101)
  const sf102 = semiRows.find(s => s.fifa === 102)

  const cell101 = koScores['sf-101'] && typeof koScores['sf-101'] === 'object' ? koScores['sf-101'] : {}
  const cell102 = koScores['sf-102'] && typeof koScores['sf-102'] === 'object' ? koScores['sf-102'] : {}
  const l101 =
    sf101 &&
    getKnockoutLoserFromCell(sf101.homeTeam, sf101.awayTeam, cell101)
  const l102 =
    sf102 &&
    getKnockoutLoserFromCell(sf102.homeTeam, sf102.awayTeam, cell102)

  const cellTp = koScores['tp-103'] && typeof koScores['tp-103'] === 'object' ? koScores['tp-103'] : {}
  const tpWinner = getKnockoutWinnerFromCell(l101, l102, cellTp)

  const fHome = winnerOf[101]
  const fAway = winnerOf[102]
  const cellFin = koScores['fin-104'] && typeof koScores['fin-104'] === 'object' ? koScores['fin-104'] : {}
  const cupWinner = getKnockoutWinnerFromCell(fHome, fAway, cellFin)

  return {
    round32: r32,
    round16: r16,
    quarter: qf,
    semi: semiRows,
    thirdPlace: {
      fifa: THIRD_PLACE_MATCH.fifa,
      dateLabel: THIRD_PLACE_MATCH.labelEs,
      homeTeam: l101,
      awayTeam: l102,
      homeLabel: l101 || 'Perdedor SF 101',
      awayLabel: l102 || 'Perdedor SF 102',
      winner: tpWinner,
      scoreKey: 'tp-103',
    },
    final: {
      fifa: FINAL_MATCH.fifa,
      dateLabel: FINAL_MATCH.labelEs,
      homeTeam: fHome,
      awayTeam: fAway,
      homeLabel: labelOrWinner(fHome, 101),
      awayLabel: labelOrWinner(fAway, 102),
      winner: cupWinner,
      scoreKey: 'fin-104',
    },
  }
}

export { GROUPS, GROUP_STAGE_MATCHES, GROUP_LETTERS }
