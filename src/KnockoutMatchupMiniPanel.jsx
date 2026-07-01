import { TeamFlag } from './TeamFlag.jsx'
import { formatKnockoutMatchupSummaryLabel } from './knockoutMatchupStats.js'

/**
 * @param {{ home: string, away: string }} teams
 * @param {{ compact?: boolean }} [options]
 */
function MatchupTeamsRow({ teams, compact = false }) {
  if (!teams) return null
  return (
    <div className={`flex items-center justify-center gap-1.5 min-w-0 ${compact ? 'text-[10px]' : 'text-xs'}`}>
      <TeamFlag teamName={teams.home} size={compact ? 14 : 16} />
      <span className="font-semibold text-white/95 truncate max-w-[5.5rem] sm:max-w-[7rem]">
        {teams.home}
      </span>
      <span className="text-white/35 shrink-0 font-medium">–</span>
      <span className="font-semibold text-white/95 truncate max-w-[5.5rem] sm:max-w-[7rem]">
        {teams.away}
      </span>
      <TeamFlag teamName={teams.away} size={compact ? 14 : 16} />
    </div>
  )
}

/**
 * @param {{
 *   officialMatchupLine: string | null | undefined
 *   stats: ReturnType<typeof import('./knockoutMatchupStats.js').buildKnockoutMatchupStats>
 * }} props
 */
export default function KnockoutMatchupMiniPanel({ officialMatchupLine, stats }) {
  if (stats.totalWithMatchup === 0) return null

  const summaryLabel = formatKnockoutMatchupSummaryLabel(stats)
  const maxCount = Math.max(...stats.topMatchups.map(row => row.count), 1)

  const popularAlternatives = stats.hasOfficialMatchup
    ? stats.topMatchups.filter(row => !row.isOfficial).slice(0, 3)
    : stats.topMatchups.slice(0, 3)

  return (
    <div className="rounded-xl border border-violet-400/25 bg-violet-950/20 p-2.5 sm:p-3 mb-2">
      {summaryLabel ? (
        <p className="text-[11px] font-semibold text-violet-100/95 m-0 mb-2 leading-snug">
          {summaryLabel}
        </p>
      ) : null}

      <div className="space-y-2">
        {stats.hasOfficialMatchup && officialMatchupLine ? (
          <div className="rounded-lg border border-emerald-400/40 bg-emerald-950/30 px-2.5 py-2">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-200/90">
                Cruce oficial
              </span>
              <span className="text-[10px] tabular-nums text-emerald-200/80 shrink-0">
                {stats.officialMatchCount}/{stats.totalWithMatchup}
                {stats.totalWithMatchup > 0
                  ? ` · ${Math.round((stats.officialMatchCount / stats.totalWithMatchup) * 100)}%`
                  : ''}
              </span>
            </div>
            <MatchupTeamsRow teams={stats.officialTeams} />
          </div>
        ) : null}

        {popularAlternatives.length > 0 ? (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-sky-200/65 m-0 mb-1.5">
              {stats.hasOfficialMatchup ? 'Otros cruces pronosticados' : 'Cruces más pronosticados'}
            </p>
            <ul className="space-y-1.5 list-none m-0 p-0">
              {popularAlternatives.map(row => (
                <li
                  key={row.matchupLine}
                  className={`rounded-lg border px-2 py-1.5 ${
                    row.isOfficial
                      ? 'border-emerald-400/35 bg-emerald-950/25'
                      : 'border-white/10 bg-black/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <MatchupTeamsRow teams={row.teams} compact />
                    <span className="text-[10px] font-bold tabular-nums text-amber-200/90 shrink-0">
                      {row.count} · {row.percent}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        row.isOfficial ? 'bg-emerald-400/80' : 'bg-violet-400/70'
                      }`}
                      style={{ width: `${Math.max(8, (row.count / maxCount) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : stats.hasOfficialMatchup ? (
          <p className="text-[10px] text-sky-200/60 m-0 leading-snug">
            Todos los que definieron cruce coinciden con el oficial.
          </p>
        ) : null}
      </div>
    </div>
  )
}
