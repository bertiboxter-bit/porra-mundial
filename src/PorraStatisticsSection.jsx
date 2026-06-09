import { useMemo, useState } from 'react'
import { ChartPie } from 'lucide-react'
import { buildPorraStatistics, formatStatisticPercent } from './porraStatistics.js'

const MAX_VISIBLE_ROWS = 8

/**
 * @param {{
 *   title: string
 *   description: string
 *   rows: { label: string, count: number, percent: number }[]
 *   answeredCount: number
 *   totalParticipants: number
 * }} props
 */
function StatisticCategory({ title, description, rows, answeredCount, totalParticipants }) {
  const [expanded, setExpanded] = useState(false)
  const visibleRows = expanded ? rows : rows.slice(0, MAX_VISIBLE_ROWS)
  const maxPercent = rows[0]?.percent ?? 0

  if (answeredCount === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <h4 className="text-sm font-semibold text-white m-0">{title}</h4>
        <p className="text-xs text-slate-500 mt-1 mb-0">Sin respuestas todavía.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h4 className="text-sm font-semibold text-white m-0">{title}</h4>
        <span className="text-[11px] text-sky-300/70 tabular-nums">
          {answeredCount}/{totalParticipants} con respuesta
        </span>
      </div>
      <p className="text-[11px] text-sky-200/55 mb-3 m-0 leading-snug">{description}</p>

      <ul className="space-y-2 m-0 p-0 list-none">
        {visibleRows.map((row, index) => {
          const barWidth = maxPercent > 0 ? Math.max(4, (row.percent / maxPercent) * 100) : 0
          return (
            <li key={`${row.label}-${index}`}>
              <div className="flex items-center justify-between gap-2 text-xs mb-0.5">
                <span
                  className={`truncate font-medium ${
                    index === 0 ? 'text-amber-200' : 'text-sky-100/90'
                  }`}
                  title={row.label}
                >
                  {index === 0 ? '★ ' : ''}
                  {row.label}
                </span>
                <span className="shrink-0 tabular-nums text-sky-200/80">
                  {formatStatisticPercent(row.percent)}%{' '}
                  <span className="text-slate-500">({row.count})</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    index === 0
                      ? 'bg-gradient-to-r from-amber-400/90 to-amber-500/70'
                      : 'bg-gradient-to-r from-sky-500/70 to-cyan-500/50'
                  }`}
                  style={{ width: `${barWidth}%` }}
                  role="presentation"
                />
              </div>
            </li>
          )
        })}
      </ul>

      {rows.length > MAX_VISIBLE_ROWS ? (
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          className="mt-2 text-[11px] font-semibold text-cyan-300/90 hover:text-cyan-200 transition"
        >
          {expanded ? 'Ver menos' : `Ver las ${rows.length} opciones`}
        </button>
      ) : null}
    </div>
  )
}

/**
 * @param {{ users: Record<string, unknown>[] }} props
 */
export default function PorraStatisticsSection({ users }) {
  const statistics = useMemo(() => buildPorraStatistics(users), [users])

  return (
    <div
      id="section-estadisticas"
      className="scroll-mt-28 rounded-3xl border border-violet-400/20 bg-slate-900/55 backdrop-blur-md p-6 shadow-xl"
    >
      <div className="flex items-center gap-3 mb-2">
        <ChartPie className="text-violet-300" />
        <h2 className="text-2xl font-bold text-white m-0">Estadísticas del grupo</h2>
      </div>
      <p className="text-xs text-sky-200/70 mb-5 leading-snug m-0">
        Porcentaje de participantes que eligió cada opción (sobre {statistics.totalParticipants}{' '}
        {statistics.totalParticipants === 1 ? 'inscrito' : 'inscritos'}). Los nombres de jugadores se
        agrupan sin distinguir mayúsculas.
      </p>

      {statistics.totalParticipants === 0 ? (
        <p className="text-sm text-slate-400 m-0">Todavía no hay participantes para calcular estadísticas.</p>
      ) : (
        <div className="space-y-6 max-h-[min(70vh,42rem)] overflow-y-auto pr-1 -mr-1">
          {statistics.groups.map(group => (
            <section key={group.title}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-violet-200/90 mb-3 m-0">
                {group.title}
              </h3>
              <div className="space-y-3">
                {group.categories.map(category => (
                  <StatisticCategory
                    key={category.title}
                    title={category.title}
                    description={category.description}
                    rows={category.rows}
                    answeredCount={category.answeredCount}
                    totalParticipants={statistics.totalParticipants}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
