import { supabase } from './supabase'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trophy, Star, Goal, Users, Save, Lock, FolderOpen } from 'lucide-react'
import {
  GROUP_LETTERS,
  GROUPS,
  GROUP_STAGE_MATCHES,
  calculateGroupTable,
  computeFullKnockout,
} from './bracketLogic.js'
import KnockoutSection from './KnockoutSection.jsx'
import { TeamNameWithFlag } from './TeamFlag.jsx'
import MessageModal from './MessageModal.jsx'

async function fetchAllPredictions() {
  const { data, error } = await supabase.from('predictions').select('*')
  if (error) {
    console.error(error)
    return []
  }
  const rows = data || []
  return rows.map(row => ({
    ...row,
    updatedAt: row.updatedAt ?? row.updated_at ?? new Date().toISOString(),
  }))
}

const defaultSpecials = () => ({
  champion: '',
  runnerUp: '',
  topScorer: '',
  bestPlayer: '',
  topAssist: '',
})

export default function WorldCupPoolApp() {
  const [nickname, setNickname] = useState('')
  const [savedUsers, setSavedUsers] = useState([])
  const [loadBusy, setLoadBusy] = useState(false)
  const [modal, setModal] = useState(null)

  const closeModal = useCallback(() => setModal(null), [])
  const showModal = useCallback(payload => {
    setModal({
      title: payload.title ?? '',
      message: payload.message,
      variant: payload.variant ?? 'info',
    })
  }, [])

  const [locked, setLocked] = useState(false)

  const [predictions, setPredictions] = useState({})
  const [knockoutScores, setKnockoutScores] = useState({})

  const [specials, setSpecials] = useState(defaultSpecials)

  useEffect(() => {
    const sync = async () => {
      const users = await fetchAllPredictions()
      setSavedUsers(users)
    }

    sync()

    window.addEventListener('worldcup-sync', sync)

    const interval = setInterval(sync, 2000)

    return () => {
      clearInterval(interval)
      window.removeEventListener('worldcup-sync', sync)
    }
  }, [])

  const savePrediction = async () => {
    const nick = nickname.trim()
    if (!nick) {
      showModal({
        variant: 'error',
        title: 'Falta el nickname',
        message: 'Escribe un nickname antes de guardar la porra.',
      })
      return
    }

    try {
      const points = (() => {
        let n = 0
        for (const p of Object.values(predictions)) {
          if (p?.home === '' || p?.away === '' || p?.home == null || p?.away == null) continue
          const h = Number(p.home)
          const a = Number(p.away)
          if (!Number.isNaN(h) && !Number.isNaN(a)) n++
        }
        return n
      })()

      const { error } = await supabase.from('predictions').upsert(
        {
          nickname: nick,
          predictions,
          knockout: knockoutScores,
          specials,
          points,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'nickname' },
      )
      if (error) {
        console.error(error)
        throw error
      }
      window.dispatchEvent(new Event('worldcup-sync'))
      const fresh = await fetchAllPredictions()
      setSavedUsers(fresh)
      showModal({
        variant: 'success',
        title: 'Porra guardada',
        message: 'Los datos se han guardado correctamente en Supabase.',
      })
    } catch {
      showModal({
        variant: 'error',
        title: 'No se pudo guardar',
        message:
          'Revisa la conexión y los permisos. Si el error habla de UNIQUE o conflicto en nickname, elimina duplicados y aplica supabase/predictions-unique-nickname.sql.',
      })
    }
  }

  const loadPorraByNickname = async () => {
    const nick = nickname.trim()
    if (!nick) {
      showModal({
        variant: 'error',
        title: 'Falta el nickname',
        message: 'Escribe el nickname con el que guardaste la porra.',
      })
      return
    }
    setLoadBusy(true)
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('nickname', nick)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        showModal({
          variant: 'error',
          title: 'Error al cargar',
          message: error.message || 'No se ha podido consultar Supabase.',
        })
        return
      }
      if (!data) {
        showModal({
          variant: 'info',
          title: 'Sin datos',
          message: 'No hay ninguna porra guardada con ese nickname.',
        })
        return
      }

      setPredictions(
        data.predictions && typeof data.predictions === 'object' ? data.predictions : {},
      )
      setKnockoutScores(
        data.knockout && typeof data.knockout === 'object' ? data.knockout : {},
      )
      setSpecials({ ...defaultSpecials(), ...(typeof data.specials === 'object' && data.specials ? data.specials : {}) })
      showModal({
        variant: 'success',
        title: 'Porra cargada',
        message: `Se ha cargado la porra guardada para «${nick}».`,
      })
    } finally {
      setLoadBusy(false)
    }
  }

  const ranking = useMemo(() => {
    const list = Array.isArray(savedUsers) ? savedUsers : []
    return [...list].sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
  }, [savedUsers])

  const fullBracket = useMemo(
    () => computeFullKnockout(predictions, knockoutScores),
    [predictions, knockoutScores],
  )

  const patchKoScore = (key, side, val) => {
    setKnockoutScores(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [side]: val },
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050d1a] via-[#0a2342] to-[#1a0a28] p-4 md:p-8 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-r from-[#003875]/95 via-[#005a9c]/90 to-[#002a52]/95 p-8 shadow-2xl shadow-black/50">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 20% 40%, rgba(232,197,71,0.25), transparent), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(0,180,216,0.2), transparent)',
            }}
          />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sky-200/90 text-sm font-semibold tracking-widest uppercase mb-2">
                FIFA World Cup 26™ · Porra
              </p>
              <h1 className="text-4xl sm:text-5xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-sky-200">
                Porra Mundial 2026
              </h1>
              <p className="text-sky-100/85 text-lg max-w-xl">
                Fase de grupos con fechas de jornada, clasificación en vivo y eliminatorias
                enlazadas hasta la final.
              </p>
            </div>

            <div className="bg-black/25 backdrop-blur-md rounded-2xl border border-white/15 p-5 w-full md:w-96">
              <label className="text-sm text-sky-200/90 mb-2 block">Tu nickname</label>

              <input
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="Ej: Carlos"
                className="w-full rounded-xl border border-white/20 bg-white/95 p-3 text-slate-900"
              />

              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={loadPorraByNickname}
                  disabled={loadBusy}
                  className="w-full rounded-xl border border-sky-300/40 bg-sky-500/20 text-white font-semibold p-3 flex items-center justify-center gap-2 hover:bg-sky-500/30 transition disabled:opacity-50"
                >
                  <FolderOpen size={18} />
                  {loadBusy ? 'Cargando…' : 'Cargar mi porra'}
                </button>
                <button
                  type="button"
                  onClick={savePrediction}
                  disabled={locked}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold p-3 flex items-center justify-center gap-2 hover:brightness-110 transition disabled:opacity-50"
                >
                  {locked ? <Lock size={18} /> : <Save size={18} />}
                  {locked ? 'Bloqueado' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="rounded-3xl border border-cyan-400/15 bg-slate-900/50 backdrop-blur-md shadow-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="text-amber-300" />
                <h2 className="text-2xl font-bold text-white">Fase de grupos</h2>
              </div>

              <div className="space-y-8">
                {GROUP_LETTERS.map(group => {
                  const teams = GROUPS[group]
                  const groupMatches = GROUP_STAGE_MATCHES.filter(m => m.group === group)

                  const table = calculateGroupTable(predictions, teams, groupMatches)

                  return (
                    <div
                      key={group}
                      className="rounded-3xl border border-[#2a6fb0]/35 bg-gradient-to-br from-slate-900/80 to-[#061525]/90 p-5 shadow-lg"
                    >
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-sky-200">
                          Grupo {group}
                        </h3>
                      </div>

                      <div className="grid lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          {groupMatches.map(match => (
                            <div
                              key={match.id}
                              className="rounded-2xl border border-white/10 bg-black/25 p-3"
                            >
                              <div className="text-xs text-sky-200/80 mb-2 text-left space-y-0.5">
                                <div>
                                  <span className="font-bold text-amber-200/90">Jornada {match.matchday}</span>
                                  <span className="text-white/50"> · </span>
                                  <span>{match.dateLabel}</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                                <div className="flex justify-end min-w-0">
                                  <TeamNameWithFlag
                                    name={match.home}
                                    textClassName="font-semibold text-white/95 text-sm text-right"
                                  />
                                </div>

                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    disabled={locked}
                                    className="w-14 rounded-lg border border-white/20 bg-slate-950/80 p-2 text-center text-white disabled:opacity-40"
                                    value={predictions[match.id]?.home || ''}
                                    onChange={e =>
                                      setPredictions(prev => ({
                                        ...prev,
                                        [match.id]: {
                                          ...prev[match.id],
                                          home: e.target.value,
                                        },
                                      }))
                                    }
                                  />

                                  <span className="text-white/40">-</span>

                                  <input
                                    type="number"
                                    min="0"
                                    disabled={locked}
                                    className="w-14 rounded-lg border border-white/20 bg-slate-950/80 p-2 text-center text-white disabled:opacity-40"
                                    value={predictions[match.id]?.away || ''}
                                    onChange={e =>
                                      setPredictions(prev => ({
                                        ...prev,
                                        [match.id]: {
                                          ...prev[match.id],
                                          away: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </div>

                                <div className="flex justify-start min-w-0">
                                  <TeamNameWithFlag
                                    name={match.away}
                                    textClassName="font-semibold text-white/95 text-sm"
                                  />
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
                                {table.map(team => (
                                  <tr key={team.team} className="border-t border-white/10">
                                    <td className="p-3 font-medium text-white/90">
                                      <TeamNameWithFlag name={team.team} />
                                    </td>
                                    <td className="text-center text-sky-100">{team.pts}</td>
                                    <td className="text-center text-sky-100">{team.dg}</td>
                                    <td className="text-center text-sky-100">{team.gf}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <KnockoutSection
              bracket={fullBracket}
              knockoutScores={knockoutScores}
              onPatch={patchKoScore}
              locked={locked}
            />

            <div className="rounded-3xl border border-cyan-400/15 bg-slate-900/50 backdrop-blur-md shadow-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Star className="text-amber-300" />
                <h2 className="text-2xl font-bold text-white">Predicciones especiales</h2>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
                <input
                  className="rounded-2xl border border-white/15 bg-black/30 p-4 text-white placeholder:text-slate-500"
                  placeholder="Campeón"
                  value={specials.champion}
                  onChange={e =>
                    setSpecials(prev => ({
                      ...prev,
                      champion: e.target.value,
                    }))
                  }
                />

                <input
                  className="rounded-2xl border border-white/15 bg-black/30 p-4 text-white placeholder:text-slate-500"
                  placeholder="Subcampeón"
                  value={specials.runnerUp}
                  onChange={e =>
                    setSpecials(prev => ({
                      ...prev,
                      runnerUp: e.target.value,
                    }))
                  }
                />

                <input
                  className="rounded-2xl border border-white/15 bg-black/30 p-4 text-white placeholder:text-slate-500"
                  placeholder="Máximo goleador"
                  value={specials.topScorer}
                  onChange={e =>
                    setSpecials(prev => ({
                      ...prev,
                      topScorer: e.target.value,
                    }))
                  }
                />

                <input
                  className="rounded-2xl border border-white/15 bg-black/30 p-4 text-white placeholder:text-slate-500"
                  placeholder="Mejor jugador"
                  value={specials.bestPlayer}
                  onChange={e =>
                    setSpecials(prev => ({
                      ...prev,
                      bestPlayer: e.target.value,
                    }))
                  }
                />

                <input
                  className="rounded-2xl border border-white/15 bg-black/30 p-4 text-white placeholder:text-slate-500"
                  placeholder="Máximo asistente"
                  value={specials.topAssist}
                  onChange={e =>
                    setSpecials(prev => ({
                      ...prev,
                      topAssist: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-cyan-400/15 bg-slate-900/55 backdrop-blur-md p-6 sticky top-4 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <Users className="text-amber-300" />
                <h2 className="text-2xl font-bold text-white">Clasificación global</h2>
              </div>

              <div className="space-y-3">
                {ranking.length === 0 && (
                  <div className="text-slate-400 text-sm">Todavía no hay usuarios registrados.</div>
                )}

                {ranking.map((user, index) => (
                  <div
                    key={user.nickname}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white">
                        #{index + 1} {user.nickname}
                      </div>

                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(user.updatedAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-2xl font-black text-amber-300">{user.points}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-400/20 bg-gradient-to-br from-[#1a0508] to-[#0a1628] p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <Goal className="text-amber-300" />
                <h2 className="text-xl font-bold text-white">Sistema de puntos</h2>
              </div>

              <div className="space-y-3 text-sm text-sky-100/80">
                <div>Resultado exacto: +3 pts</div>
                <div>Ganador acertado: +1 pt</div>
                <div>Clasificado correcto: +2 pts</div>
                <div>Finalista correcto: +5 pts</div>
                <div>Campeón correcto: +10 pts</div>
                <div>Premios individuales: +5 pts</div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Panel administrador</h2>

              <button
                onClick={() => setLocked(!locked)}
                className="w-full rounded-2xl bg-gradient-to-r from-[#c8102e] to-[#8b0000] text-white p-4 font-bold hover:brightness-110 transition"
              >
                {locked ? 'Desbloquear edición' : 'Bloquear edición'}
              </button>

              <p className="text-sm text-slate-400 mt-4 leading-relaxed">
                En producción este panel permitiría introducir resultados oficiales y recalcular
                automáticamente toda la clasificación.
              </p>
            </div>
          </div>
        </div>
      </div>
      <MessageModal modal={modal} onClose={closeModal} />
    </div>
  )
}
