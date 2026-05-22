/**
 * Jugadores destacados por selección (lista curada para autocompletar en especiales).
 * No es la lista oficial FIFA; sirve de ayuda al rellenar pichichi, MVP y asistencias.
 * Se puede ampliar cuando se publiquen convocatorias definitivas.
 */
import { GROUPS } from './worldCup2026Data.js'

/** @type {Record<string, string[]>} */
const STARS_BY_TEAM = {
  México: ['Guillermo Ochoa', 'Hirving Lozano', 'Raúl Jiménez', 'Edson Álvarez'],
  'Corea del Sur': ['Son Heung-min', 'Kim Min-jae', 'Lee Kang-in', 'Hwang Hee-chan'],
  Sudáfrica: ['Percy Tau', 'Ronwen Williams', 'Themba Zwane'],
  Chequia: ['Patrik Schick', 'Tomáš Souček', 'Antonín Barák'],
  Canadá: ['Alphonso Davies', 'Jonathan David', 'Cyle Larin', 'Stephen Eustáquio'],
  Suiza: ['Granit Xhaka', 'Manuel Akanji', 'Xherdan Shaqiri', 'Breel Embolo'],
  Catar: ['Almoez Ali', 'Akram Afif', 'Hassan Al-Haydos'],
  'Bosnia y Herzegovina': ['Edin Džeko', 'Miralem Pjanić', 'Ermedin Demirović'],
  Brasil: ['Vinícius Júnior', 'Rodrygo', 'Raphinha', 'Casemiro', 'Alisson', 'Neymar'],
  Marruecos: ['Achraf Hakimi', 'Youssef En-Nesyri', 'Sofyan Amrabat', 'Brahim Díaz'],
  Escocia: ['Andy Robertson', 'Scott McTominay', 'Kieran Tierney'],
  Haití: ['Duckens Nazon', 'Frantzdy Pierrot'],
  'Estados Unidos': ['Christian Pulisic', 'Gio Reyna', 'Tyler Adams', 'Weston McKennie'],
  Australia: ['Mathew Ryan', 'Harry Souttar', 'Mitchell Duke'],
  Paraguay: ['Miguel Almirón', 'Gustavo Gómez', 'Antonio Sanabria'],
  Turquía: ['Hakan Çalhanoğlu', 'Arda Güler', 'Kerem Aktürkoğlu'],
  Alemania: ['Jamal Musiala', 'Florian Wirtz', 'Joshua Kimmich', 'Kai Havertz', 'Niclas Füllkrug'],
  Ecuador: ['Enner Valencia', 'Moisés Caicedo', 'Pervis Estupiñán'],
  'Costa de Marfil': ['Sébastien Haller', 'Franck Kessié', 'Nicolas Pépé'],
  Curazao: ['Leandro Bacuna', 'Cuco Martina'],
  'Países Bajos': ['Virgil van Dijk', 'Memphis Depay', 'Cody Gakpo', 'Frenkie de Jong', 'Xavi Simons'],
  Japón: ['Takefusa Kubo', 'Kaoru Mitoma', 'Wataru Endo', 'Daizen Maeda'],
  Túnez: ['Youssef Msakni', 'Aïssa Mandi', 'Ellyes Skhiri'],
  Suecia: ['Alexander Isak', 'Victor Lindelöf', 'Dejan Kulusevski'],
  Bélgica: ['Kevin De Bruyne', 'Romelu Lukaku', 'Thibaut Courtois', 'Jeremy Doku'],
  Irán: ['Mehdi Taremi', 'Sardar Azmoun', 'Alireza Jahanbakhsh'],
  Egipto: ['Mohamed Salah', 'Omar Marmoush', 'Trézéguet'],
  'Nueva Zelanda': ['Chris Wood', 'Winston Reid'],
  España: ['Lamine Yamal', 'Pedri', 'Rodri', 'Álvaro Morata', 'Nico Williams'],
  Uruguay: ['Darwin Núñez', 'Federico Valverde', 'Ronald Araújo', 'Luis Suárez'],
  'Arabia Saudí': ['Salem Al-Dawsari', 'Firas Al-Buraikan'],
  'Cabo Verde': ['Ryan Mendes', 'Jovane Cabral'],
  Francia: ['Kylian Mbappé', 'Antoine Griezmann', 'Ousmane Dembélé', 'Aurélien Tchouaméni'],
  Senegal: ['Sadio Mané', 'Nicolas Jackson', 'Kalidou Koulibaly'],
  Noruega: ['Erling Haaland', 'Martin Ødegaard', 'Alexander Sørloth'],
  Irak: ['Mohanad Ali', 'Zaid Mahdi'],
  Argentina: ['Lionel Messi', 'Lautaro Martínez', 'Ángel Di María', 'Julián Álvarez', 'Enzo Fernández'],
  Austria: ['Marcel Sabitzer', 'Marko Arnautović', 'David Alaba'],
  Argelia: ['Riyad Mahrez', 'Youcef Atal', 'Amine Gouiri'],
  Jordania: ['Mousa Al-Taamari', 'Yazan Al-Naimat'],
  Portugal: ['Cristiano Ronaldo', 'Bernardo Silva', 'Bruno Fernandes', 'Rafael Leão', 'Diogo Jota'],
  Colombia: ['Luis Díaz', 'James Rodríguez', 'Luis Sinisterra', 'Davinson Sánchez'],
  Uzbekistán: ['Eldor Shomurodov', 'Jasurbek Yakhshibekov'],
  'RD Congo': ['Yoane Wissa', 'Chancel Mbemba', 'Théo Bongonda'],
  Inglaterra: ['Harry Kane', 'Jude Bellingham', 'Phil Foden', 'Bukayo Saka', 'Declan Rice'],
  Croacia: ['Luka Modrić', 'Bruno Petković', 'Joško Gvardiol', 'Mateo Kovačić'],
  Panamá: ['José Fajardo', 'Aníbal Godoy'],
  Ghana: ['Mohammed Kudus', 'Thomas Partey', 'Inaki Williams', 'Jordan Ayew'],
}

/** @type {string[]} */
export const WORLD_CUP_STAR_PLAYER_OPTIONS = (() => {
  const all = new Set()
  Object.values(GROUPS).forEach(teams => {
    teams.forEach(team => {
      const list = STARS_BY_TEAM[team]
      if (list) list.forEach(p => all.add(p))
    })
  })
  return [...all].sort((a, b) => a.localeCompare(b, 'es'))
})()
