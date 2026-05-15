import { fifaCentrePairKey } from './fifaMatchCentreIds.js'

/**
 * Inicio oficial (hora del estadio → Europe/Madrid, CEST jun 2026).
 * @type {Record<string, { kickoffLabelEs: string }>}
 */
const KICKOFF_BY_PAIR = {
  'mexico|sudafrica': { kickoffLabelEs: 'vie, 12 jun 2026 · 04:00 (España)' },
  'chequia|corea del sur': { kickoffLabelEs: 'vie, 12 jun 2026 · 11:00 (España)' },
  'bosnia y herzegovina|canada': { kickoffLabelEs: 'sáb, 13 jun 2026 · 02:00 (España)' },
  'estados unidos|paraguay': { kickoffLabelEs: 'sáb, 13 jun 2026 · 11:00 (España)' },
  'catar|suiza': { kickoffLabelEs: 'dom, 14 jun 2026 · 05:00 (España)' },
  'brasil|marruecos': { kickoffLabelEs: 'dom, 14 jun 2026 · 05:00 (España)' },
  'escocia|haiti': { kickoffLabelEs: 'dom, 14 jun 2026 · 08:00 (España)' },
  'australia|turquia': { kickoffLabelEs: 'dom, 14 jun 2026 · 14:00 (España)' },
  'alemania|curazao': { kickoffLabelEs: 'lun, 15 jun 2026 · 01:00 (España)' },
  'japon|paises bajos': { kickoffLabelEs: 'lun, 15 jun 2026 · 04:00 (España)' },
  'costa de marfil|ecuador': { kickoffLabelEs: 'lun, 15 jun 2026 · 06:00 (España)' },
  'suecia|tunez': { kickoffLabelEs: 'lun, 15 jun 2026 · 11:00 (España)' },
  'cabo verde|espana': { kickoffLabelEs: 'lun, 15 jun 2026 · 23:00 (España)' },
  'belgica|egipto': { kickoffLabelEs: 'mar, 16 jun 2026 · 05:00 (España)' },
  'arabia saudi|uruguay': { kickoffLabelEs: 'mar, 16 jun 2026 · 05:00 (España)' },
  'iran|nueva zelanda': { kickoffLabelEs: 'mar, 16 jun 2026 · 11:00 (España)' },
  'francia|senegal': { kickoffLabelEs: 'mié, 17 jun 2026 · 02:00 (España)' },
  'irak|noruega': { kickoffLabelEs: 'mié, 17 jun 2026 · 05:00 (España)' },
  'argelia|argentina': { kickoffLabelEs: 'mié, 17 jun 2026 · 09:00 (España)' },
  'austria|jordania': { kickoffLabelEs: 'mié, 17 jun 2026 · 14:00 (España)' },
  'portugal|rd congo': { kickoffLabelEs: 'jue, 18 jun 2026 · 01:00 (España)' },
  'croacia|inglaterra': { kickoffLabelEs: 'jue, 18 jun 2026 · 04:00 (España)' },
  'ghana|panama': { kickoffLabelEs: 'jue, 18 jun 2026 · 06:00 (España)' },
  'colombia|uzbekistan': { kickoffLabelEs: 'jue, 18 jun 2026 · 11:00 (España)' },
  'chequia|sudafrica': { kickoffLabelEs: 'jue, 18 jun 2026 · 23:00 (España)' },
  'bosnia y herzegovina|suiza': { kickoffLabelEs: 'vie, 19 jun 2026 · 05:00 (España)' },
  'canada|catar': { kickoffLabelEs: 'vie, 19 jun 2026 · 08:00 (España)' },
  'corea del sur|mexico': { kickoffLabelEs: 'vie, 19 jun 2026 · 10:00 (España)' },
  'australia|estados unidos': { kickoffLabelEs: 'sáb, 20 jun 2026 · 05:00 (España)' },
  'escocia|marruecos': { kickoffLabelEs: 'sáb, 20 jun 2026 · 05:00 (España)' },
  'brasil|haiti': { kickoffLabelEs: 'sáb, 20 jun 2026 · 07:30 (España)' },
  'paraguay|turquia': { kickoffLabelEs: 'sáb, 20 jun 2026 · 13:00 (España)' },
  'paises bajos|suecia': { kickoffLabelEs: 'dom, 21 jun 2026 · 01:00 (España)' },
  'alemania|costa de marfil': { kickoffLabelEs: 'dom, 21 jun 2026 · 03:00 (España)' },
  'curazao|ecuador': { kickoffLabelEs: 'dom, 21 jun 2026 · 08:00 (España)' },
  'japon|tunez': { kickoffLabelEs: 'dom, 21 jun 2026 · 13:00 (España)' },
  'arabia saudi|espana': { kickoffLabelEs: 'dom, 21 jun 2026 · 23:00 (España)' },
  'belgica|iran': { kickoffLabelEs: 'lun, 22 jun 2026 · 05:00 (España)' },
  'cabo verde|uruguay': { kickoffLabelEs: 'lun, 22 jun 2026 · 05:00 (España)' },
  'egipto|nueva zelanda': { kickoffLabelEs: 'lun, 22 jun 2026 · 11:00 (España)' },
  'argentina|austria': { kickoffLabelEs: 'mar, 23 jun 2026 · 01:00 (España)' },
  'francia|irak': { kickoffLabelEs: 'mar, 23 jun 2026 · 04:00 (España)' },
  'noruega|senegal': { kickoffLabelEs: 'mar, 23 jun 2026 · 07:00 (España)' },
  'argelia|jordania': { kickoffLabelEs: 'mar, 23 jun 2026 · 13:00 (España)' },
  'portugal|uzbekistan': { kickoffLabelEs: 'mié, 24 jun 2026 · 01:00 (España)' },
  'ghana|inglaterra': { kickoffLabelEs: 'mié, 24 jun 2026 · 03:00 (España)' },
  'croacia|panama': { kickoffLabelEs: 'mié, 24 jun 2026 · 06:00 (España)' },
  'colombia|rd congo': { kickoffLabelEs: 'mié, 24 jun 2026 · 11:00 (España)' },
  'canada|suiza': { kickoffLabelEs: 'jue, 25 jun 2026 · 05:00 (España)' },
  'bosnia y herzegovina|catar': { kickoffLabelEs: 'jue, 25 jun 2026 · 05:00 (España)' },
  'brasil|escocia': { kickoffLabelEs: 'jue, 25 jun 2026 · 05:00 (España)' },
  'haiti|marruecos': { kickoffLabelEs: 'jue, 25 jun 2026 · 05:00 (España)' },
  'chequia|mexico': { kickoffLabelEs: 'jue, 25 jun 2026 · 10:00 (España)' },
  'corea del sur|sudafrica': { kickoffLabelEs: 'jue, 25 jun 2026 · 10:00 (España)' },
  'costa de marfil|curazao': { kickoffLabelEs: 'vie, 26 jun 2026 · 03:00 (España)' },
  'alemania|ecuador': { kickoffLabelEs: 'vie, 26 jun 2026 · 03:00 (España)' },
  'japon|suecia': { kickoffLabelEs: 'vie, 26 jun 2026 · 07:00 (España)' },
  'paises bajos|tunez': { kickoffLabelEs: 'vie, 26 jun 2026 · 07:00 (España)' },
  'estados unidos|turquia': { kickoffLabelEs: 'vie, 26 jun 2026 · 12:00 (España)' },
  'australia|paraguay': { kickoffLabelEs: 'vie, 26 jun 2026 · 12:00 (España)' },
  'francia|noruega': { kickoffLabelEs: 'sáb, 27 jun 2026 · 02:00 (España)' },
  'irak|senegal': { kickoffLabelEs: 'sáb, 27 jun 2026 · 02:00 (España)' },
  'arabia saudi|cabo verde': { kickoffLabelEs: 'sáb, 27 jun 2026 · 08:00 (España)' },
  'espana|uruguay': { kickoffLabelEs: 'sáb, 27 jun 2026 · 09:00 (España)' },
  'egipto|iran': { kickoffLabelEs: 'sáb, 27 jun 2026 · 13:00 (España)' },
  'belgica|nueva zelanda': { kickoffLabelEs: 'sáb, 27 jun 2026 · 13:00 (España)' },
  'inglaterra|panama': { kickoffLabelEs: 'dom, 28 jun 2026 · 04:00 (España)' },
  'croacia|ghana': { kickoffLabelEs: 'dom, 28 jun 2026 · 04:00 (España)' },
  'colombia|portugal': { kickoffLabelEs: 'dom, 28 jun 2026 · 06:30 (España)' },
  'rd congo|uzbekistan': { kickoffLabelEs: 'dom, 28 jun 2026 · 06:30 (España)' },
  'argelia|austria': { kickoffLabelEs: 'dom, 28 jun 2026 · 10:00 (España)' },
  'argentina|jordania': { kickoffLabelEs: 'dom, 28 jun 2026 · 10:00 (España)' },
}

/**
 * @param {string} home
 * @param {string} away
 * @returns {string | null}
 */
export function getGroupMatchKickoffLabelEs(home, away) {
  if (!home || !away) return null
  return KICKOFF_BY_PAIR[fifaCentrePairKey(home, away)]?.kickoffLabelEs ?? null
}
