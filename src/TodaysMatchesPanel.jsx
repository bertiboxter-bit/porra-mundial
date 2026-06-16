import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, ChevronLeft, ChevronRight, ExternalLink, Users } from 'lucide-react'
import OfficialMatchBadge from './OfficialMatchBadge.jsx'
import { TeamFlag } from './TeamFlag.jsx'
import { FIFA_FIXTURES_URL } from './fifaMatchUrls.js'
import {
  adjacentTournamentDay,
  buildDayMatchesPanelData,
  getTournamentDateKeys,
  resolveDefaultDayKey,
  shiftCalendarDateKey,
} from './todaysMatches.js'

/**
 * @param {{ pointsEarned?: number | null, hitTier?: string | null }} entry
 */
function predictionRowClass(entry) {
  if (entry.pointsEarned != null && entry.pointsEarned > 0) {
    return 'border-emerald-400/40 bg-emerald-950/35'
  }
  return 'border-white/8 bg-black/25'
}

/**
 * @param {{
 *   savedUsers: Record<string, unknown>[]
 *   userPredictions: Record<string, unknown>
 *   userKnockout: Record<string, unknown>
 *   userBracket: import('./bracketLogic.js').computeFullKnockout extends (...args: any) => infer R ? R : never
 *   displayBracket: import('./bracketLogic.js').computeFullKnockout extends (...args: any) => infer R ? R : never
 *   officialPredictions: Record<string, unknown> | null
 *   officialKnockout: Record<string, unknown> | null
 *   officialBracket: import('./bracketLogic.js').computeFullKnockout extends (...args: any) => infer R ? R : never | null
 *   predictionsLockedGlobally: boolean
 *   sessionConnected: boolean
 *   onOpenGroupMatchPredictions: (match: Record<string, unknown>) => void
 *   onOpenKnockoutMatchPredictions: (payload: { title: string, subtitle: string, scoreKey: string }) => void
 *   onScrollToMatch: (scrollTargetId: string) => void
 * }} props
 */
