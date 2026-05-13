/**
 * Nombre de selección (español, como en worldCup2026Data) → código ISO / subdivisión
 * (claves de FLAG_COMPONENTS en flagComponents.js)
 */
export const TEAM_TO_FLAG_CODE = {
  México: 'mx',
  'Corea del Sur': 'kr',
  Sudáfrica: 'za',
  Chequia: 'cz',
  Canadá: 'ca',
  Suiza: 'ch',
  Catar: 'qa',
  'Bosnia y Herzegovina': 'ba',
  Brasil: 'br',
  Marruecos: 'ma',
  Escocia: 'gb-sct',
  Haití: 'ht',
  'Estados Unidos': 'us',
  Australia: 'au',
  Paraguay: 'py',
  Turquía: 'tr',
  Alemania: 'de',
  Ecuador: 'ec',
  'Costa de Marfil': 'ci',
  Curazao: 'cw',
  'Países Bajos': 'nl',
  Japón: 'jp',
  Túnez: 'tn',
  Suecia: 'se',
  Bélgica: 'be',
  Irán: 'ir',
  Egipto: 'eg',
  'Nueva Zelanda': 'nz',
  España: 'es',
  Uruguay: 'uy',
  'Arabia Saudí': 'sa',
  'Cabo Verde': 'cv',
  Francia: 'fr',
  Senegal: 'sn',
  Noruega: 'no',
  Irak: 'iq',
  Argentina: 'ar',
  Austria: 'at',
  Argelia: 'dz',
  Jordania: 'jo',
  Portugal: 'pt',
  Colombia: 'co',
  Uzbekistán: 'uz',
  'RD Congo': 'cd',
  Inglaterra: 'gb-eng',
  Croacia: 'hr',
  Panamá: 'pa',
  Ghana: 'gh',
}

/**
 * @param {string | null | undefined} teamName
 * @returns {string | null}
 */
export function getFlagCodeForTeam(teamName) {
  if (!teamName || typeof teamName !== 'string') return null
  const trimmed = teamName.trim()
  return TEAM_TO_FLAG_CODE[trimmed] ?? null
}
