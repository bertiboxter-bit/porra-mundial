import { useEffect, useMemo } from 'react'
import { Eye, LayoutGrid, X } from 'lucide-react'
import { buildAllPorrasSummaryRows } from './porraUserView.js'
import { sortRankingUsers } from './rankingUtils.js'

/**
 * @param {{
 *   open: boolean
 *   onClose: () => void
 *   users: Record<string, unknown>[]
 *   onViewUser: (user: Record<string, unknown>) => void
 * }} props
 */
export default function AllPorrasSummaryModal({ open, onClose, users, onViewUser }) {
  const rows = useMemo(() => {
    const sorted = sortRankingUsers(users || [])
    return buildAllPorrasSummaryRows(sorted).map((row, index) => ({
      ...row,
      rank: index + 1,
    }))
  }, [users])

  useEffect(() => {
    if (!open) return
    const onKey = e => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[105] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="all-porras-summary-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border border-amber-400/30 bg-slate-900/98 shadow-2xl">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/10 shrink-0">
          <div className="flex items-start gap-2 min-w-0">
            <LayoutGrid className="text-amber-300 shrink-0 mt-0.5" size={22} aria-hidden />
            <div className="min-w-0">
              <h2 id="all-porras-summary-title" className="text-lg font-bold text-white m-0 leading-tight">
                Resumen de todas las porras
              </h2>
              <p className="text-xs text-sky-200/75 mt-1 mb-0 leading-snug">
                Vista rápida del podio y la final de cada participante. Pulsa una fila para ver la porra
                completa.
              </p>
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

        <div className="overflow-auto min-h-0 flex-1 p-4">
          {rows.length === 0 ? (
            <p className="text-sm text-slate-400 m-0">Todavía no hay participantes registrados.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-sky-300/80 border-b border-white/10">
                  <th className="py-2 pr-2 font-semibold w-10">#</th>
                  <th className="py-2 pr-3 font-semibold">Participante</th>
                  <th className="py-2 pr-3 font-semibold text-right w-16">Pts</th>
                  <th className="py-2 pr-3 font-semibold hidden sm:table-cell">Campeón</th>
                  <th className="py-2 pr-3 font-semibold hidden md:table-cell">Subcampeón</th>
                  <th className="py-2 pr-3 font-semibold hidden lg:table-cell">3.er puesto</th>
                  <th className="py-2 pr-3 font-semibold hidden md:table-cell">Final</th>
                  <th className="py-2 font-semibold w-20 text-center">Ver</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr
                    key={row.key}
                    className="border-b border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="py-2.5 pr-2 text-slate-400 tabular-nums">{row.rank}</td>
                    <td className="py-2.5 pr-3 font-medium text-white">{row.displayName}</td>
                    <td className="py-2.5 pr-3 text-right font-bold tabular-nums text-amber-200">
                      {row.points}
                    </td>
                    <td className="py-2.5 pr-3 text-sky-100/85 hidden sm:table-cell truncate max-w-[8rem]">
                      {row.champion}
                    </td>
                    <td className="py-2.5 pr-3 text-sky-100/75 hidden md:table-cell truncate max-w-[8rem]">
                      {row.runnerUp}
                    </td>
                    <td className="py-2.5 pr-3 text-sky-100/75 hidden lg:table-cell truncate max-w-[8rem]">
                      {row.thirdPlace}
                    </td>
                    <td className="py-2.5 pr-3 text-sky-200/70 text-xs hidden md:table-cell truncate max-w-[12rem]">
                      {row.finalLabel}
                    </td>
                    <td className="py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => onViewUser(row.user)}
                        className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/35 bg-cyan-500/15 px-2 py-1 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/25 transition"
                        title={`Ver porra completa de ${row.displayName}`}
                      >
                        <Eye size={14} aria-hidden />
                        <span className="hidden sm:inline">Ver</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
