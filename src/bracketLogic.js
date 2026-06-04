import {
  GROUP_LETTERS,
  GROUPS,
  GROUP_STAGE_MATCHES,
  ROUND_OF_32,
} from './worldCup2026Data.js'
import { THIRD_ASSIGNMENT_BY_QUALIFIED_GROUPS } from './thirdPlaceAnnexC.js'
import {
  FINAL_MATCH,
  QF_BRACKET,
  R16_BRACKET,
  R32_DATES,
  SF_BRACKET,
  THIRD_PLACE_MATCH,
} from './knockoutSchedule.js'
import { sanitizeScoreInput } from './scoreInput.js'

/** @typedef {{ team: string, pts: number, gf: number, gc: number, dg: number }} TableRow */

/** Clave reservada dentro del JSON `predictions` (no coincide con ids de partido). */
export const GROUP_TIE_BREAK_KEY = '__groupTieBreak'

function sameGroupStats(a, b) {
  return a.pts === b.pts && a.dg === b.dg && a.gf === b.gf
}

/**
 * Mini-tabla entre equipos empatados a puntos (solo partidos directos entre ellos).
 * @param {Record<string, unknown>} predictions
 * @param {{ home: string, away: string }[]} matches
 * @param {string[]} teamNames
 * @returns {Record<string, TableRow>}
 */
