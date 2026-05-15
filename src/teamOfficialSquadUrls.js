/**
 * Slug de ruta en fifa.com para cada selección (Mundial 2026).
 * La convocatoria oficial se publica en FIFA; la URL puede evolucionar, pero el patrón es estable.
 */
const FIFA_WC26_TEAM_BASE =
  'https://www.fifa.com/es/tournaments/mens/worldcup/canadamexicousa2026/teams'

/** @type {Record<string, string>} nombre en español (como en worldCup2026Data) → slug FIFA */
const TEAM_FIFA_SLUG = {
  México: 'mexico',
  'Corea del Sur': 'korea-republic',
  Sudáfrica: 'south-africa',
  Chequia: 'czechia',
  Canadá: 'canada',
  Suiza: 'switzerland',
  Catar: 'qatar',
  'Bosnia y Herzegovina': 'bosnia-and-herzegovina',
  Brasil: 'brazil',
  Marruecos: 'morocco',
  Escocia: 'scotland',
  Haití: 'haiti',
  'Estados Unidos': 'usa',
  Australia: 'australia',
  Paraguay: 'paraguay',
  Turquía: 'turkiye',
  Alemania: 'germany',
  Ecuador: 'ecuador',
  'Costa de Marfil': 'cote-divoire',
  Curazao: 'curacao',
  'Países Bajos': 'netherlands',
  Japón: 'japan',
  Túnez: 'tunisia',
  Suecia: 'sweden',
  Bélgica: 'belgium',
  Irán: 'ir',
  Egipto: 'egypt',
  'Nueva Zelanda': 'new-zealand',
  España: 'spain',
  Uruguay: 'uruguay',
  'Arabia Saudí': 'saudi-arabia',
  'Cabo Verde': 'cape-verde',
  Francia: 'france',
  Senegal: 'senegal',
  Noruega: 'norway',
  Irak: 'iraq',
  Argentina: 'argentina',
  Austria: 'austria',
  Argelia: 'algeria',
  Jordania: 'jordan',
  Portugal: 'portugal',
  Colombia: 'colombia',
  Uzbekistán: 'uzbekistan',
  'RD Congo': 'dr-congo',
  Inglaterra: 'england',
  Croacia: 'croatia',
  Panamá: 'panama',
  Ghana: 'ghana',
}

/**
 * @param {string | null | undefined} teamName
 * @returns {string | null}
 */
export function getOfficialSquadUrl(teamName) {
  if (!teamName || typeof teamName !== 'string') return null
  const slug = TEAM_FIFA_SLUG[teamName.trim()]
  if (!slug) return null
  return `${FIFA_WC26_TEAM_BASE}/${slug}/squad`
}
