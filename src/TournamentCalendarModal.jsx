import { useEffect } from 'react'
import { CalendarDays, X } from 'lucide-react'

/**
 * @param {{
 *   open: boolean
 *   onClose: () => void
 *   days: import('./tournamentCalendar.js').TournamentCalendarDay[]
 * }} props
 */
export default function TournamentCalendarModal({ open, onClose, days }) {
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
      aria-labelledby="tournament-calendar-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar calendario"
      />
      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl border border-amber-400/30 bg-slate-900/98 shadow-2xl">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/10 shrink-0">
          <div className="flex items-start gap-2 min-w-0">
            <CalendarDays className="text-amber-300 shrink-0 mt-0.5" size={22} aria-hidden />
            <div className="min-w-0">
              <h2 id="tournament-calendar-title" className="text-lg font-bold text-white m-0 leading-tight">
                Calendario Mundial 2026
              </h2>
              <p className="text-xs text-sky-200/75 mt-1 mb-0 leading-snug">
                Partidos por día (fase de grupos con hora en España; eliminatorias según calendario FIFA
                aproximado).
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

        <div className="overflow-y-auto p-4 space-y-4">
          {days.length === 0 ? (
            <p className="text-sm text-slate-400 m-0">No hay partidos en el calendario.</p>
          ) : (
            days.map(day => (
              <section
                key={day.sortKey}
                className="rounded-xl border border-white/10 bg-black/25 overflow-hidden"
              >
                <h3 className="text-sm font-bold text-amber-200/95 m-0 px-3 py-2 bg-amber-500/10 border-b border-white/10">
                  {day.label}
                </h3>
                <ul className="list-none m-0 p-0 divide-y divide-white/5">
                  {day.matches.map(match => (
                    <li
                      key={`${day.sortKey}-${match.fifa}`}
                      className="px-3 py-2.5 text-sm flex flex-wrap items-baseline gap-x-2 gap-y-0.5"
                    >
                      <span className="font-mono text-[11px] text-sky-300/80 shrink-0">
                        #{match.fifa}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-200/70 shrink-0">
                        {match.phase}
                      </span>
                      <span className="text-white/95 font-medium">{match.summary}</span>
                      {match.kickoff ? (
                        <span className="text-xs text-sky-200/60 w-full sm:w-auto sm:ml-auto">
                          {match.kickoff}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