function headToHeadStats(predictions, matches, teamNames) {
  const set = new Set(teamNames)
  /** @type {Record<string, TableRow>} */
  const table = {}
  teamNames.forEach(team => {
    table[team] = { team, pts: 0, gf: 0, gc: 0, dg: 0 }
  })

  matches.forEach(match => {
    if (!set.has(match.home) || !set.has(match.away)) return
    const prediction = predictions?.[match.id]
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

  return table
}

/** @param {TableRow} a @param {TableRow} b @param {Record<string, TableRow>} h2h */
function compareTeamsFifaTieCluster(a, b, h2h) {
  const ha = h2h[a.team] || a
  const hb = h2h[b.team] || b
  if (hb.pts !== ha.pts) return hb.pts - ha.pts
  if (hb.dg !== ha.dg) return hb.dg - ha.dg
  if (hb.gf !== ha.gf) return hb.gf - ha.gf
  if (b.dg !== a.dg) return b.dg - a.dg
  if (b.gf !== a.gf) return b.gf - a.gf
  return a.team.localeCompare(b.team, 'es')
}

/**
 * @param {TableRow[]} rows
 * @param {{ home: string, away: string }[]} matches
 * @param {Record<string, unknown>} predictions
 * @param {Record<string, string[]> | null} tieMap
 */
function rankGroupTableWithHeadToHead(rows, matches, predictions, tieMap) {
  const byPts = [...rows].sort((a, b) => b.pts - a.pts)
  const ranked = []

  let i = 0
  while (i < byPts.length) {
    let j = i + 1
    while (j < byPts.length && byPts[j].pts === byPts[i].pts) j++
    const cluster = byPts.slice(i, j)

    if (cluster.length > 1) {
      const teamNames = cluster.map(r => r.team)
      const h2h = headToHeadStats(predictions, matches, teamNames)
      cluster.sort((a, b) => compareTeamsFifaTieCluster(a, b, h2h))
      ranked.push(...applyTiesWithinRuns(cluster, tieMap))
    } else {
      ranked.push(...cluster)
    }
    i = j
  }

  return ranked
}

/**
 * Firma estable de un conjunto de equipos empatados (mismo PTS/DG/GF).
 * @param {string[]} teamNames
 */
export function tieSignatureForTeams(teamNames) {
  return [...teamNames].sort((x, y) => x.localeCompare(y, 'es')).join('|')
}

/**
 * @param {Record<string, unknown>} predictions
 * @param {string} groupLetter
 * @returns {Record<string, string[]> | null}
 */
function tieOrderMapForGroup(predictions, groupLetter) {
  if (!predictions || typeof predictions !== 'object' || !groupLetter) return null
  const root = predictions[GROUP_TIE_BREAK_KEY]
  if (!root || typeof root !== 'object') return null
  const perGroup = /** @type {Record<string, unknown>} */ (root)[groupLetter]
  return perGroup && typeof perGroup === 'object' ? /** @type {Record<string, string[]>} */ (perGroup) : null
}

/** @param {unknown} saved @param {string[]} clusterTeams */
export function tieOrderIsValidForCluster(saved, clusterTeams) {
  if (!Array.isArray(saved) || saved.length !== clusterTeams.length) return false
  const set = new Set(clusterTeams)
  if (saved.some(t => !set.has(t))) return false
  return new Set(saved).size === saved.length
}

/**
 * @param {TableRow[]} rows
 * @param {Record<string, string[]> | null} tieMap
 */
function applyTiesWithinRuns(rows, tieMap) {
  if (!tieMap || rows.length === 0) return rows
  const out = []
  let i = 0
  while (i < rows.length) {
    let j = i + 1
    while (j < rows.length && sameGroupStats(rows[i], rows[j])) j++
    const run = rows.slice(i, j)
    if (run.length > 1) {
      const cluster = run.map(r => r.team)
      const sig = tieSignatureForTeams(cluster)
      const saved = tieMap[sig]
      if (tieOrderIsValidForCluster(saved, cluster)) {
        const idx = new Map(saved.map((t, k) => [t, k]))
        run.sort((a, b) => (idx.get(a.team) ?? 999) - (idx.get(b.team) ?? 999))
      } else {
        run.sort((a, b) => a.team.localeCompare(b.team, 'es'))
      }
      out.push(...run)
    } else {
      out.push(...run)
    }
    i = j
  }
  return out
}

/**
 * Tramos consecutivos con el mismo PTS, DG y GF (para UI de desempate).
 * @param {TableRow[]} table
 * @returns {{ teams: string[], signature: string }[]}
 */
export function findGroupTieRuns(table) {
  const runs = []
  let i = 0
  while (i < table.length) {
    let j = i + 1
    while (j < table.length && sameGroupStats(table[i], table[j])) j++
    const slice = table.slice(i, j)
    if (slice.length > 1) {
      const teams = slice.map(r => r.team)
      runs.push({ teams, signature: tieSignatureForTeams(teams) })
    }
    i = j
  }
  return runs
}

/**
 * Empates PTS/DG/GF sin orden guardado y confirmado en `predictions.__groupTieBreak`.
 * @param {Record<string, unknown>} predictions
 * @returns {{ group: string, teams: string[] }[]}
 */
export function listPendingGroupTieBreaks(predictions) {
  const pending = []
  GROUP_LETTERS.forEach(groupLetter => {
    const teams = GROUPS[groupLetter]
    const matches = GROUP_STAGE_MATCHES.filter(m => m.group === groupLetter)
    const table = calculateGroupTable(predictions, teams, matches, groupLetter)
    const tieMap = tieOrderMapForGroup(predictions, groupLetter)
    for (const run of findGroupTieRuns(table)) {
      const saved = tieMap?.[run.signature]
      if (!tieOrderIsValidForCluster(saved, run.teams)) {
        pending.push({ group: groupLetter, teams: run.teams })
      }
    }
  })
  return pending
}

/**
 * Rellena órdenes de desempate pendientes con la clasificación mostrada en la tabla
 * (después de criterios FIFA automáticos). Útil en resultados oficiales sin «Confirmar orden».
 * @param {Record<string, unknown>} predictions
 * @returns {Record<string, unknown>}
 */
export function applyDefaultTieOrdersToPredictions(predictions) {
  const base = predictions && typeof predictions === 'object' ? { ...predictions } : {}
  /** @type {Record<string, Record<string, string[]>>} */
  const tieRoot =
    base[GROUP_TIE_BREAK_KEY] && typeof base[GROUP_TIE_BREAK_KEY] === 'object'
      ? { .../** @type {Record<string, Record<string, string[]>>} */ (base[GROUP_TIE_BREAK_KEY]) }
      : {}

  GROUP_LETTERS.forEach(groupLetter => {
    const teams = GROUPS[groupLetter]
    const matches = GROUP_STAGE_MATCHES.filter(match => match.group === groupLetter)
    const table = calculateGroupTable(base, teams, matches, groupLetter)
    const prevGroup = tieRoot[groupLetter]
    const groupMap = prevGroup && typeof prevGroup === 'object' ? { ...prevGroup } : {}
    let groupChanged = false

    for (const run of findGroupTieRuns(table)) {
      if (tieOrderIsValidForCluster(groupMap[run.signature], run.teams)) continue
      const clusterSet = new Set(run.teams)
      const orderFromTable = table.filter(row => clusterSet.has(row.team)).map(row => row.team)
      groupMap[run.signature] =
        orderFromTable.length === run.teams.length ? orderFromTable : [...run.teams]
      groupChanged = true
    }

    if (groupChanged) tieRoot[groupLetter] = groupMap
  })

  if (Object.keys(tieRoot).length === 0) return base
  return { ...base, [GROUP_TIE_BREAK_KEY]: tieRoot }
}

/**
 * @param {Record<string, unknown>} predictions
 * @param {string[]} teams
 * @param {{ id: number, home: string, away: string }[]} matches
 * @param {string} [groupLetter] — si se indica, se aplican órdenes manuales en `predictions.__groupTieBreak`
 */
export function calculateGroupTable(predictions, teams, matches, groupLetter) {
  /** @type {Record<string, TableRow>} */
  const table = {}

  teams.forEach(team => {
    table[team] = { team, pts: 0, gf: 0, gc: 0, dg: 0 }
  })

  matches.forEach(match => {
    const prediction = predictions?.[match.id]
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

  const rows = Object.values(table)
  const tieMap = groupLetter ? tieOrderMapForGroup(predictions, groupLetter) : null
  return rankGroupTableWithHeadToHead(rows, matches, predictions, tieMap)
}

function tableForGroup(predictions, groupLetter) {
  const teams = GROUPS[groupLetter]
  const matches = GROUP_STAGE_MATCHES.filter(m => m.group === groupLetter)
  return calculateGroupTable(predictions, teams, matches, groupLetter)
}

function scoreCellIsComplete(cell) {
  if (!cell || typeof cell !== 'object') return false
  const homeRaw = cell.home
  const awayRaw = cell.away
  if (homeRaw === '' || homeRaw == null || awayRaw === '' || awayRaw == null) return false
  const home = Number(homeRaw)
  const away = Number(awayRaw)
  return !Number.isNaN(home) && !Number.isNaN(away)
}

function groupIsComplete(predictions, groupLetter) {
  const matches = GROUP_STAGE_MATCHES.filter(m => m.group === groupLetter)
  return matches.every(m => scoreCellIsComplete(predictions?.[m.id]))
}

/**
 * Estado visual de clasificación por selección en fase de grupos.
 * Conservador mientras no están todos los grupos completos: solo marca eliminado al 4.º de un grupo cerrado.
 * El 3.º se marca eliminado únicamente cuando ya está resuelto el ranking global de mejores terceros.
 * @param {Record<string, unknown>} predictions
 * @returns {Record<string, { status: 'qualified' | 'third-qualified' | 'third-pending' | 'eliminated', group: string, position: number }>}
 */
export function buildGroupQualificationStatus(predictions) {
  /** @type {Record<string, { status: 'qualified' | 'third-qualified' | 'third-pending' | 'eliminated', group: string, position: number }>} */
  const statusByTeam = {}
  const completeGroups = new Set(GROUP_LETTERS.filter(g => groupIsComplete(predictions, g)))
  const allGroupsComplete = completeGroups.size === GROUP_LETTERS.length
  const advancingThirdGroups = allGroupsComplete
    ? new Set(thirdPlaceGlobalOrder(predictions).slice(0, 8).map(t => t.group))
    : new Set()

  GROUP_LETTERS.forEach(groupLetter => {
    if (!completeGroups.has(groupLetter)) return
    const table = tableForGroup(predictions, groupLetter)
    table.forEach((row, idx) => {
      const position = idx + 1
      if (position <= 2) {
        statusByTeam[row.team] = { status: 'qualified', group: groupLetter, position }
        return
      }
      if (position === 3) {
        statusByTeam[row.team] = {
          status: allGroupsComplete && advancingThirdGroups.has(groupLetter)
            ? 'third-qualified'
            : allGroupsComplete
              ? 'eliminated'
              : 'third-pending',
          group: groupLetter,
          position,
        }
        return
      }
      statusByTeam[row.team] = { status: 'eliminated', group: groupLetter, position }
    })
  })

  return statusByTeam
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
    // FIFA: fair play, clasificación mundial y sorteo después de GF; no modelado aquí → desempate estable.
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
  const thirdTeamByGroup = new Map(rankedThirds.map(t => [t.group, t.team]))
  /** Firma de los 8 grupos con 3.º clasificado (Anexo C FIFA). */
  const qualifiedThirdSignature = [...advancing.map(t => t.group)].sort().join('')
  const thirdAssignment =
    THIRD_ASSIGNMENT_BY_QUALIFIED_GROUPS[qualifiedThirdSignature] ?? null
  return { tablesByGroup, thirdTeamByGroup, advancing, thirdAssignment }
}

/**
 * Cruce 32avos: lado con posible 3.º.
 * @param {{ kind: string, group?: string, thirdFrom?: string[] }} side
 * @param {{ tablesByGroup: Record<string, TableRow[]>, thirdTeamByGroup: Map<string, string>, thirdAssignment: Record<string, string> | null }} ctx
 * @param {number} matchFifa — partido FIFA (los huecos de 3.º usan 74, 77, 79, 80, 81, 82, 85, 87).
 */
function resolveTeamForSide(side, ctx, matchFifa) {
  const { tablesByGroup, thirdTeamByGroup, thirdAssignment } = ctx
  if (side.kind === 'first') {
    return tablesByGroup[side.group]?.[0]?.team ?? null
  }
  if (side.kind === 'second') {
    return tablesByGroup[side.group]?.[1]?.team ?? null
  }
  if (side.kind === 'third' && side.thirdFrom && thirdAssignment) {
    const groupLetter = thirdAssignment[String(matchFifa)]
    if (!groupLetter || !side.thirdFrom.includes(groupLetter)) return null
    return thirdTeamByGroup.get(groupLetter) ?? null
  }
  return null
}

function groupPositionSourceLabel(side, matchFifa, thirdAssignment) {
  if (side.kind === 'first') return `1.º Grupo ${side.group}`
  if (side.kind === 'second') return `2.º Grupo ${side.group}`
  if (side.kind === 'third' && side.thirdFrom) {
    const assignedGroup = thirdAssignment?.[String(matchFifa)]
    return assignedGroup
      ? `3.º Grupo ${assignedGroup} (mejor tercero)`
      : `3.º Grupo ${side.thirdFrom.join('/')}`
  }
  return ''
}

/**
 * @param {Record<number, { home?: string, away?: string }>} predictions
 * @returns {{ fifa: number, homeTeam: string | null, awayTeam: string | null, homeSource: string, awaySource: string }[]}
 */
export function buildRoundOf32Teams(predictions) {
  const ctx = createQualifierContext(predictions)
  return ROUND_OF_32.map(m => ({
    fifa: m.fifa,
    homeTeam: resolveTeamForSide(m.home, ctx, m.fifa),
    awayTeam: resolveTeamForSide(m.away, ctx, m.fifa),
    homeSource: groupPositionSourceLabel(m.home, m.fifa, ctx.thirdAssignment),
    awaySource: groupPositionSourceLabel(m.away, m.fifa, ctx.thirdAssignment),
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
  const cur = { ...(prev[key] || {}), [side]: sanitizeScoreInput(val) }
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
      homeSource: m.homeSource,
      awaySource: m.awaySource,
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
      homeSource: `Ganador partido ${row.from[0]}`,
      awaySource: `Ganador partido ${row.from[1]}`,
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
      homeSource: `Ganador partido ${row.from[0]}`,
      awaySource: `Ganador partido ${row.from[1]}`,
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
      homeSource: `Ganador partido ${row.from[0]}`,
      awaySource: `Ganador partido ${row.from[1]}`,
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
      homeSource: 'Perdedor partido 101',
      awaySource: 'Perdedor partido 102',
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
      homeSource: 'Ganador partido 101',
      awaySource: 'Ganador partido 102',
      winner: cupWinner,
      scoreKey: 'fin-104',
    },
  }
}

export { GROUPS, GROUP_STAGE_MATCHES, GROUP_LETTERS }
