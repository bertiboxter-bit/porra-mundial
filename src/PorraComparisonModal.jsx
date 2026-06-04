import { useEffect, useMemo, useState } from 'react'
import { BarChart3, X } from 'lucide-react'
import { buildPorraComparison, compareStatusLabel } from './porraComparison.js'

const STATUS_STYLES = {
  exact: 'border-emerald-400/40 bg-emerald-950/35 text-emerald-100',
  partial: 'border-amber-400/35 bg-amber-950/30 text-amber-100',
  miss: 'border-red-400/35 bg-red-950/30 text-red-100',
  pending: 'border-sky-400/30 bg-sky-950/25 text-sky-100',
  no_official: 'border-white/15 bg-black/25 text-slate-400',
  ok: 'border-emerald-400/40 bg-emerald-950/35 text-emerald-100',
  wrong: 'border-red-400/35 bg-red-950/30 text-red-100',
}

/**
 * @param {{
 *   open: boolean
 *   onClose: () => void
 *   userPred: Record<string, unknown>
 *   userKo: Record<string, unknown>
 *   userSpecials: Record<string, unknown>
 *   officialPred: Record<string, unknown>
 *   officialKo: Record<string, unknown>
 *   officialSpecials: Record<string, unknown>
 * }} props
 */
export default function PorraComparisonModal({
  open,
  onClose,
  userPred,
  userKo,
  userSpecials,
  officialPred,
  officialKo,
  officialSpecials,
}) {
  const [filter, setFilter] = useState('all')

  const comparison = useMemo(
    () =>
      buildPorraComparison(
        userPred,
        userKo,
        userSpecials,
        officialPred,
        officialKo,
        officialSpecials,
      ),
    [userPred, userKo, userSpecials, officialPred, officialKo, officialSpecials],
  )

  useEffect(() => {
    if (!open) return
    const onKey = e => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const filteredRows =
    filter === 'all'
      ? comparison.rows
      : comparison.rows.filter(r => r.status === filter)

  const { summary } = comparison

  return (
    <div
      className="fixed inset-0 z-[105] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="porra-comparison-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-cyan-400/30 bg-slate-900/98 shadow-2xl">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/10 shrink-0">
          <div className="flex items-start gap-2 min-w-0">
            <BarChart3 className="text-cyan-300 shrink-0 mt-0.5" size={22} aria-hidden />
            <div>
              <h2 id="porra-comparison-title" className="text-lg font-bold text-white m-0">
                Tu porra vs resultados oficiales
              </h2>
              <p className="text-xs text-sky-200/75 mt-1 mb-0">
                Puntos estimados en partidos comparados: {summary.pointsEarned}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-sky-200 hover:bg-white/10 shrink-0"
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-white/10 flex flex-wrap gap-2 text-xs shrink-0">
          {[
            ['all', `Todos (${comparison.rows.length})`],
            ['exact', `Plenos (${summary.exactCount})`],
            ['partial', `Parciales (${summary.partialCount})`],
            ['miss', `Fallos (${summary.missCount})`],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-lg px-2.5 py-1.5 font-semibold transition ${
                filter === key
                  ? 'bg-sky-500/35 text-white'
                  : 'bg-black/30 text-sky-200/80 hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto p-4 space-y-2 min-h-0">
          {filteredRows.length === 0 ? (
            <p className="text-sm text-slate-400 m-0">
              {comparison.hasOfficialData
                ? 'No hay filas con este filtro.'
                : 'Aún no hay resultados oficiales cargados en el panel de administración.'}
            </p>
          ) : (
            filteredRows.map(row => (
              <div
                key={row.id}
                className={`rounded-xl border px-3 py-2.5 text-sm ${STATUS_STYLES[row.status] ?? STATUS_STYLES.pending}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold">{row.label}</span>
                  <span className="text-[10px] uppercase tracking-wide opacity-80">
                    {compareStatusLabel(row.status)}
                    {row.points != null && row.points > 0 ? ` · +${row.points}` : ''}
                  </span>
                </div>
                <p className="text-xs mt-1 mb-0 opacity-90">
                  <span className="text-[10px] uppercase mr-1">{row.category}</span>
                  {row.detail}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
