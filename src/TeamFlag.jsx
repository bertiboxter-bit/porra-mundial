import { getFlagCodeForTeam } from './teamFlagCodes.js'
import { FLAG_COMPONENTS } from './flagComponents.js'

/**
 * Bandera SVG (country-flag-icons, empaquetada con la app — sin CDN).
 */
export function TeamFlag({ teamName, size = 22, className = '' }) {
  const code = getFlagCodeForTeam(teamName)
  if (!code) return null
  const Flag = FLAG_COMPONENTS[code]
  if (!Flag) return null

  const w = Math.round(size * 1.35)
  const h = Math.round((w * 2) / 3)

  return (
    <span className={`inline-flex shrink-0 items-center ${className}`} title={teamName || undefined}>
      <Flag
        width={w}
        height={h}
        className="rounded-sm shadow-sm ring-1 ring-white/15"
        aria-hidden
      />
    </span>
  )
}

/**
 * Bandera + texto en línea (para tablas y alineaciones).
 */
export function TeamNameWithFlag({ name, textClassName = '', gapClassName = 'gap-2' }) {
  if (!name) return null
  return (
    <span className={`inline-flex items-center ${gapClassName} min-w-0`}>
      <TeamFlag teamName={name} />
      <span className={`truncate ${textClassName}`}>{name}</span>
    </span>
  )
}
