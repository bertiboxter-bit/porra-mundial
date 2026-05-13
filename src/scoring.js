import {
  GROUP_LETTERS,
  GROUPS,
  GROUP_STAGE_MATCHES,
  calculateGroupTable,
  computeFullKnockout,
  getKnockoutLoser,
  getKnockoutWinner,
} from './bracketLogic.js'

function norm(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function pickPred(map, id) {
  if (!map || typeof map !== 'object') return undefined
  const k = String(id)
  return map[k] ?? map[id]
}

/** @returns {{ h: number, a: number } | null} */
function parseScoreCell(p) {
  if (!p || typeof p !== 'object') return null
  const h = Number(p.home)
  const a = Number(p.away)
  if (Number.isNaN(h) || Number.isNaN(a)) return null
  return { h, a }
}

function groupOutcome(h, a) {
  if (h > a) return 'H'
  if (a > h) return 'A'
  return 'D'
}

function groupOfficialComplete(officialPred, groupLetter) {
  const matches = GROUP_STAGE_MATCHES.filter(m => m.group === groupLetter)
  for (const m of matches) {
    if (!parseScoreCell(pickPred(officialPred, m.id))) return false
  }
  return true
}

/** @param {string} scoreKey */
function knockoutPhaseLabel(scoreKey) {
  if (!scoreKey || typeof scoreKey !== 'string') return 'Eliminatorias'
  if (scoreKey.startsWith('r32-')) return '32avos de final'
  if (scoreKey.startsWith('r16-')) return 'Octavos de final'
  if (scoreKey.startsWith('qf-')) return 'Cuartos de final'
  if (scoreKey.startsWith('sf-')) return 'Semifinal'
  if (scoreKey === 'tp-103') return 'Tercer puesto'
  if (scoreKey === 'fin-104') return 'Final'
  return 'Eliminatorias'
}

/**
 * @param {ReturnType<typeof computeFullKnockout>} bracket
 * @param {string} scoreKey
 */
export function getTeamsForScoreKey(bracket, scoreKey) {
  if (!bracket) return null
  for (const row of bracket.round32 || []) {
    if (row.scoreKey === scoreKey) return { home: row.homeTeam, away: row.awayTeam }
  }
  for (const row of bracket.round16 || []) {
    if (row.scoreKey === scoreKey) return { home: row.homeTeam, away: row.awayTeam }
  }
  for (const row of bracket.quarter || []) {
    if (row.scoreKey === scoreKey) return { home: row.homeTeam, away: row.awayTeam }
  }
  for (const row of bracket.semi || []) {
    if (row.scoreKey === scoreKey) return { home: row.homeTeam, away: row.awayTeam }
  }
  if (bracket.thirdPlace?.scoreKey === scoreKey) {
    return { home: bracket.thirdPlace.homeTeam, away: bracket.thirdPlace.awayTeam }
  }
  if (bracket.final?.scoreKey === scoreKey) {
    return { home: bracket.final.homeTeam, away: bracket.final.awayTeam }
  }
  return null
}

/**
 * Desglose de puntos de un participante frente a resultados oficiales.
 * @param {{ predictions?: object, knockout?: object, specials?: object }} userRow
 * @param {Record<string, { home?: string, away?: string }>} officialPred
 * @param {Record<string, { home?: string, away?: string }>} officialKo
 * @param {ReturnType<typeof computeFullKnockout>} officialBracket
 * @param {Record<string, string>} officialSpecials
 * @returns {{ total: number, lines: { matchLabel: string, points: number, reason: string }[] }}
 */
export function getScoreBreakdown(userRow, officialPred, officialKo, officialBracket, officialSpecials) {
  /** @type {{ matchLabel: string, points: number, reason: string }[]} */
  const lines = []
  const pred =
    userRow.predictions && typeof userRow.predictions === 'object' ? userRow.predictions : {}
  const ko = userRow.knockout && typeof userRow.knockout === 'object' ? userRow.knockout : {}
  const spec = userRow.specials && typeof userRow.specials === 'object' ? userRow.specials : {}
  const ospec =
    officialSpecials && typeof officialSpecials === 'object' ? officialSpecials : {}

  for (const m of GROUP_STAGE_MATCHES) {
    const op = parseScoreCell(pickPred(officialPred, m.id))
    const up = parseScoreCell(pickPred(pred, m.id))
    if (!op || !up) continue
    const label = `Grupo ${m.group} · ${m.home} – ${m.away}`
    if (up.h === op.h && up.a === op.a) {
      lines.push({
        matchLabel: label,
        points: 3,
        reason: `Marcador exacto: pronosticaste ${up.h}–${up.a}, igual que el oficial.`,
      })
    } else if (groupOutcome(up.h, up.a) === groupOutcome(op.h, op.a)) {
      lines.push({
        matchLabel: label,
        points: 1,
        reason: `Ganador o empate acertado: tu ${up.h}–${up.a} vs oficial ${op.h}–${op.a}.`,
      })
    }
  }

  for (const g of GROUP_LETTERS) {
    if (!groupOfficialComplete(officialPred, g)) continue
    const teams = GROUPS[g]
    const matches = GROUP_STAGE_MATCHES.filter(m => m.group === g)
    const oTable = calculateGroupTable(officialPred, teams, matches)
    const uTable = calculateGroupTable(pred, teams, matches)
    const n = Math.min(oTable.length, uTable.length)
    for (let i = 0; i < n; i++) {
      if (oTable[i].team !== uTable[i].team) continue
      const pos = i + 1
      lines.push({
        matchLabel: `Grupo ${g} · Clasificación`,
        points: 2,
        reason: `Mismo equipo en la posición ${pos}º (${oTable[i].team}) con todos los partidos del grupo ya disputados oficialmente.`,
      })
    }
  }

  const userBracket = computeFullKnockout(pred, ko)

  for (const key of Object.keys(officialKo || {})) {
    const os = parseScoreCell(officialKo[key])
    const us = parseScoreCell(ko[key])
    if (!os || !us) continue
    if (os.h === os.a || us.h === us.a) continue

    const oTeams = getTeamsForScoreKey(officialBracket, key)
    const uTeams = getTeamsForScoreKey(userBracket, key)
    if (!oTeams?.home || !uTeams?.home) continue
    if (oTeams.home !== uTeams.home || oTeams.away !== uTeams.away) continue

    const phase = knockoutPhaseLabel(key)
    const pairLabel = `${oTeams.home} – ${oTeams.away}`
    const label = `${phase} · ${pairLabel}`
    if (us.h === os.h && us.a === os.a) {
      lines.push({
        matchLabel: label,
        points: 3,
        reason: `Marcador exacto en eliminatorias: ${us.h}–${us.a} (oficial).`,
      })
    } else if (groupOutcome(us.h, us.a) === groupOutcome(os.h, os.a)) {
      lines.push({
        matchLabel: label,
        points: 1,
        reason: `Ganador o empate acertado: tu ${us.h}–${us.a} vs oficial ${os.h}–${os.a}.`,
      })
    }
  }

  const fin = officialKo['fin-104']
  const fh = officialBracket?.final?.homeTeam
  const fa = officialBracket?.final?.awayTeam
  if (fh && fa && fin) {
    const champ = getKnockoutWinner(fh, fa, fin.home, fin.away)
    const runner = getKnockoutLoser(fh, fa, fin.home, fin.away)
    if (champ && norm(spec.champion) === norm(champ)) {
      lines.push({
        matchLabel: 'Predicción especial · Campeón',
        points: 10,
        reason: `Acertaste al campeón: «${champ}».`,
      })
    }
    if (runner && norm(spec.runnerUp) === norm(runner)) {
      lines.push({
        matchLabel: 'Predicción especial · Subcampeón',
        points: 5,
        reason: `Acertaste al subcampeón: «${runner}».`,
      })
    }
  }

  if (ospec.topScorer && norm(spec.topScorer) === norm(ospec.topScorer)) {
    lines.push({
      matchLabel: 'Predicción especial · Máximo goleador',
      points: 5,
      reason: `Coincide con el máximo goleador oficial: «${ospec.topScorer}».`,
    })
  }
  if (ospec.bestPlayer && norm(spec.bestPlayer) === norm(ospec.bestPlayer)) {
    lines.push({
      matchLabel: 'Predicción especial · Mejor jugador',
      points: 5,
      reason: `Coincide con el mejor jugador oficial: «${ospec.bestPlayer}».`,
    })
  }
  if (ospec.topAssist && norm(spec.topAssist) === norm(ospec.topAssist)) {
    lines.push({
      matchLabel: 'Predicción especial · Máximo asistente',
      points: 5,
      reason: `Coincide con el máximo asistente oficial: «${ospec.topAssist}».`,
    })
  }

  const total = lines.reduce((s, l) => s + l.points, 0)
  return { total, lines }
}

/**
 * Puntos de un participante frente a resultados oficiales.
 * @param {{ predictions?: object, knockout?: object, specials?: object }} userRow
 * @param {Record<string, { home?: string, away?: string }>} officialPred
 * @param {Record<string, { home?: string, away?: string }>} officialKo
 * @param {ReturnType<typeof computeFullKnockout>} officialBracket
 * @param {Record<string, string>} officialSpecials
 */
export function scorePredictionRow(userRow, officialPred, officialKo, officialBracket, officialSpecials) {
  return getScoreBreakdown(userRow, officialPred, officialKo, officialBracket, officialSpecials).total
}
