import { ArrowDown, ArrowUp, Gift, Minus, Trophy, User } from 'lucide-react'

/**
 * @param {{ summary: ReturnType<import('./personalRankingSummary.js').buildPersonalRankingSummary> }} props
 */
export default function PersonalRankingSummaryCard({ summary }) {
  if (!summary) return null

  return (
    <section
      className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-950/40 via-slate-900/60 to-[#061525]/90 p-5 shadow-lg"
      aria-label="Tu situación en la clasificación"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <User className="text-amber-300 shrink-0" size={18} aria-hidden />
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-200/90 m-0">
              Tu situación
            </h2>
          </div>
          <p className="text-lg font-bold text-white m-0">
            {summary.displayName}
            <span className="text-sky-200/70 font-semibold text-base ml-2">
              #{summary.rank} ·{' '}
              <span className="text-amber-200 tabular-nums">{summary.points} pts</span>
            </span>
          </p>
        </div>

        {summary.prizeTier ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 shrink-0">
            <Gift className="text-amber-300 shrink-0" size={18} aria-hidden />
            <div className="text-sm">
              <div className="font-semibold text-amber-100">{summary.prizeTier.label}</div>
              <div className="text-amber-200/90 font-bold tabular-nums">{summary.prizeTier.amount}</div>
            </div>
          </div>
        ) : null}
      </div>

      {(summary.pointsDelta != null && summary.pointsDelta !== 0) || summary.movementLabel != null ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {summary.pointsDelta != null && summary.pointsDelta !== 0 ? (
            <span className="text-amber-200/95 tabular-nums font-semibold">
              Últ. recálculo: {summary.pointsDelta > 0 ? '+' : ''}
              {summary.pointsDelta} pts
            </span>
          ) : null}
          {summary.movementLabel != null ? (
            <span
              className={`inline-flex items-center gap-1 font-semibold tabular-nums ${
                summary.movement > 0
                  ? 'text-emerald-300'
                  : summary.movement < 0
                    ? 'text-rose-300'
                    : 'text-slate-400'
              }`}
            >
              {summary.movement > 0 ? (
                <ArrowUp size={16} aria-hidden />
              ) : summary.movement < 0 ? (
                <ArrowDown size={16} aria-hidden />
              ) : (
                <Minus size={16} aria-hidden />
              )}
              {summary.movement > 0
                ? `Subiste ${summary.movement} ${summary.movement === 1 ? 'puesto' : 'puestos'}`
                : summary.movement < 0
                  ? `Bajaste ${Math.abs(summary.movement)} ${Math.abs(summary.movement) === 1 ? 'puesto' : 'puestos'}`
                  : 'Sin cambio de puesto'}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 space-y-1 text-sm text-sky-100/85">
        {summary.isLeader ? (
          <p className="m-0 inline-flex items-center gap-1.5 font-medium text-emerald-200">
            <Trophy size={16} className="shrink-0" aria-hidden />
            Líder de la porra · premio 200 €
          </p>
        ) : null}

        {summary.gapsToPrizeRanks.length > 0 ? (
          <ul className="m-0 p-0 list-none space-y-1">
            {summary.gapsToPrizeRanks.map(gap => (
              <li key={gap.rank}>
                A <span className="font-bold tabular-nums text-amber-200">{gap.gap}</span> pts del{' '}
                {gap.label.toLowerCase()} ({gap.amount})
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
