import { GROUPS, GROUP_STAGE_MATCHES, calculateGroupTable } from './bracketLogic.js'
import { TeamNameWithFlag } from './TeamFlag.jsx'
import GroupTieBreakPanel from './GroupTieBreakPanel.jsx'
import MatchFifaLink from './MatchFifaLink.jsx'
import MatchPredictionsLink from './MatchPredictionsLink.jsx'
import ScoreInput from './ScoreInput.jsx'
import { getGroupMatchKickoffLabelEs } from './groupMatchKickoffs.js'
import { sanitizeScoreInput } from './scoreInput.js'

export default function GroupPhaseCard({
  group,
  predictions,
  setPredictions,
  readOnly,
  showMatchPredictions,
  onOpenMatchPredictions,
}) {
  const teams = GROUPS[group]
  const groupMatches = GROUP_STAGE_MATCHES.filter(m => m.group === group)
  const table = calculateGroupTable(predictions, teams, groupMatches, group)

  const patchScore = (matchId, side, raw) => {
    const val = sanitizeScoreInput(raw)
    setPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [side]: val,
      },
    }))
  }

  return (
    <div className="rounded-3xl border border-[#2a6fb0]/35 bg-gradient-to-br from-slate-900/80 to-[#061525]/90 p-5 shadow-lg">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-sky-200">
          Grupo {group}
        </h3>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {groupMatches.map(match => (
            <div key={match.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="text-xs text-sky-200/80 mb-2 text-left flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>
                  <span className="font-bold text-amber-200/90">Jornada {match.matchday}</span>
                  <span className="text-white/50"> · </span>
                  <span>{match.kickoffLabelEs ?? getGroupMatchKickoffLabelEs(match.home, match.away) ?? match.dateLabel}</span>
                </span>
                <MatchFifaLink home={match.home} away={match.away} />
                {showMatchPredictions && onOpenMatchPredictions ? (
                  <MatchPredictionsLink onClick={() => onOpenMatchPredictions(match)} />
                ) : null}
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                <div className="flex justify-end min-w-0">
                  <TeamNameWithFlag
                    name={match.home}
                    textClassName="font-semibold text-white/95 text-sm text-right"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <ScoreInput
                    disabled={readOnly}
                    className="w-14 rounded-lg border border-white/20 bg-slate-950/80 p-2 text-center text-white disabled:opacity-40"
                    value={predictions[match.id]?.home || ''}
                    onChange={val => patchScore(match.id, 'home', val)}
                    aria-label={`Goles de ${match.home}`}
                  />

                  <span className="text-white/40">-</span>

                  <ScoreInput
                    disabled={readOnly}
                    className="w-14 rounded-lg border border-white/20 bg-slate-950/80 p-2 text-center text-white disabled:opacity-40"
                    value={predictions[match.id]?.away || ''}
                    onChange={val => patchScore(match.id, 'away', val)}
                    aria-label={`Goles de ${match.away}`}
                  />
                </div>

                <div className="flex justify-start min-w-0">
                  <TeamNameWithFlag name={match.away} textClassName="font-semibold text-white/95 text-sm" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-[#c8102e] to-[#003875] text-white">
                <tr>
                  <th className="p-3 text-left">Equipo</th>
                  <th>PTS</th>
                  <th>DG</th>
                  <th>GF</th>
                </tr>
              </thead>

              <tbody className="bg-slate-950/60">
                {table.map((team, idx) => (
                  <tr key={team.team} className="border-t border-white/10">
                    <td className="p-3 font-medium text-white/90">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-[10px] text-sky-300/70 w-4 shrink-0">{idx + 1}º</span>
                        <TeamNameWithFlag name={team.team} />
                      </span>
                    </td>
                    <td className="text-center text-sky-100">{team.pts}</td>
                    <td className="text-center text-sky-100">{team.dg}</td>
                    <td className="text-center text-sky-100">{team.gf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <GroupTieBreakPanel
            group={group}
            predictions={predictions}
            setPredictions={setPredictions}
            disabled={readOnly}
          />
          <p className="text-[10px] text-sky-200/55 mt-2 m-0">
            Pulsa la bandera para abrir la convocatoria oficial en FIFA.com (cuando esté publicada).
          </p>
        </div>
      </div>
    </div>
  )
}
