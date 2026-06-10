import { RefreshCw } from 'lucide-react'

/**
 * @param {{
 *   latestUpdate: null | { saved_at: string, saved_by: string, participants_count: number }
 * }} props
 */
export default function OfficialLastUpdateBanner({ latestUpdate }) {
  if (!latestUpdate?.saved_at) return null

  const savedAt = new Date(latestUpdate.saved_at)
  const formattedDate = Number.isNaN(savedAt.getTime())
    ? latestUpdate.saved_at
    : savedAt.toLocaleString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

  const participantsCount = latestUpdate.participants_count ?? 0
  const participantsLabel =
    participantsCount === 1 ? '1 participante recalculado' : `${participantsCount} participantes recalculados`

  return (
    <div
      className="rounded-2xl border border-cyan-400/30 bg-cyan-950/35 px-4 py-3 text-sm text-cyan-50 flex items-start gap-3"
      role="status"
    >
      <RefreshCw className="shrink-0 text-cyan-300 mt-0.5" size={18} aria-hidden />
      <p className="m-0 leading-snug">
        <strong className="font-semibold text-white">Última actualización oficial:</strong>{' '}
        {formattedDate}
        {latestUpdate.saved_by ? (
          <>
            {' '}
            por <span className="font-semibold text-amber-200">{latestUpdate.saved_by}</span>
          </>
        ) : null}
        . {participantsLabel}. La clasificación refleja esos resultados.
      </p>
    </div>
  )
}
