/**
 * Calendario oficial aproximado (Wikipedia / FIFA) — junio–julio 2026.
 * Emparejamientos R16+ según reglamento del torneo.
 */

/** @type {Record<number, { dateIso: string, labelEs: string }>} */
export const R32_DATES = {
  73: { dateIso: '2026-06-28', labelEs: '28 jun 2026' },
  76: { dateIso: '2026-06-29', labelEs: '29 jun 2026' },
  74: { dateIso: '2026-06-29', labelEs: '29 jun 2026' },
  75: { dateIso: '2026-06-29', labelEs: '29 jun 2026' },
  78: { dateIso: '2026-06-30', labelEs: '30 jun 2026' },
  77: { dateIso: '2026-06-30', labelEs: '30 jun 2026' },
  79: { dateIso: '2026-06-30', labelEs: '30 jun 2026' },
  80: { dateIso: '2026-07-01', labelEs: '1 jul 2026' },
  82: { dateIso: '2026-07-01', labelEs: '1 jul 2026' },
  81: { dateIso: '2026-07-01', labelEs: '1 jul 2026' },
  84: { dateIso: '2026-07-02', labelEs: '2 jul 2026' },
  83: { dateIso: '2026-07-02', labelEs: '2 jul 2026' },
  85: { dateIso: '2026-07-02', labelEs: '2 jul 2026' },
  88: { dateIso: '2026-07-03', labelEs: '3 jul 2026' },
  86: { dateIso: '2026-07-03', labelEs: '3 jul 2026' },
  87: { dateIso: '2026-07-03', labelEs: '3 jul 2026' },
}

/** Octavos (partidos 89–96) */
export const R16_BRACKET = [
  { fifa: 90, from: [73, 75], dateIso: '2026-07-04', labelEs: '4 jul 2026' },
  { fifa: 89, from: [74, 77], dateIso: '2026-07-04', labelEs: '4 jul 2026' },
  { fifa: 91, from: [76, 78], dateIso: '2026-07-05', labelEs: '5 jul 2026' },
  { fifa: 92, from: [79, 80], dateIso: '2026-07-05', labelEs: '5 jul 2026' },
  { fifa: 93, from: [83, 84], dateIso: '2026-07-06', labelEs: '6 jul 2026' },
  { fifa: 94, from: [81, 82], dateIso: '2026-07-06', labelEs: '6 jul 2026' },
  { fifa: 95, from: [86, 88], dateIso: '2026-07-07', labelEs: '7 jul 2026' },
  { fifa: 96, from: [85, 87], dateIso: '2026-07-07', labelEs: '7 jul 2026' },
]

export const QF_BRACKET = [
  { fifa: 97, from: [89, 90], dateIso: '2026-07-09', labelEs: '9 jul 2026' },
  { fifa: 98, from: [93, 94], dateIso: '2026-07-10', labelEs: '10 jul 2026' },
  { fifa: 99, from: [91, 92], dateIso: '2026-07-11', labelEs: '11 jul 2026' },
  { fifa: 100, from: [95, 96], dateIso: '2026-07-11', labelEs: '11 jul 2026' },
]

export const SF_BRACKET = [
  { fifa: 101, from: [97, 98], dateIso: '2026-07-14', labelEs: '14 jul 2026' },
  { fifa: 102, from: [99, 100], dateIso: '2026-07-15', labelEs: '15 jul 2026' },
]

export const THIRD_PLACE_MATCH = {
  fifa: 103,
  fromLosers: [101, 102],
  dateIso: '2026-07-18',
  labelEs: '18 jul 2026',
}

export const FINAL_MATCH = {
  fifa: 104,
  from: [101, 102],
  dateIso: '2026-07-19',
  labelEs: '19 jul 2026',
}
