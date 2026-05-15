import { Tv } from 'lucide-react'
import { getFifaMatchUrl } from './fifaMatchUrls.js'

/**
 * Enlace al partido en FIFA.com (horario, sede, dónde ver en España, resultado).
 * @param {{
 *   home?: string,
 *   away?: string,
 *   fifaMatchNumber?: number | string,
 *   className?: string,
 *   compact?: boolean,
 * }} props
 */
export default function MatchFifaLink({
  home,
  away,
  fifaMatchNumber,
  className = '',
  compact = false,
}) {
  const url = getFifaMatchUrl({ home, away, fifaMatchNumber })
  if (!url) return null

  const isKnockoutFallback = !home || !away
  const title = isKnockoutFallback
    ? `Partido ${fifaMatchNumber}: calendario oficial en FIFA.com`
    : `${home} – ${away}: horario, sede y dónde ver en FIFA.com`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className={`inline-flex items-center gap-1 rounded-md border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-200/95 hover:bg-sky-500/20 hover:text-white transition ${className}`}
    >
      <Tv size={compact ? 11 : 12} className="shrink-0 opacity-90" aria-hidden />
      Horario y TV
    </a>
  )
}
