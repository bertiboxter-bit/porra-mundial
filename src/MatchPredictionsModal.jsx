import { useEffect } from 'react'
import { Users, X } from 'lucide-react'

/**
 * @param {{ pointsEarned: number | null, hitTier?: string | null }} entry
 */
function entryRowClass(entry) {
  if (entry.pointsEarned != null && entry.pointsEarned > 0) {
    return 'border-emerald-400/45 bg-emerald-950/40'
  }
  if (entry.pointsEarned === 0 || entry.hitTier === 'miss') {
    return 'border-white/10 bg-black/30 opacity-90'
  }
  return 'border-white/10 bg-black/30'
}

/**
 * @param {{
 *   state: null | {
 *     title: string
 *     subtitle?: string
 *     officialScoreLine?: string | null
 *     variant?: 'group' | 'knockout'
 *     entries: {
 *       name: string
 *       scoreLine: string
 *       matchupLine?: string
 *       hitTier?: string | null
 *       pointsEarned?: number | null
 *     }[]
 *   }
 *   onClose: () => void
 * }} props
 */
export default function MatchPredictionsModal({ state, onClose }) {
  useEffect(() => {
    if (!state) return
    const onKey = e => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, onClose])

  if (!state) return null

  const hasOfficialScoring = state.entries.some(entry => entry.pointsEarned != null)

  return (
    <div
      className="fixed inset-0 z-[105] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-predictions-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl border border-cyan-400/30 bg-slate-900/98 shadow-2xl">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/10 shrink-0">
          <div className="flex items-start gap-2 min-w-0">
            <Users className="text-cyan-300 shrink-0 mt-0.5" size={22} aria-hidden />
            <div className="min-w-0">
              <h2 id="match-predictions-title" className="text-lg font-bold text-white m-0 leading-tight">
                {state.title}
              </h2>
              {state.subtitle ? (
                <p className="text-xs text-sky-200/75 mt-1 mb-0 leading-snug">{state.subtitle}</p>
              ) : null}
              {state.officialScoreLine ? (
                <p className="text-xs text-emerald-200/90 mt-1 mb-0 leading-snug">
                  Resultado oficial:{' '}
                  <strong className="font-bold tabular-nums">{state.officialScoreLine}</strong>
                </p>
              ) : null}
              {state.variant === 'knockout' ? (
                <p className="text-[11px] text-cyan-200/65 mt-1.5 mb-0 leading-snug">
                  Cada participante puede tener equipos distintos en el mismo hueco del cuadro.
                </p>
              ) : null}
              {hasOfficialScoring ? (
                <p className="text-[11px] text-emerald-200/75 mt-1.5 mb-0 leading-snug">
                  Verde = pronóstico que suma puntos según el reglamento.
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-sky-200 hover:bg-white/10 transition shrink-0"
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-2">
          {state.entries.length === 0 ? (
            <p className="text-sm text-slate-400 m-0">No hay participantes registrados.</p>
          ) : (
            state.entries.map(entry => {
              const earnedPoints = entry.pointsEarned ?? 0
              const isHit = entry.pointsEarned != null && earnedPoints > 0
              return (
                <div
                  key={entry.key ?? entry.name}
                  className={`rounded-xl border px-3 py-2.5 ${entryRowClass(entry)}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`text-sm font-medium truncate ${
                        isHit ? 'text-emerald-100' : 'text-white'
                      }`}
                    >
                      {entry.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {entry.pointsEarned != null && earnedPoints > 0 ? (
                        <span className="text-[10px] font-bold tabular-nums text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 rounded px-1.5 py-0.5">
                          +{earnedPoints}
                        </span>
                      ) : null}
                      <span
                        className={`text-sm font-bold tabular-nums ${
                          isHit ? 'text-emerald-200' : 'text-amber-200'
                        }`}
                      >
                        {entry.scoreLine}
                      </span>
                    </div>
                  </div>
                  {entry.matchupLine ? (
                    <p
                      className={`text-xs mt-1 mb-0 truncate ${
                        isHit ? 'text-emerald-200/70' : 'text-sky-300/75'
                      }`}
                      title={entry.matchupLine}
                    >
                      {entry.matchupLine}
                    </p>
                  ) : null}
                </div>
              )
            })
          )}
        </div>

        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold py-2.5 hover:brightness-110 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