export default function TodaysMatchesPanel({
  savedUsers,
  userPredictions,
  userKnockout,
  userBracket,
  displayBracket,
  officialPredictions,
  officialKnockout,
  officialBracket,
  predictionsLockedGlobally,
  sessionConnected,
  onOpenGroupMatchPredictions,
  onOpenKnockoutMatchPredictions,
  onScrollToMatch,
}) {
  const tournamentDateKeys = useMemo(() => getTournamentDateKeys(), [])
  const [selectedDayKey, setSelectedDayKey] = useState(() => resolveDefaultDayKey())
  const [expandedKeys, setExpandedKeys] = useState(() => new Set())

  useEffect(() => {
    setSelectedDayKey(resolveDefaultDayKey())
  }, [])

  const panelData = useMemo(
    () =>
      buildDayMatchesPanelData({
        dateKey: selectedDayKey,
        savedUsers,
        userPredictions,
        userKnockout,
        userBracket,
        displayBracket,
        officialPredictions,
        officialKnockout,
        officialBracket,
        predictionsLockedGlobally,
      }),
    [
      selectedDayKey,
      savedUsers,
      userPredictions,
      userKnockout,
      userBracket,
      displayBracket,
      officialPredictions,
      officialKnockout,
      officialBracket,
      predictionsLockedGlobally,
    ],
  )

  const prevDayKey = adjacentTournamentDay(selectedDayKey, tournamentDateKeys, 'prev')
  const nextDayKey = adjacentTournamentDay(selectedDayKey, tournamentDateKeys, 'next')

  function toggleExpanded(matchKey) {
    setExpandedKeys(prev => {
      const next = new Set(prev)
      if (next.has(matchKey)) next.delete(matchKey)
      else next.add(matchKey)
      return next
    })
  }

  function goToToday() {
    setSelectedDayKey(resolveDefaultDayKey())
  }

  return (
    <section
      className="rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-[#061a2e]/95 via-slate-900/90 to-[#0a2342]/85 backdrop-blur-md shadow-xl shadow-black/40 overflow-hidden"
      aria-labelledby="todays-matches-title"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-4 border-b border-white/10 bg-emerald-950/20">
        <div className="flex items-start gap-2 min-w-0">
          <CalendarClock className="text-emerald-300 shrink-0 mt-0.5" size={22} aria-hidden />
          <div className="min-w-0">
            <h2 id="todays-matches-title" className="text-lg font-bold text-white m-0 leading-tight">
              Partidos del día
            </h2>
            <p className="text-xs text-sky-200/75 mt-1 mb-0 leading-snug">
              Horarios en España (calendario FIFA). Resultados oficiales y pronósticos sin salir de aquí.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => prevDayKey && setSelectedDayKey(prevDayKey)}
            disabled={!prevDayKey}
            className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-black/30 p-2 text-sky-100 hover:bg-white/10 transition disabled:opacity-35"
            aria-label="Día anterior con partidos"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => setSelectedDayKey(shiftCalendarDateKey(selectedDayKey, -1))}
            className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[11px] font-semibold text-sky-200/80 hover:bg-white/10 transition"
          >
            −1 día
          </button>
          {!panelData.isToday ? (
            <button
              type="button"
              onClick={goToToday}
              className="rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-100 hover:bg-emerald-500/25 transition"
            >
              Hoy
            </button>
          ) : (
            <span className="rounded-lg border border-emerald-400/45 bg-emerald-500/25 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-50">
              Hoy
            </span>
          )}
          <button
            type="button"
            onClick={() => setSelectedDayKey(shiftCalendarDateKey(selectedDayKey, 1))}
            className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[11px] font-semibold text-sky-200/80 hover:bg-white/10 transition"
          >
            +1 día
          </button>
          <button
            type="button"
            onClick={() => nextDayKey && setSelectedDayKey(nextDayKey)}
            disabled={!nextDayKey}
            className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-black/30 p-2 text-sky-100 hover:bg-white/10 transition disabled:opacity-35"
            aria-label="Día siguiente con partidos"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-5 py-3 border-b border-white/8 flex flex-wrap items-center justify-between gap-2 bg-black/15">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white m-0">{panelData.dayLabel}</p>
          <p className="text-[11px] text-sky-200/65 m-0 mt-0.5">
            {panelData.matchesTotal === 0
              ? 'Sin partidos programados este día'
              : `${panelData.matchesTotal} partido${panelData.matchesTotal === 1 ? '' : 's'} · ${panelData.matchesWithOfficial} con resultado oficial`}
          </p>
        </div>
        <a
          href={FIFA_FIXTURES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-200/90 hover:text-amber-100 transition"
        >
          Calendario FIFA
          <ExternalLink size={12} aria-hidden />
        </a>
      </div>

      {panelData.matchesTotal === 0 ? (
        <div className="px-4 sm:px-5 py-8 text-center">
          <p className="text-sm text-sky-200/75 m-0">
            No hay partidos del Mundial en esta fecha. Usa las flechas para ir a un día con partidos.
          </p>
        </div>
      ) : (
        <div className="p-4 sm:p-5 space-y-3 max-h-[min(70vh,42rem)] overflow-y-auto">
          {panelData.matches.map(match => {
            const homeName = match.home || match.homeLabel || 'Por definir'
            const awayName = match.away || match.awayLabel || 'Por definir'
            const isExpanded = expandedKeys.has(match.key)
            const predictionsCount = match.predictionEntries?.length ?? 0
            const userHit =
              match.userPointsEarned != null && match.userPointsEarned > 0

            return (
              <article
                key={match.key}
                className={`rounded-2xl border p-3 sm:p-4 transition ${
                  match.hasOfficial
                    ? userHit
                      ? 'border-emerald-400/40 bg-emerald-950/25'
                      : 'border-emerald-400/25 bg-emerald-950/15'
                    : 'border-white/10 bg-black/25'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                    <span className="font-mono text-sky-300/85">#{match.fifa}</span>
                    <span className="font-bold uppercase tracking-wide text-amber-200/90">
                      {match.phase}
                    </span>
                    {match.kickoff ? (
                      <span className="text-sky-200/70">{match.kickoff}</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {match.hasOfficial && match.officialScoreLine ? (
                      <OfficialMatchBadge scoreLine={match.officialScoreLine} compact />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onScrollToMatch(match.scrollTargetId)}
                      className="text-[10px] font-semibold text-sky-300/90 hover:text-sky-100 underline decoration-sky-400/35 underline-offset-2"
                    >
                      Ir al partido
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-2 sm:gap-3 items-center mb-3">
                  <div className="flex items-center justify-end sm:justify-end gap-2 min-w-0">
                    {match.home ? <TeamFlag teamName={match.home} size={18} /> : null}
                    <span className="font-semibold text-white text-sm text-right truncate">
                      {homeName}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 px-2">
                    {match.hasOfficial && match.officialScoreLine ? (
                      <span className="text-lg font-black tabular-nums text-emerald-200">
                        {match.officialScoreLine}
                      </span>
                    ) : (
                      <span className="text-xs text-white/40 font-semibold">vs</span>
                    )}
                  </div>
                  <div className="flex items-center justify-start gap-2 min-w-0">
                    <span className="font-semibold text-white text-sm truncate">{awayName}</span>
                    {match.away ? <TeamFlag teamName={match.away} size={18} /> : null}
                  </div>
                </div>

                {sessionConnected ? (
                  <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                    <span className="text-sky-200/70">Tu pronóstico:</span>
                    <span
                      className={`font-bold tabular-nums ${
                        userHit ? 'text-emerald-300' : 'text-amber-200'
                      }`}
                    >
                      {match.userScoreLine ?? '—'}
                    </span>
                    {userHit ? (
                      <span className="text-[10px] font-bold text-emerald-300">
                        +{match.userPointsEarned} pts
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {predictionsLockedGlobally && predictionsCount > 0 ? (
                  <div className="border-t border-white/8 pt-2 mt-1">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(match.key)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300 hover:text-cyan-100 transition"
                    >
                      <Users size={13} aria-hidden />
                      {isExpanded ? 'Ocultar pronósticos' : `Ver pronósticos (${predictionsCount})`}
                    </button>

                    {isExpanded ? (
                      <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto list-none m-0 p-0">
                        {match.predictionEntries.map(entry => {
                          const isHit = entry.pointsEarned != null && entry.pointsEarned > 0
                          return (
                            <li
                              key={entry.key ?? entry.name}
                              className={`rounded-lg border px-2.5 py-1.5 flex items-center justify-between gap-2 ${predictionRowClass(entry)}`}
                            >
                              <span
                                className={`text-xs font-medium truncate ${
                                  isHit ? 'text-emerald-100' : 'text-white/90'
                                }`}
                              >
                                {entry.name}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {entry.pointsEarned != null && entry.pointsEarned > 0 ? (
                                  <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 rounded px-1 py-0.5">
                                    +{entry.pointsEarned}
                                  </span>
                                ) : null}
                                <span
                                  className={`text-xs font-bold tabular-nums ${
                                    isHit ? 'text-emerald-200' : 'text-amber-200/90'
                                  }`}
                                >
                                  {entry.scoreLine}
                                </span>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => {
                        if (match.kind === 'group' && match.groupMatch) {
                          onOpenGroupMatchPredictions(match.groupMatch)
                        } else if (match.kind === 'knockout' && match.knockoutMeta) {
                          onOpenKnockoutMatchPredictions(match.knockoutMeta)
                        }
                      }}
                      className="mt-2 text-[10px] font-semibold text-cyan-300/90 hover:text-cyan-100 underline decoration-cyan-400/35 underline-offset-2"
                    >
                      Abrir en modal
                    </button>
                  </div>
                ) : predictionsLockedGlobally ? (
                  <p className="text-[11px] text-sky-200/55 m-0 mt-1">
                    Aún no hay participantes con pronósticos registrados.
                  </p>
                ) : (
                  <p className="text-[11px] text-sky-200/55 m-0 mt-1">
                    Los pronósticos de todos se mostrarán cuando se cierre la edición de porras.
                  </p>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
