/**
 * Podio de equipos derivado de los marcadores introducidos en eliminatorias (porra del usuario).
 * @param {{ final?: { homeTeam?: string | null, awayTeam?: string | null, winner?: string | null }, thirdPlace?: { winner?: string | null } } | null | undefined} bracket
 */
export function podiumTeamsFromBracket(bracket) {
  const final = bracket?.final
  const w = final?.winner
  if (!w || !final?.homeTeam || !final?.awayTeam) {
    return { champion: '', runnerUp: '', thirdPlace: bracket?.thirdPlace?.winner || '' }
  }
  const runnerUp = final.homeTeam === w ? final.awayTeam : final.homeTeam
  return {
    champion: w,
    runnerUp,
    thirdPlace: bracket?.thirdPlace?.winner || '',
  }
}
