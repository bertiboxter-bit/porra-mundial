import { supabase } from './supabase'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trophy, Star, Goal, Users, Save, Lock, FolderOpen, LogOut } from 'lucide-react'
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
import OfficialResultsPanel from './OfficialResultsPanel.jsx'
import AdminLockModal from './AdminLockModal.jsx'
import PointsBreakdownModal from './PointsBreakdownModal.jsx'
import {
  fetchOfficialState,
  fetchPredictionsGloballyLocked,
  setPredictionsGloballyLocked,
} from './officialResultsService.js'
import { getScoreBreakdown } from './scoring.js'
import {
  USERNAME_STORAGE_KEY,
  normalizeUsername,
  validateUsername,
  validateDisplayName,
  rankingDisplayName,
  readStoredUsername,
} from './userIdentity.js'

const OFFICIAL_HASH = '#resultados-oficiales'

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
  const [panel, setPanel] = useState(() =>
    typeof window !== 'undefined' && window.location.hash === OFFICIAL_HASH ? 'official' : 'main',
  )

  const [username, setUsername] = useState(() =>
    typeof window !== 'undefined' ? readStoredUsername() : '',
  )
  const [displayName, setDisplayName] = useState('')
  const [savedUsers, setSavedUsers] = useState([])
  const [loadBusy, setLoadBusy] = useState(false)
  const [modal, setModal] = useState(null)
  const [pointsBreakdown, setPointsBreakdown] = useState(null)

  const closeModal = useCallback(() => setModal(null), [])
  const closePointsBreakdown = useCallback(() => setPointsBreakdown(null), [])

  const openPointsBreakdown = useCallback(async user => {
    const title = `Puntos · ${rankingDisplayName(user)}`
    setPointsBreakdown({ status: 'loading' })
    try {
      const st = await fetchOfficialState()
      if (!st) {
        setPointsBreakdown({
          status: 'error',
          title: 'Sin datos oficiales',
          message:
            'No se ha podido leer el estado oficial en la base de datos. Crea o revisa la tabla official_state (script official-state.sql) o usa el panel de resultados oficiales.',
        })
        return
      }
      const officialBracket = computeFullKnockout(st.predictions, st.knockout)
      const { lines, total } = getScoreBreakdown(
        user,
        st.predictions,
        st.knockout,
        officialBracket,
        st.specials,
      )
      setPointsBreakdown({
        status: 'ready',
        title,
        lines,
        total,
        storedPoints: user.points ?? 0,
      })
    } catch (e) {
      console.error(e)
      setPointsBreakdown({
        status: 'error',
        title: 'Error',
        message: e?.message || 'No se pudo calcular el desglose de puntos.',
      })
    }
  }, [])
  const showModal = useCallback(payload => {
    setModal({
      title: payload.title ?? '',
      message: payload.message,
      variant: payload.variant ?? 'info',
    })
  }, [])

  const [predictionsLockedGlobally, setPredictionsLockedGlobally] = useState(false)
  const [lockModalMode, setLockModalMode] = useState(null)

  const [predictions, setPredictions] = useState({})
  const [knockoutScores, setKnockoutScores] = useState({})

  const [specials, setSpecials] = useState(defaultSpecials)
  const [sessionConnected, setSessionConnected] = useState(false)

  useEffect(() => {
    try {
      if (username) localStorage.setItem(USERNAME_STORAGE_KEY, username)
      else localStorage.removeItem(USERNAME_STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [username])

  useEffect(() => {
    const onHash = () =>
      setPanel(window.location.hash === OFFICIAL_HASH ? 'official' : 'main')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const sync = async () => {
      const [users, globallyLocked] = await Promise.all([
        fetchAllPredictions(),
        fetchPredictionsGloballyLocked(),
      ])
      setSavedUsers(users)
      setPredictionsLockedGlobally(globallyLocked)
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
    if (predictionsLockedGlobally) {
      showModal({
        variant: 'info',
        title: 'Edición cerrada',
        message:
          'Un administrador ha bloqueado la edición de las porras. No se pueden guardar cambios hasta que se desbloquee.',
      })
      return
    }
    const u = normalizeUsername(username)
    const errU = validateUsername(u)
    if (errU) {
      showModal({
        variant: 'error',
        title: 'Usuario no válido',
        message: errU,
      })
      return
    }
    const d = displayName.trim()
    const errD = validateDisplayName(d)
    if (errD) {
      showModal({
        variant: 'error',
        title: 'Nombre público',
        message: errD,
      })
      return
    }

    try {
      const { data: prior } = await supabase.from('predictions').select('points').eq('username', u).maybeSingle()
      const { error } = await supabase.from('predictions').upsert(
        {
          username: u,
          display_name: d,
          nickname: d,
          predictions,
          knockout: knockoutScores,
          specials,
          points: prior?.points ?? 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'username' },
      )
      if (error) {
        console.error(error)
        throw error
      }
      window.dispatchEvent(new Event('worldcup-sync'))
      const fresh = await fetchAllPredictions()
      setSavedUsers(fresh)
      setSessionConnected(true)
      showModal({
        variant: 'success',
        title: 'Porra guardada',
        message: 'Los datos se han guardado correctamente en la base de datos.',
      })
    } catch {
      showModal({
        variant: 'error',
        title: 'No se pudo guardar',
        message:
          'Revisa la conexión y los permisos. Si el error habla de UNIQUE o usuario duplicado, elige otro usuario (clave privada) o aplica el script predictions-username-display.sql del repositorio si aún no migraste la tabla.',
      })
    }
  }

  const loadPorraByUsername = async () => {
    const u = normalizeUsername(username)
    const errU = validateUsername(u)
    if (errU) {
      showModal({
        variant: 'error',
        title: 'Usuario no válido',
        message: errU,
      })
      return
    }
    setLoadBusy(true)
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('username', u)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        showModal({
          variant: 'error',
          title: 'Error al cargar',
          message: error.message || 'No se ha podido consultar la base de datos.',
        })
        return
      }
      if (!data) {
        showModal({
          variant: 'info',
          title: 'Sin datos',
          message:
            'No hay ninguna porra guardada con ese usuario. Comprueba la escritura (solo minúsculas, números, guion y guion bajo).',
        })
        return
      }

      setUsername(data.username || u)
      setDisplayName(
        (typeof data.display_name === 'string' && data.display_name.trim()) ||
          (typeof data.displayName === 'string' && data.displayName.trim()) ||
          (typeof data.nickname === 'string' && data.nickname.trim()) ||
          '',
      )
      setPredictions(
        data.predictions && typeof data.predictions === 'object' ? data.predictions : {},
      )
      setKnockoutScores(
        data.knockout && typeof data.knockout === 'object' ? data.knockout : {},
      )
      setSpecials({ ...defaultSpecials(), ...(typeof data.specials === 'object' && data.specials ? data.specials : {}) })
      setSessionConnected(true)
    } finally {
      setLoadBusy(false)
    }
  }

  const disconnectSession = () => {
    setSessionConnected(false)
    setUsername('')
    setDisplayName('')
    setPredictions({})
    setKnockoutScores({})
    setSpecials(defaultSpecials())
  }

  const ranking = useMemo(() => {
    const list = Array.isArray(savedUsers) ? savedUsers : []
    return [...list].sort((a, b) => {
      const dp = (b.points ?? 0) - (a.points ?? 0)
      if (dp !== 0) return dp
      const dt = String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? ''))
      if (dt !== 0) return dt
      return String(a.username ?? a.nickname ?? '').localeCompare(String(b.username ?? b.nickname ?? ''))
    })
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

  if (panel === 'official') {
    return (
      <OfficialResultsPanel
        onBack={() => {
          window.location.hash = ''
        }}
      />
    )
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
              <p className="mt-4 mb-0">
                <a
                  href={OFFICIAL_HASH}
                  className="text-sm font-semibold text-amber-200 hover:text-amber-100 underline decoration-amber-200/50 underline-offset-2"
                >
                  Panel resultados oficiales (admin)
                </a>
                <span className="text-sky-200/60 text-sm"> · Introduce marcadores reales y recalcula puntos</span>
              </p>
            </div>

            <div className="bg-black/25 backdrop-blur-md rounded-2xl border border-white/15 p-5 w-full md:max-w-md md:w-[26rem]">
              {sessionConnected ? (
                <>
                  <div
                    className="flex items-start gap-3 mb-4"
                    role="status"
                    aria-live="polite"
                  >
                    <span
                      className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.65)] ring-2 ring-emerald-400/40"
                      title="Sesión activa"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-emerald-300 m-0 tracking-wide uppercase">
                        Usuario conectado
                      </p>
                      <p className="text-xs text-sky-200/75 mt-1 m-0 leading-snug">
                        Tu porra está cargada. Pulsa Desconectar para cerrar sesión y volver a introducir tu
                        usuario y datos de acceso.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-3 mb-3 space-y-2">
                    <div>
                      <div className="text-[11px] text-sky-300/80 uppercase tracking-wider mb-0.5">
                        Usuario (privado)
                      </div>
                      <div className="font-mono text-base font-semibold text-white break-all">
                        {username}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-sky-300/80 uppercase tracking-wider mb-0.5">
                        Nombre en la clasificación
                      </div>
                      <div className="text-sm font-medium text-sky-50">{displayName.trim() || '—'}</div>
                    </div>
                  </div>

                  <label className="text-sm text-sky-200/90 mb-1 block">
                    Editar nombre público (opcional antes de guardar)
                  </label>
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Ej: Carlos"
                    autoComplete="off"
                    className="w-full rounded-xl border border-white/20 bg-white/95 p-3 text-slate-900 mb-3"
                  />

                  <div className="mt-1 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={savePrediction}
                      disabled={predictionsLockedGlobally}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold p-3 flex items-center justify-center gap-2 hover:brightness-110 transition disabled:opacity-50"
                    >
                      {predictionsLockedGlobally ? <Lock size={18} /> : <Save size={18} />}
                      {predictionsLockedGlobally ? 'Bloqueado' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={disconnectSession}
                      className="w-full rounded-xl border border-white/25 bg-white/5 text-white font-semibold p-3 flex items-center justify-center gap-2 hover:bg-white/10 transition"
                    >
                      <LogOut size={18} />
                      Desconectar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <label className="text-sm text-sky-200/90 mb-1 block">Usuario (privado)</label>
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Ej: carlos_83"
                    autoComplete="username"
                    className="w-full rounded-xl border border-white/20 bg-white/95 p-3 text-slate-900"
                  />
                  <p className="text-[11px] text-sky-200/65 mt-1 mb-3 leading-snug m-0">
                    Solo tú deberías conocerlo: sirve para cargar y guardar. No se muestra en la clasificación.
                  </p>

                  <label className="text-sm text-sky-200/90 mb-1 block">Nombre en la clasificación (público)</label>
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Ej: Carlos"
                    autoComplete="off"
                    className="w-full rounded-xl border border-white/20 bg-white/95 p-3 text-slate-900"
                  />
                  <p className="text-[11px] text-sky-200/65 mt-1 mb-3 leading-snug m-0">
                    Así te verán el resto en el ranking; puede repetirse entre distintos usuarios.
                  </p>

                  <div className="mt-1 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={loadPorraByUsername}
                      disabled={loadBusy}
                      className="w-full rounded-xl border border-sky-300/40 bg-sky-500/20 text-white font-semibold p-3 flex items-center justify-center gap-2 hover:bg-sky-500/30 transition disabled:opacity-50"
                    >
                      <FolderOpen size={18} />
                      {loadBusy ? 'Cargando…' : 'Cargar mi porra'}
                    </button>
                    <button
                      type="button"
                      onClick={savePrediction}
                      disabled={predictionsLockedGlobally}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold p-3 flex items-center justify-center gap-2 hover:brightness-110 transition disabled:opacity-50"
                    >
                      {predictionsLockedGlobally ? <Lock size={18} /> : <Save size={18} />}
                      {predictionsLockedGlobally ? 'Bloqueado' : 'Guardar'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {predictionsLockedGlobally ? (
          <div
            className="rounded-2xl border border-amber-400/40 bg-amber-950/40 px-4 py-3 text-sm text-amber-100 flex items-center gap-2"
            role="status"
          >
            <Lock className="shrink-0 text-amber-300" size={18} />
            <span>
              La edición de pronósticos está <strong className="font-semibold text-white">cerrada para todos</strong>
              . Puedes seguir cargando una porra para consultarla; no se pueden guardar cambios.
            </span>
          </div>
        ) : null}

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
                                    disabled={predictionsLockedGlobally}
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
                                    disabled={predictionsLockedGlobally}
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
              locked={predictionsLockedGlobally}
            />

            <div className="rounded-3xl border border-cyan-400/15 bg-slate-900/50 backdrop-blur-md shadow-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Star className="text-amber-300" />
                <h2 className="text-2xl font-bold text-white">Predicciones especiales</h2>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
                <input
                  disabled={predictionsLockedGlobally}
                  className="rounded-2xl border border-white/15 bg-black/30 p-4 text-white placeholder:text-slate-500 disabled:opacity-40"
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
                  disabled={predictionsLockedGlobally}
                  className="rounded-2xl border border-white/15 bg-black/30 p-4 text-white placeholder:text-slate-500 disabled:opacity-40"
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
                  disabled={predictionsLockedGlobally}
                  className="rounded-2xl border border-white/15 bg-black/30 p-4 text-white placeholder:text-slate-500 disabled:opacity-40"
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
                  disabled={predictionsLockedGlobally}
                  className="rounded-2xl border border-white/15 bg-black/30 p-4 text-white placeholder:text-slate-500 disabled:opacity-40"
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
                  disabled={predictionsLockedGlobally}
                  className="rounded-2xl border border-white/15 bg-black/30 p-4 text-white placeholder:text-slate-500 disabled:opacity-40"
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
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-amber-300" />
                <h2 className="text-2xl font-bold text-white">Clasificación global</h2>
              </div>
              <p className="text-xs text-sky-200/70 mb-4 leading-snug m-0">
                Orden por puntos tras usar el panel de resultados oficiales (enlace arriba) y pulsar
                «Guardar y recalcular puntos». Si todos tienen 0, nadie ha guardado aún resultados oficiales o
                no hay coincidencias con los pronósticos. Pulsa sobre la cifra de puntos de un participante para
                ver el desglose (partido, puntos y motivo).
              </p>

              <div className="space-y-3">
                {ranking.length === 0 && (
                  <div className="text-slate-400 text-sm">Todavía no hay usuarios registrados.</div>
                )}

                {ranking.map((user, index) => (
                  <div
                    key={user.username || user.nickname || index}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white">
                        #{index + 1} {rankingDisplayName(user)}
                      </div>

                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(user.updatedAt).toLocaleString()}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openPointsBreakdown(user)}
                      className={`text-2xl font-black tabular-nums rounded-lg px-2 py-1 -my-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
                        (user.points ?? 0) > 0
                          ? 'text-amber-300 hover:bg-amber-400/15'
                          : 'text-slate-500 hover:bg-white/10'
                      }`}
                      title="Ver desglose: partido, puntos y motivo"
                    >
                      {user.points ?? 0}
                    </button>
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
                type="button"
                onClick={() => setLockModalMode(predictionsLockedGlobally ? 'unlock' : 'lock')}
                className="w-full rounded-2xl bg-gradient-to-r from-[#c8102e] to-[#8b0000] text-white p-4 font-bold hover:brightness-110 transition"
              >
                {predictionsLockedGlobally ? 'Desbloquear edición' : 'Bloquear edición'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <PointsBreakdownModal state={pointsBreakdown} onClose={closePointsBreakdown} />
      <MessageModal modal={modal} onClose={closeModal} />
      <AdminLockModal
        mode={lockModalMode}
        onClose={() => setLockModalMode(null)}
        onSuccess={async locked => {
          await setPredictionsGloballyLocked(locked)
          setPredictionsLockedGlobally(locked)
          showModal({
            variant: 'success',
            title: locked ? 'Edición bloqueada' : 'Edición desbloqueada',
            message: locked
              ? 'Nadie puede guardar cambios en sus porras hasta que un administrador desbloquee con la misma contraseña.'
              : 'Los participantes ya pueden editar y guardar sus pronósticos.',
          })
        }}
      />
    </div>
  )
}
