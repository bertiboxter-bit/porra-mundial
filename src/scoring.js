import {
  GROUP_LETTERS,
  GROUPS,
  GROUP_STAGE_MATCHES,
  calculateGroupTable,
  computeFullKnockout,
  getKnockoutLoserFromCell,
  getKnockoutWinnerFromCell,
} from './bracketLogic.js'
import { mergeSpecials } from './porraSpecials.js'

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

function pensEqual(c1, c2) {
  const a = Number(c1?.pensHome)
  const b = Number(c1?.pensAway)
  const c = Number(c2?.pensHome)
  const d = Number(c2?.pensAway)
  if ([a, b, c, d].some(Number.isNaN)) return false
  return a === c && b === d
}

/** Marcador tras tiempo reglamentario (90' o 120' con prórroga) igual y misma tanda de penaltis (si aplica). */
function koElimExactMatch(oCell, uCell) {
  const os = parseScoreCell(oCell)
  const us = parseScoreCell(uCell)
  if (!os || !us || os.h !== us.h || os.a !== us.a) return false
  if (os.h === os.a) return pensEqual(oCell, uCell)
  return true
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

const PODIUM_WEIGHTS = [5, 3, 2]

/**
 * @param {{ matchLabel: string, points: number, reason: string }[]} lines
 * @param {Record<string, string>} mergedUser
 * @param {Record<string, string>} mergedOfficial
 * @param {[string, string, string]} keys
 * @param {string} labelBase
 */
function pushPodiumTriplet(lines, mergedUser, mergedOfficial, keys, labelBase) {
  for (let i = 0; i < 3; i++) {
    const o = norm(mergedOfficial[keys[i]] || '')
    const u = norm(mergedUser[keys[i]] || '')
    if (!o) continue
    if (!u || u !== o) continue
    const w = PODIUM_WEIGHTS[i] ?? 2
    const shown = String(mergedOfficial[keys[i]] || '').trim()
    lines.push({
      matchLabel: `${labelBase} (${i + 1}º)`,
      points: w,
      reason: `Acertaste el ${i + 1}º puesto oficial: «${shown}».`,
    })
  }
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
  const spec = mergeSpecials(userRow.specials)
  const ospec = mergeSpecials(officialSpecials)

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
    const oCell = officialKo[key] && typeof officialKo[key] === 'object' ? officialKo[key] : {}
    const uCell = ko[key] && typeof ko[key] === 'object' ? ko[key] : {}
    const os = parseScoreCell(oCell)
    const us = parseScoreCell(uCell)
    if (!os || !us) continue

    const oTeams = getTeamsForScoreKey(officialBracket, key)
    const uTeams = getTeamsForScoreKey(userBracket, key)
    if (!oTeams?.home || !uTeams?.home) continue
    if (oTeams.home !== uTeams.home || oTeams.away !== uTeams.away) continue

    const ow = getKnockoutWinnerFromCell(oTeams.home, oTeams.away, oCell)
    const uw = getKnockoutWinnerFromCell(uTeams.home, uTeams.away, uCell)
    if (!ow || !uw) continue

    const phase = knockoutPhaseLabel(key)
    const pairLabel = `${oTeams.home} – ${oTeams.away}`
    const label = `${phase} · ${pairLabel}`

    if (koElimExactMatch(oCell, uCell)) {
      const penO =
        os.h === os.a
          ? ` (pen. ${Number(oCell.pensHome)}–${Number(oCell.pensAway)})`
          : ''
      const penU =
        us.h === us.a
          ? `, penaltis ${Number(uCell.pensHome)}–${Number(uCell.pensAway)}`
          : ''
      lines.push({
        matchLabel: label,
        points: 3,
        reason: `Marcador exacto en eliminatorias: ${us.h}–${us.a}${penU}, igual que el oficial${penO}.`,
      })
    } else if (ow === uw) {
      lines.push({
        matchLabel: label,
        points: 1,
        reason: `Ganador de la eliminatoria acertado: «${uw}».`,
      })
    }
  }

  const fin = officialKo['fin-104']
  const fh = officialBracket?.final?.homeTeam
  const fa = officialBracket?.final?.awayTeam
  if (fh && fa && fin && typeof fin === 'object') {
    const finCell = fin
    const fin90 = parseScoreCell(finCell)
    if (fin90) {
      const champ = getKnockoutWinnerFromCell(fh, fa, finCell)
      const runner = getKnockoutLoserFromCell(fh, fa, finCell)
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
  }

  const tpKo = officialKo['tp-103']
  const th = officialBracket?.thirdPlace?.homeTeam
  const ta = officialBracket?.thirdPlace?.awayTeam
  if (th && ta && tpKo && typeof tpKo === 'object') {
    const tp90 = parseScoreCell(tpKo)
    if (tp90) {
      const third = getKnockoutWinnerFromCell(th, ta, tpKo)
      if (third && norm(spec.thirdPlace) === norm(third)) {
        lines.push({
          matchLabel: 'Predicción especial · 3.er puesto',
          points: 4,
          reason: `Acertaste el equipo del tercer puesto: «${third}».`,
        })
      }
    }
  }

  pushPodiumTriplet(lines, spec, ospec, ['topScorer', 'topScorer2', 'topScorer3'], 'Pichichi / goleador')
  pushPodiumTriplet(lines, spec, ospec, ['bestPlayer', 'bestPlayer2', 'bestPlayer3'], 'Mejor jugador')

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
 */
export function scorePredictionRow(userRow, officialPred, officialKo, officialBracket, officialSpecials) {
  return getScoreBreakdown(userRow, officialPred, officialKo, officialBracket, officialSpecials).total
}
