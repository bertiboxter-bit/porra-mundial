import { ChevronRight, ListChecks } from 'lucide-react'

/**
 * @param {{
 *   progress: ReturnType<import('./porraProgress.js').computePorraProgress>
 *   onJumpToNext: () => void
 *   disabled?: boolean
 * }} props
 */
export default function PorraProgressBar({ progress, onJumpToNext, disabled }) {
  return (
    <div className="rounded-2xl border border-cyan-400/25 bg-slate-900/55 backdrop-blur-sm p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <ListChecks size={20} className="text-cyan-300 shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-bold text-white m-0">Progreso de tu porra</p>
            <p className="text-xs text-sky-200/70 m-0">
              {progress.doneUnits} de {progress.totalUnits} apartados · {progress.percent}%
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onJumpToNext}
          disabled={disabled || progress.isComplete}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500/25 border border-sky-400/35 px-4 py-2 text-sm font-semibold text-sky-50 hover:bg-sky-500/35 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          Ir al siguiente pendiente
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>
      <div
        className="h-2.5 rounded-full bg-black/40 overflow-hidden border border-white/10 mb-3"
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-2 text-[11px]">
        {progress.items.map(item => (
          <span
            key={item.key}
            className={`rounded-lg px-2 py-1 border ${
              item.done >= item.total
                ? 'border-emerald-400/35 bg-emerald-950/30 text-emerald-100'
                : 'border-white/15 bg-black/25 text-sky-200/85'
            }`}
          >
            {item.label}: {item.done}/{item.total}
          </span>
        ))}
      </div>
    </div>
  )
}
