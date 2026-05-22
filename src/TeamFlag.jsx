import { getFlagCodeForTeam } from './teamFlagCodes.js'
import { FLAG_COMPONENTS } from './flagComponents.js'
import { getOfficialSquadUrl } from './teamOfficialSquadUrls.js'

/**
 * Bandera SVG (country-flag-icons, empaquetada con la app — sin CDN).
 * Si hay URL oficial de convocatoria en FIFA, la bandera es un enlace externo.
 */
export function TeamFlag({ teamName, size = 22, className = '', linkSquad = true }) {
  const code = getFlagCodeForTeam(teamName)
  if (!code) return null
  const Flag = FLAG_COMPONENTS[code]
  if (!Flag) return null

  const squadUrl = linkSquad ? getOfficialSquadUrl(teamName) : null
  const w = Math.round(size * 1.35)
  const h = Math.round((w * 2) / 3)

  const flagNode = (
    <Flag
      width={w}
      height={h}
      className="rounded-sm shadow-sm ring-1 ring-white/15"
      aria-hidden
    />
  )

  if (!squadUrl) {
    return (
      <span className={`inline-flex shrink-0 items-center ${className}`} title={teamName || undefined}>
        {flagNode}
      </span>
    )
  }

  return (
    <a
      href={squadUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`Noticias y plantilla de ${teamName} en FIFA.com`}
      aria-label={`Ver noticias del equipo ${teamName} en FIFA.com`}
      className={`inline-flex shrink-0 items-center rounded-sm transition hover:ring-2 hover:ring-amber-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${className}`}
      onClick={e => e.stopPropagation()}
    >
      {flagNode}
    </a>
  )
}

/**
 * Bandera + texto en línea (para tablas y alineaciones).
 */
export function TeamNameWithFlag({
  name,
  textClassName = '',
  gapClassName = 'gap-2',
  linkSquad = true,
}) {
  if (!name) return null
  return (
    <span className={`inline-flex items-center ${gapClassName} min-w-0`}>
      <TeamFlag teamName={name} linkSquad={linkSquad} />
      <span className={`truncate ${textClassName}`}>{name}</span>
    </span>
  )
}
