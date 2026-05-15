/**
 * IDs de match-centre FIFA (Mundial 2026, fase de grupos).
 * Fuente: calendario oficial publicado en FIFA.com (pareja local/visitante).
 * No hay patrón aritmético: cada partido tiene un id único (400021440–400021511).
 */
import { getFixtureByTeams } from './groupStageFixtures.js'

export const FIFA_MATCH_CENTRE_PATH =
  'https://www.fifa.com/es/match-centre/match/17/285023/289273'

/** @type {Record<string, string>} clave normalizada "equipoA|equipoB" (orden alfabético) */
export const FIFA_CENTRE_ID_BY_TEAM_PAIR = {
  'mexico|sudafrica': '400021443',
  'chequia|corea del sur': '400021441',
  'bosnia y herzegovina|canada': '400021449',
  'estados unidos|paraguay': '400021458',
  'catar|suiza': '400021447',
  'brasil|marruecos': '400021456',
  'escocia|haiti': '400021453',
  'australia|turquia': '400021463',
  'alemania|curazao': '400021464',
  'japon|paises bajos': '400021470',
  'costa de marfil|ecuador': '400021467',
  'suecia|tunez': '400021474',
  'cabo verde|espana': '400021482',
  'belgica|egipto': '400021478',
  'arabia saudi|uruguay': '400021486',
  'iran|nueva zelanda': '400021476',
  'francia|senegal': '400021490',
  'irak|noruega': '400021488',
  'argelia|argentina': '400021496',
  'austria|jordania': '400021498',
  'portugal|rd congo': '400021502',
  'croacia|inglaterra': '400021507',
  'ghana|panama': '400021510',
  'colombia|uzbekistan': '400021504',
  'chequia|sudafrica': '400021440',
  'bosnia y herzegovina|suiza': '400021446',
  'canada|catar': '400021450',
  'corea del sur|mexico': '400021442',
  'australia|estados unidos': '400021462',
  'escocia|marruecos': '400021454',
  'brasil|haiti': '400021457',
  'paraguay|turquia': '400021460',
  'paises bajos|suecia': '400021472',
  'alemania|costa de marfil': '400021469',
  'curazao|ecuador': '400021465',
  'japon|tunez': '400021475',
  'arabia saudi|espana': '400021483',
  'belgica|iran': '400021477',
  'cabo verde|uruguay': '400021487',
  'egipto|nueva zelanda': '400021480',
  'argentina|austria': '400021494',
  'francia|irak': '400021492',
  'noruega|senegal': '400021491',
  'argelia|jordania': '400021499',
  'portugal|uzbekistan': '400021503',
  'ghana|inglaterra': '400021506',
  'croacia|panama': '400021511',
  'colombia|rd congo': '400021501',
  'canada|suiza': '400021451',
  'bosnia y herzegovina|catar': '400021448',
  'brasil|escocia': '400021455',
  'haiti|marruecos': '400021452',
  'chequia|mexico': '400021444',
  'corea del sur|sudafrica': '400021445',
  'costa de marfil|curazao': '400021468',
  'alemania|ecuador': '400021466',
  'japon|suecia': '400021471',
  'paises bajos|tunez': '400021473',
  'estados unidos|turquia': '400021459',
  'australia|paraguay': '400021461',
  'francia|noruega': '400021489',
  'irak|senegal': '400021493',
  'arabia saudi|cabo verde': '400021485',
  'espana|uruguay': '400021484',
  'egipto|iran': '400021479',
  'belgica|nueva zelanda': '400021481',
  'inglaterra|panama': '400021508',
  'croacia|ghana': '400021509',
  'colombia|portugal': '400021505',
  'rd congo|uzbekistan': '400021500',
  'argelia|austria': '400021497',
  'argentina|jordania': '400021495',
}

/**
 * @param {string} name
 */
export function normalizeTeamForFifaLookup(name) {
  return String(name ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * @param {string} home
 * @param {string} away
 */
export function fifaCentrePairKey(home, away) {
  return [normalizeTeamForFifaLookup(home), normalizeTeamForFifaLookup(away)].sort().join('|')
}

/**
 * @param {string} home
 * @param {string} away
 * @returns {string | null}
 */
export function getFifaCentreIdForTeams(home, away) {
  if (!home || !away) return null
  const directed = getFixtureByTeams(home, away)?.fifaCentreId
  if (directed) return directed
  return FIFA_CENTRE_ID_BY_TEAM_PAIR[fifaCentrePairKey(home, away)] ?? null
}
