/**
 * Porteros principales por selección (lista curada para autocompletar — Guante de oro).
 * No es la convocatoria oficial FIFA; ampliable cuando se publiquen listas definitivas.
 */
import { GROUPS } from './worldCup2026Data.js'

/** @type {Record<string, string[]>} */
const GOALKEEPERS_BY_TEAM = {
  México: ['Guillermo Ochoa', 'Luis Malagón'],
  'Corea del Sur': ['Jo Hyeon-woo', 'Song Bum-keun'],
  Sudáfrica: ['Ronwen Williams', 'Veli Mothwa'],
  Chequia: ['Tomáš Vaclík', 'Jiří Letáček'],
  Canadá: ['Milan Borjan', 'Maxime Crépeau'],
  Suiza: ['Yann Sommer', 'Gregor Kobel'],
  Catar: ['Saad Al-Sheeb', 'Meshaal Barsham'],
  'Bosnia y Herzegovina': ['Ibrahim Šehić', 'Asmir Begović'],
  Brasil: ['Alisson', 'Ederson'],
  Marruecos: ['Yassine Bounou', 'Munir El Kajoui'],
  Escocia: ['Angus Gunn', 'Craig Gordon'],
  Haití: ['Johny Placide', 'Zachary Hermant'],
  'Estados Unidos': ['Matt Turner', 'Ethan Horvath'],
  Australia: ['Mathew Ryan', 'Danny Vukovic'],
  Paraguay: ['Anthony Silva', 'Juan Espínola'],
  Turquía: ['Uğurcan Çakır', 'Altay Bayındır'],
  Alemania: ['Manuel Neuer', 'Oliver Baumann'],
  Ecuador: ['Hernán Galíndez', 'Alexander Domínguez'],
  'Costa de Marfil': ['Badra Ali Sangaré', 'Yahya Fofana'],
  Curazao: ['Eloy Room', 'Tyrick Mondhair'],
  'Países Bajos': ['Bart Verbruggen', 'Jasper Cillessen'],
  Japón: ['Shūichi Gonda', 'Daniel Schmidt'],
  Túnez: ['Aymen Dahmen', 'Mouez Hassen'],
  Suecia: ['Robin Olsen', 'Viktor Johansson'],
  Bélgica: ['Thibaut Courtois', 'Koen Casteels'],
  Irán: ['Alireza Beiranvand', 'Hossein Hosseini'],
  Egipto: ['Mohamed El Shenawy', 'Mahmoud Gad'],
  'Nueva Zelanda': ['Oliver Sail', 'Michael Boxall'],
  España: ['Unai Simón', 'David Raya'],
  Uruguay: ['Sergio Rochet', 'Fernando Muslera'],
  'Arabia Saudí': ['Mohammed Al-Owais', 'Nawaf Al-Aqidi'],
  'Cabo Verde': ['Vozinha', 'Keven Lopes'],
  Francia: ['Mike Maignan', 'Hugo Lloris'],
  Senegal: ['Édouard Mendy', 'Alfred Gomis'],
  Noruega: ['André Hansen', 'Arild Østbø'],
  Irak: ['Jallal Hassan', 'Ahmed Jehad'],
  Argentina: ['Emiliano Martínez', 'Franco Armani'],
  Austria: ['Heinz Lindner', 'Daniel Bachmann'],
  Argelia: ['Anthony Mandrea', 'Raoul Diallo'],
  Jordania: ['Yazeed Abulaila', 'Ibrahim Al-Khaldi'],
  Portugal: ['Diogo Costa', 'Rui Patrício'],
  Colombia: ['David Ospina', 'Camilo Vargas'],
  Uzbekistán: ['Otabek Toʻlaganov', 'Rustam Urunov'],
  'RD Congo': ['Joël Kiassumbua', "Raïs M'Bolhi"],
  Inglaterra: ['Jordan Pickford', 'Aaron Ramsdale'],
  Croacia: ['Dominik Livaković', 'Lovre Kalinić'],
  Panamá: ['Luis Mejía', 'Orlando Mosquera'],
  Ghana: ['Lawrence Ati-Zigi', 'Abdul Manaf Nurudeen'],
}

/** @type {string[]} */
export const WORLD_CUP_GOALKEEPER_OPTIONS = (() => {
  const all = new Set()
  Object.values(GROUPS).forEach(teams => {
    teams.forEach(team => {
      const list = GOALKEEPERS_BY_TEAM[team]
      if (list) list.forEach(name => all.add(name))
    })
  })
  return [...all].sort((a, b) => a.localeCompare(b, 'es'))
})()
