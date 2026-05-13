/**
 * Mundial FIFA 2026 — grupos tras el sorteo oficial (dic. 2025).
 * Fase de grupos: calendario tipo FIFA (A1–A4 = orden de bolillas en el grupo).
 */

/** Ventana de calendario FIFA — fase de grupos (todas las selecciones, 11–27 jun 2026). */
export const GROUP_MATCHDAY_LABEL = {
  1: '11–17 de junio de 2026',
  2: '18–21 de junio de 2026',
  3: '22–27 de junio de 2026',
}

export const GROUP_LETTERS = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
]

/** @type {Record<string, string[]>} */
export const GROUPS = {
  A: ['México', 'Corea del Sur', 'Sudáfrica', 'Chequia'],
  B: ['Canadá', 'Suiza', 'Catar', 'Bosnia y Herzegovina'],
  C: ['Brasil', 'Marruecos', 'Escocia', 'Haití'],
  D: ['Estados Unidos', 'Australia', 'Paraguay', 'Turquía'],
  E: ['Alemania', 'Ecuador', 'Costa de Marfil', 'Curazao'],
  F: ['Países Bajos', 'Japón', 'Túnez', 'Suecia'],
  G: ['Bélgica', 'Irán', 'Egipto', 'Nueva Zelanda'],
  H: ['España', 'Uruguay', 'Arabia Saudí', 'Cabo Verde'],
  I: ['Francia', 'Senegal', 'Noruega', 'Irak'],
  J: ['Argentina', 'Austria', 'Argelia', 'Jordania'],
  K: ['Portugal', 'Colombia', 'Uzbekistán', 'RD Congo'],
  L: ['Inglaterra', 'Croacia', 'Panamá', 'Ghana'],
}

/**
 * Calendario local de 4 equipos (posiciones 1–4 del sorteo del grupo).
 * J1: 1v2, 3v4 | J2: 1v3, 4v2 | J3: 1v4, 2v3
 */
function groupRoundRobinMatches(group, teams) {
  const [p1, p2, p3, p4] = teams
  return [
    { group, matchday: 1, home: p1, away: p2, dateLabel: GROUP_MATCHDAY_LABEL[1] },
    { group, matchday: 1, home: p3, away: p4, dateLabel: GROUP_MATCHDAY_LABEL[1] },
    { group, matchday: 2, home: p1, away: p3, dateLabel: GROUP_MATCHDAY_LABEL[2] },
    { group, matchday: 2, home: p4, away: p2, dateLabel: GROUP_MATCHDAY_LABEL[2] },
    { group, matchday: 3, home: p1, away: p4, dateLabel: GROUP_MATCHDAY_LABEL[3] },
    { group, matchday: 3, home: p2, away: p3, dateLabel: GROUP_MATCHDAY_LABEL[3] },
  ]
}

let _id = 0
export const GROUP_STAGE_MATCHES = GROUP_LETTERS.flatMap(letter =>
  groupRoundRobinMatches(letter, GROUPS[letter]).map(m => ({
    id: ++_id,
    ...m,
  })),
)

/**
 * 32avos — plantilla FIFA (partidos 73–88).
 * side: { kind:'first'|'second'|'third', group?: string, thirdFrom?: string[] }
 */
export const ROUND_OF_32 = [
  { fifa: 73, home: { kind: 'second', group: 'A' }, away: { kind: 'second', group: 'B' } },
  {
    fifa: 74,
    home: { kind: 'first', group: 'E' },
    away: { kind: 'third', thirdFrom: ['A', 'B', 'C', 'D', 'F'] },
  },
  { fifa: 75, home: { kind: 'first', group: 'F' }, away: { kind: 'second', group: 'C' } },
  { fifa: 76, home: { kind: 'first', group: 'C' }, away: { kind: 'second', group: 'F' } },
  {
    fifa: 77,
    home: { kind: 'first', group: 'I' },
    away: { kind: 'third', thirdFrom: ['C', 'D', 'F', 'G', 'H'] },
  },
  { fifa: 78, home: { kind: 'second', group: 'E' }, away: { kind: 'second', group: 'I' } },
  {
    fifa: 79,
    home: { kind: 'first', group: 'A' },
    away: { kind: 'third', thirdFrom: ['C', 'E', 'F', 'H', 'I'] },
  },
  {
    fifa: 80,
    home: { kind: 'first', group: 'L' },
    away: { kind: 'third', thirdFrom: ['E', 'H', 'I', 'J', 'K'] },
  },
  {
    fifa: 81,
    home: { kind: 'first', group: 'D' },
    away: { kind: 'third', thirdFrom: ['B', 'E', 'F', 'I', 'J'] },
  },
  {
    fifa: 82,
    home: { kind: 'first', group: 'G' },
    away: { kind: 'third', thirdFrom: ['A', 'E', 'H', 'I', 'J'] },
  },
  { fifa: 83, home: { kind: 'second', group: 'K' }, away: { kind: 'second', group: 'L' } },
  { fifa: 84, home: { kind: 'first', group: 'H' }, away: { kind: 'second', group: 'J' } },
  {
    fifa: 85,
    home: { kind: 'first', group: 'B' },
    away: { kind: 'third', thirdFrom: ['E', 'F', 'G', 'I', 'J'] },
  },
  { fifa: 86, home: { kind: 'first', group: 'J' }, away: { kind: 'second', group: 'H' } },
  {
    fifa: 87,
    home: { kind: 'first', group: 'K' },
    away: { kind: 'third', thirdFrom: ['D', 'E', 'I', 'J', 'L'] },
  },
  { fifa: 88, home: { kind: 'second', group: 'D' }, away: { kind: 'second', group: 'G' } },
]
