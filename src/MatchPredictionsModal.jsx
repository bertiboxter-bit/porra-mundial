import { useEffect } from 'react'
import { Users, X } from 'lucide-react'

/**
 * @param {{
 *   state: null | { title: string, subtitle?: string, entries: { name: string, scoreLine: string }[] }
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
            state.entries.map(entry => (
              <div
                key={entry.key ?? entry.name}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5"
              >
                <span className="text-sm font-medium text-white truncate">{entry.name}</span>
                <span className="text-sm font-bold tabular-nums text-amber-200 shrink-0">{entry.scoreLine}</span>
              </div>
            ))
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
