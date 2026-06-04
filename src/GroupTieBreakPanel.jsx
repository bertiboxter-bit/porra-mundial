import { useMemo } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  GROUPS,
  GROUP_STAGE_MATCHES,
  calculateGroupTable,
  GROUP_TIE_BREAK_KEY,
  findGroupTieRuns,
  tieOrderIsValidForCluster,
} from './bracketLogic.js'

/**
 * @param {{ group: string, predictions: Record<string, unknown>, setPredictions: Function, disabled?: boolean }} props
 */
export default function GroupTieBreakPanel({ group, predictions, setPredictions, disabled }) {
  const teams = GROUPS[group]
  const groupMatches = useMemo(
    () => GROUP_STAGE_MATCHES.filter(m => m.group === group),
    [group],
  )

  const table = useMemo(
    () => calculateGroupTable(predictions, teams, groupMatches, group),
    [predictions, teams, groupMatches, group],
  )

  const runs = useMemo(() => findGroupTieRuns(table), [table])

  const tieMap = useMemo(() => {
    const root = predictions?.[GROUP_TIE_BREAK_KEY]
    if (!root || typeof root !== 'object') return {}
    const g = /** @type {Record<string, unknown>} */ (root)[group]
    return g && typeof g === 'object' ? /** @type {Record<string, string[]>} */ (g) : {}
  }, [predictions, group])

  if (disabled || runs.length === 0) return null

  const moveInCluster = (signature, clusterTeams, index, dir) => {
    setPredictions(prev => {
      const prevRoot = prev?.[GROUP_TIE_BREAK_KEY]
      const tieRoot =
        prevRoot && typeof prevRoot === 'object' ? { ...prevRoot } : {}
      const prevGroup = tieRoot[group]
      const groupMap =
        prevGroup && typeof prevGroup === 'object' ? { ...prevGroup } : {}

      const saved = groupMap[signature]
      const baseOrder = tieOrderIsValidForCluster(saved, clusterTeams)
        ? [...saved]
        : [...clusterTeams]

      const to = index + dir
      if (to < 0 || to >= baseOrder.length) return prev

      const nextOrder = [...baseOrder]
      ;[nextOrder[index], nextOrder[to]] = [nextOrder[to], nextOrder[index]]
      groupMap[signature] = nextOrder
      tieRoot[group] = groupMap

      return {
        ...prev,
        [GROUP_TIE_BREAK_KEY]: tieRoot,
      }
    })
  }

  const confirmCluster = (signature, clusterTeams, order) => {
    setPredictions(prev => {
      const prevRoot = prev?.[GROUP_TIE_BREAK_KEY]
      const tieRoot =
        prevRoot && typeof prevRoot === 'object' ? { ...prevRoot } : {}
      const prevGroup = tieRoot[group]
      const groupMap =
        prevGroup && typeof prevGroup === 'object' ? { ...prevGroup } : {}
      groupMap[signature] = [...order]
      tieRoot[group] = groupMap
      return { ...prev, [GROUP_TIE_BREAK_KEY]: tieRoot }
    })
  }

  const clearCluster = signature => {
    setPredictions(prev => {
      const prevRoot = prev?.[GROUP_TIE_BREAK_KEY]
      if (!prevRoot || typeof prevRoot !== 'object') return prev
      const tieRoot = { ...prevRoot }
      const prevGroup = tieRoot[group]
      if (!prevGroup || typeof prevGroup !== 'object') return prev
      const groupMap = { ...prevGroup }
      delete groupMap[signature]
      if (Object.keys(groupMap).length === 0) {
        delete tieRoot[group]
      } else {
        tieRoot[group] = groupMap
      }
      if (Object.keys(tieRoot).length === 0) {
        const { [GROUP_TIE_BREAK_KEY]: _drop, ...rest } = prev
        return rest
      }
      return { ...prev, [GROUP_TIE_BREAK_KEY]: tieRoot }
    })
  }

  return (
    <div
      data-porra-target={`tie-group-${group}`}
      className="mt-3 rounded-xl border border-amber-400/30 bg-amber-500/[0.07] p-3 text-xs text-sky-100/90 scroll-mt-32"
    >
      <p className="font-semibold text-amber-200/95 m-0 mb-2">
        Si varios equipos empatan a puntos, primero se aplica el enfrentamiento directo entre ellos
        (pts, DG y GF en esos cruces). Si tras eso siguen empatados en todo lo automático, ordena
        manualmente y pulsa <span className="text-white">Confirmar orden</span>. Sin confirmar, no se
        podrá guardar la porra.
      </p>
      <ul className="list-none m-0 p-0 space-y-3">
        {runs.map(run => {
          const saved = tieMap[run.signature]
          const order = tieOrderIsValidForCluster(saved, run.teams) ? saved : run.teams
          const confirmed = tieOrderIsValidForCluster(saved, run.teams)

          return (
            <li key={run.signature} className="rounded-lg bg-black/25 p-2">
              {!confirmed ? (
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-300/95 m-0 mb-2">
                  Pendiente de confirmar
                </p>
              ) : (
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300/90 m-0 mb-2">
                  Orden confirmado
                </p>
              )}
              <div className="flex flex-wrap items-center gap-1.5">
                {order.map((team, idx) => (
                  <span
                    key={team}
                    className="inline-flex items-center gap-0.5 rounded-md border border-white/10 bg-slate-950/50 px-2 py-1"
                  >
                    <span className="max-w-[9rem] truncate font-medium text-white/90">{team}</span>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveInCluster(run.signature, run.teams, idx, -1)}
                      className="rounded p-0.5 text-amber-200 hover:bg-white/10 disabled:opacity-25 disabled:pointer-events-none"
                      aria-label={`Subir ${team} en la clasificación`}
                    >
                      <ChevronUp size={16} aria-hidden />
                    </button>
                    <button
                      type="button"
                      disabled={idx === order.length - 1}
                      onClick={() => moveInCluster(run.signature, run.teams, idx, 1)}
                      className="rounded p-0.5 text-amber-200 hover:bg-white/10 disabled:opacity-25 disabled:pointer-events-none"
                      aria-label={`Bajar ${team} en la clasificación`}
                    >
                      <ChevronDown size={16} aria-hidden />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => confirmCluster(run.signature, run.teams, order)}
                  className="ml-1 rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-200 hover:bg-emerald-500/25"
                >
                  Confirmar orden
                </button>
                {confirmed ? (
                  <button
                    type="button"
                    onClick={() => clearCluster(run.signature)}
                    className="text-[10px] uppercase tracking-wide text-sky-300/90 hover:text-white underline-offset-2 hover:underline"
                  >
                    Deshacer confirmación
                  </button>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
