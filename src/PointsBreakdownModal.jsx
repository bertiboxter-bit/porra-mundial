import { useEffect } from 'react'
import { Loader2, X, ListOrdered } from 'lucide-react'

/**
 * @param {{
 *   state: null | { status: 'loading' } | { status: 'error', title: string, message: string } | {
 *     status: 'ready'
 *     title: string
 *     lines: { matchLabel: string, points: number, reason: string }[]
 *     total: number
 *     storedPoints: number
 *   }
 *   onClose: () => void
 * }} props
 */
export default function PointsBreakdownModal({ state, onClose }) {
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
      aria-labelledby="points-breakdown-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border border-amber-400/30 bg-slate-900/98 shadow-2xl">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ListOrdered className="text-amber-300 shrink-0" size={22} />
            <h2 id="points-breakdown-title" className="text-lg font-bold text-white m-0 leading-tight">
              {state.status === 'loading'
                ? 'Cargando desglose…'
                : state.status === 'error'
                  ? state.title
                  : state.title}
            </h2>
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

        <div className="p-5 overflow-y-auto flex-1 min-h-0">
          {state.status === 'loading' ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-sky-200">
              <Loader2 className="animate-spin text-amber-300" size={36} />
              <p className="text-sm m-0">Consultando resultados oficiales…</p>
            </div>
          ) : null}

          {state.status === 'error' ? (
            <p className="text-sm text-red-200/95 m-0 leading-relaxed" role="alert">
              {state.message}
            </p>
          ) : null}

          {state.status === 'ready' ? (
            <>
              {state.lines.length === 0 ? (
                <p className="text-sm text-sky-100/85 m-0 leading-relaxed">
                  Con los resultados oficiales actuales no suma puntos en ningún criterio (o aún no hay
                  marcadores oficiales cargados). El total en clasificación puede ser de un recálculo
                  anterior.
                </p>
              ) : (
                <>
                  <p className="text-[11px] text-sky-200/65 m-0 mb-3 leading-snug">
                    Ordenado del más reciente al más antiguo según el calendario del torneo.
                  </p>
                  <ul className="space-y-2.5 list-none m-0 p-0">
                  {state.lines.map((row, i) => (
                    <li
                      key={`${row.matchLabel}-${row.sortKey ?? i}-${row.points}`}
                      className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-semibold text-white/95 leading-snug">{row.matchLabel}</span>
                        <span className="text-amber-300 font-black tabular-nums shrink-0">
                          +{row.points}
                        </span>
                      </div>
                      <p className="text-sky-100/80 m-0 text-xs leading-relaxed">{row.reason}</p>
                      {row.teams && row.teams.length > 1 ? (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {row.teams.map(team => (
                            <span
                              key={team}
                              className="text-[10px] font-medium text-emerald-200/90 bg-emerald-500/15 border border-emerald-400/25 rounded px-1.5 py-0.5"
                            >
                              {team}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
                </>
              )}

              <div className="mt-5 pt-4 border-t border-white/10 space-y-2 text-sm">
                <div className="flex justify-between gap-3 text-sky-100">
                  <span>Suma del desglose (estado oficial actual)</span>
                  <span className="font-black text-amber-300 tabular-nums">{state.total}</span>
                </div>
                {state.storedPoints !== state.total ? (
                  <p className="text-xs text-sky-200/70 m-0 leading-snug">
                    En el ranking figuran <strong className="text-white font-semibold">{state.storedPoints}</strong>{' '}
                    pts guardados en base de datos. Si no coincide, vuelve al panel de resultados oficiales y
                    pulsa «Guardar y recalcular puntos».
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
