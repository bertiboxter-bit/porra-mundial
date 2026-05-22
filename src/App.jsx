import { supabase } from './supabase'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Trophy,
  Star,
  Goal,
  Users,
  Save,
  Lock,
  FolderOpen,
  LogOut,
  Home,
  Swords,
  SlidersHorizontal,
  LayoutList,
  LayoutGrid,
  CalendarDays,
} from 'lucide-react'
import {
  GROUP_LETTERS,
  computeFullKnockout,
  applyKnockoutScorePatch,
  listPendingGroupTieBreaks,
} from './bracketLogic.js'
import KnockoutSection from './KnockoutSection.jsx'
import GroupPhaseCard from './GroupPhaseCard.jsx'
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
import { defaultSpecials, mergeSpecials } from './porraSpecials.js'
import { podiumTeamsFromBracket } from './porraBracketPodium.js'
import { WORLD_CUP_STAR_PLAYER_OPTIONS } from './worldCup2026StarPlayers.js'
import {
  USERNAME_STORAGE_KEY,
  normalizeUsername,
  validateUsername,
  validateDisplayName,
  rankingDisplayName,
  readStoredUsername,
} from './userIdentity.js'
import { FIFA_FIXTURES_URL } from './fifaMatchUrls.js'
import PorraPreviewBanner from './PorraPreviewBanner.jsx'
import MatchPredictionsModal from './MatchPredictionsModal.jsx'
import {
  collectGroupMatchPredictions,
  collectKnockoutMatchPredictions,
} from './matchPredictions.js'

const OFFICIAL_HASH = '#resultados-oficiales'

const GROUP_VIEW_STORAGE_KEY = 'porra_mundial_group_view'
const GROUP_TAB_STORAGE_KEY = 'porra_mundial_group_tab'

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

  const scrollToSection = useCallback(id => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const [predictionsLockedGlobally, setPredictionsLockedGlobally] = useState(false)
  const [lockModalMode, setLockModalMode] = useState(null)
  const [porraPreviewUser, setPorraPreviewUser] = useState(null)
  const [matchPredictionsModal, setMatchPredictionsModal] = useState(null)

  const [predictions, setPredictions] = useState({})
  const [knockoutScores, setKnockoutScores] = useState({})

  const [specials, setSpecials] = useState(() => mergeSpecials(null))
  const [sessionConnected, setSessionConnected] = useState(false)
  const [groupViewMode, setGroupViewMode] = useState(() => {
    if (typeof window === 'undefined') return 'list'
    try {
      return localStorage.getItem(GROUP_VIEW_STORAGE_KEY) === 'tabs' ? 'tabs' : 'list'
    } catch {
      return 'list'
    }
  })
  const [activeGroupTab, setActiveGroupTab] = useState(() => {
    if (typeof window === 'undefined') return 'A'
    try {
      const t = localStorage.getItem(GROUP_TAB_STORAGE_KEY)
      if (t && GROUP_LETTERS.includes(t)) return t
    } catch {
      /* ignore */
    }
    return 'A'
  })

  useEffect(() => {
    try {
      if (username) localStorage.setItem(USERNAME_STORAGE_KEY, username)
      else localStorage.removeItem(USERNAME_STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [username])

  useEffect(() => {
    try {
      localStorage.setItem(GROUP_VIEW_STORAGE_KEY, groupViewMode)
    } catch {
      /* ignore */
    }
  }, [groupViewMode])

  useEffect(() => {
    try {
      localStorage.setItem(GROUP_TAB_STORAGE_KEY, activeGroupTab)
    } catch {
      /* ignore */
    }
  }, [activeGroupTab])

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
    if (porraPreviewUser) {
      showModal({
        variant: 'info',
        title: 'Solo lectura',
        message: 'Estás viendo la porra de otro participante. Pulsa «Volver a mi vista» para editar la tuya.',
      })
      return
    }
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

    const displayKey = d.toLowerCase()
    const displayTaken = savedUsers.some(row => {
      const rowUser = normalizeUsername(String(row.username ?? ''))
      if (rowUser === u) return false
      const pub = String(row.display_name ?? row.displayName ?? row.nickname ?? '')
        .trim()
        .toLowerCase()
      return pub === displayKey
    })
    if (displayTaken) {
      showModal({
        variant: 'error',
        title: 'Nombre en uso',
        message:
          'Ya hay otro participante con ese nombre en la clasificación (no se distingue mayúsculas). Elige otro nombre público.',
      })
      return
    }
    const pendingTies = listPendingGroupTieBreaks(predictions)
    if (pendingTies.length > 0) {
      const detail = pendingTies
        .map(p => `grupo ${p.group} (${p.teams.join(', ')})`)
        .join('; ')
      showModal({
        variant: 'error',
        title: 'Empates sin confirmar',
        message: `Hay equipos empatados a todo en fase de grupos. Ordena cada bloque y pulsa «Confirmar orden» antes de guardar: ${detail}.`,
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
          specials: mergeSpecials({
            ...specials,
            ...podiumTeamsFromBracket(
              computeFullKnockout(predictions, knockoutScores),
            ),
          }),
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
    } catch (e) {
      console.error(e)
      const msg = String(e?.message || '')
      const code = e?.code
      const dup =
        code === '23505' ||
        /unique|duplicate/i.test(msg) ||
        /display_name/i.test(msg)
      showModal({
        variant: 'error',
        title: 'No se pudo guardar',
        message: dup
          ? 'Ese nombre público o usuario ya está registrado (restricción única en base de datos). Elige otro nombre en la clasificación u otro usuario privado. Si falta el índice, ejecuta supabase/predictions-display-name-unique.sql.'
          : 'Revisa la conexión y los permisos. Si el error habla de UNIQUE o usuario duplicado, elige otro usuario (clave privada) o aplica el script predictions-username-display.sql del repositorio si aún no migraste la tabla.',
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
      setSpecials(mergeSpecials(data.specials))
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

  const isViewingOtherPorra = Boolean(porraPreviewUser)
  const isReadOnly = predictionsLockedGlobally || isViewingOtherPorra

  const activePredictions = useMemo(() => {
    if (!porraPreviewUser?.predictions || typeof porraPreviewUser.predictions !== 'object') {
      return predictions
    }
    return porraPreviewUser.predictions
  }, [porraPreviewUser, predictions])

  const activeKnockoutScores = useMemo(() => {
    if (!porraPreviewUser?.knockout || typeof porraPreviewUser.knockout !== 'object') {
      return knockoutScores
    }
    return porraPreviewUser.knockout
  }, [porraPreviewUser, knockoutScores])

  const activeSpecials = useMemo(
    () => (porraPreviewUser ? mergeSpecials(porraPreviewUser.specials) : specials),
    [porraPreviewUser, specials],
  )

  const openPorraPreview = useCallback(
    user => {
      setPorraPreviewUser(user)
      scrollToSection('section-grupos')
    },
    [scrollToSection],
  )

  const closePorraPreview = useCallback(() => setPorraPreviewUser(null), [])

  const closeMatchPredictionsModal = useCallback(() => setMatchPredictionsModal(null), [])

  const openGroupMatchPredictions = useCallback(
    match => {
      setMatchPredictionsModal({
        title: `${match.home} – ${match.away}`,
        subtitle: `Grupo ${match.group} · Jornada ${match.matchday}`,
        entries: collectGroupMatchPredictions(savedUsers, match.id),
      })
    },
    [savedUsers],
  )

  const openKnockoutMatchPredictions = useCallback(
    ({ title, subtitle, scoreKey }) => {
      setMatchPredictionsModal({
        title,
        subtitle,
        entries: collectKnockoutMatchPredictions(savedUsers, scoreKey),
      })
    },
    [savedUsers],
  )

  const fullBracket = useMemo(
    () => computeFullKnockout(activePredictions, activeKnockoutScores),
    [activePredictions, activeKnockoutScores],
  )

  /** Podio de equipos: solo desde marcadores de final y 3.er puesto (no editable). */
  const podiumTeams = useMemo(() => podiumTeamsFromBracket(fullBracket), [fullBracket])

  const patchKoScore = (key, side, val) => {
    if (isReadOnly) return
    setKnockoutScores(prev => applyKnockoutScorePatch(prev, key, side, val))
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
    <div className="min-h-screen bg-gradient-to-br from-[#050d1a] via-[#0a2342] to-[#1a0a28] text-slate-100 scroll-smooth">
      <nav
        className="fixed top-0 left-0 right-0 z-[90] border-b border-white/10 bg-[#060d18]/92 backdrop-blur-md shadow-md shadow-black/30"
        aria-label="Secciones de la porra"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center sm:justify-start gap-1 sm:gap-2 px-3 py-2">
          {[
            ['section-inicio', Home, 'Inicio'],
            ['section-grupos', Trophy, 'Grupos'],
            ['section-knockout', Swords, 'Eliminatorias'],
            ['section-specials', Star, 'Especiales'],
            ['section-ranking', Users, 'Clasificación'],
            ['section-admin', SlidersHorizontal, 'Admin'],
          ].map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollToSection(id)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-sky-100 hover:bg-white/10 transition"
            >
              <Icon size={16} className="opacity-90 shrink-0" aria-hidden />
              {label}
            </button>
          ))}
          <a
            href={FIFA_FIXTURES_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Horarios, dónde ver y resultados oficiales en FIFA.com"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-amber-200/95 hover:bg-amber-400/15 border border-amber-400/25 transition"
          >
            <CalendarDays size={16} className="opacity-90 shrink-0" aria-hidden />
            Partidos FIFA
          </a>
        </div>
      </nav>

      <div className="pt-[3.35rem] sm:pt-14 px-4 md:p-8 pb-10">
        <div className="max-w-7xl mx-auto space-y-6">
        <div
          id="section-inicio"
          className="scroll-mt-28 relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-r from-[#003875]/95 via-[#005a9c]/90 to-[#002a52]/95 p-8 shadow-2xl shadow-black/50"
        >
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
                    disabled={isViewingOtherPorra}
                    className="w-full rounded-xl border border-white/20 bg-white/95 p-3 text-slate-900 mb-3 disabled:opacity-50"
                  />

                  <div className="mt-1 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={savePrediction}
                      disabled={isReadOnly}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold p-3 flex items-center justify-center gap-2 hover:brightness-110 transition disabled:opacity-50"
                    >
                      {isReadOnly ? <Lock size={18} /> : <Save size={18} />}
                      {isReadOnly ? (isViewingOtherPorra ? 'Solo lectura' : 'Bloqueado') : 'Guardar'}
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
                    disabled={isViewingOtherPorra}
                    className="w-full rounded-xl border border-white/20 bg-white/95 p-3 text-slate-900 disabled:opacity-50"
                  />
                  <p className="text-[11px] text-sky-200/65 mt-1 mb-3 leading-snug m-0">
                    Debe ser único entre todos los participantes (no se distingue mayúsculas). El usuario privado
                    también es único.
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
                      disabled={isReadOnly}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold p-3 flex items-center justify-center gap-2 hover:brightness-110 transition disabled:opacity-50"
                    >
                      {isReadOnly ? <Lock size={18} /> : <Save size={18} />}
                      {isReadOnly ? (isViewingOtherPorra ? 'Solo lectura' : 'Bloqueado') : 'Guardar'}
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
              . Pulsa un nombre en la clasificación para ver su porra completa, o «Pronósticos» en cada
              partido para ver qué marcó cada participante.
            </span>
          </div>
        ) : null}

        <PorraPreviewBanner user={porraPreviewUser} onClose={closePorraPreview} />

        <div className="grid xl:grid-cols-3 gap-6 items-start">
          <div className="xl:col-span-2 min-w-0 space-y-6">
            <div
              id="section-grupos"
              className="scroll-mt-28 rounded-3xl border border-cyan-400/15 bg-slate-900/50 backdrop-blur-md shadow-xl p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Trophy className="text-amber-300" />
                  <h2 className="text-2xl font-bold text-white m-0">Fase de grupos</h2>
                </div>
                <div
                  className="flex flex-col gap-1.5 shrink-0"
                  role="group"
                  aria-label="Modo de visualización de grupos"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-300/75">
                    Vista
                  </span>
                  <div className="inline-flex rounded-xl border border-white/15 bg-black/30 p-1 gap-0.5">
                    <button
                      type="button"
                      onClick={() => setGroupViewMode('list')}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs sm:text-sm font-semibold transition ${
                        groupViewMode === 'list'
                          ? 'bg-sky-500/35 text-white shadow-sm'
                          : 'text-sky-200/80 hover:bg-white/10'
                      }`}
                    >
                      <LayoutList size={16} className="opacity-90 shrink-0" aria-hidden />
                      Lista
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupViewMode('tabs')}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs sm:text-sm font-semibold transition ${
                        groupViewMode === 'tabs'
                          ? 'bg-sky-500/35 text-white shadow-sm'
                          : 'text-sky-200/80 hover:bg-white/10'
                      }`}
                    >
                      <LayoutGrid size={16} className="opacity-90 shrink-0" aria-hidden />
                      Pestañas
                    </button>
                  </div>
                </div>
              </div>

              {groupViewMode === 'tabs' ? (
                <div
                  className="flex flex-wrap gap-1 mb-4 -mx-0.5 px-0.5 pb-2 border-b border-white/10 overflow-x-auto"
                  role="tablist"
                  aria-label="Seleccionar grupo"
                >
                  {GROUP_LETTERS.map(letter => (
                    <button
                      key={letter}
                      type="button"
                      role="tab"
                      aria-selected={activeGroupTab === letter}
                      onClick={() => setActiveGroupTab(letter)}
                      className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-bold transition min-w-[2.25rem] ${
                        activeGroupTab === letter
                          ? 'bg-amber-400/25 text-amber-100 ring-1 ring-amber-400/45'
                          : 'text-sky-200/85 hover:bg-white/10'
                      }`}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              ) : null}

              {groupViewMode === 'list' ? (
                <div className="space-y-8">
                  {GROUP_LETTERS.map(group => (
                    <GroupPhaseCard
                      key={group}
                      group={group}
                      predictions={activePredictions}
                      setPredictions={setPredictions}
                      readOnly={isReadOnly}
                      showMatchPredictions={predictionsLockedGlobally}
                      onOpenMatchPredictions={openGroupMatchPredictions}
                    />
                  ))}
                </div>
              ) : (
                <div role="tabpanel" aria-label={`Grupo ${activeGroupTab}`}>
                  <GroupPhaseCard
                    group={activeGroupTab}
                    predictions={activePredictions}
                    setPredictions={setPredictions}
                    readOnly={isReadOnly}
                    showMatchPredictions={predictionsLockedGlobally}
                    onOpenMatchPredictions={openGroupMatchPredictions}
                  />
                </div>
              )}
            </div>

            <div id="section-knockout" className="scroll-mt-28">
              <KnockoutSection
                bracket={fullBracket}
                knockoutScores={activeKnockoutScores}
                onPatch={patchKoScore}
                locked={isReadOnly}
                showMatchPredictions={predictionsLockedGlobally}
                onOpenKnockoutMatchPredictions={openKnockoutMatchPredictions}
              />
            </div>

            <div
              id="section-specials"
              className="scroll-mt-28 rounded-3xl border border-cyan-400/15 bg-slate-900/50 backdrop-blur-md shadow-xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Star className="text-amber-300" />
                <h2 className="text-2xl font-bold text-white">Predicciones especiales</h2>
              </div>

              <p className="text-sm text-sky-200/75 mb-4 m-0 leading-relaxed">
                Escribe los nombres de jugadores como en el panel de resultados oficiales (sin distinguir
                mayúsculas).{' '}
                <strong className="font-semibold text-amber-200/95">
                  Campeón, subcampeón y 3.er puesto
                </strong>{' '}
                salen de tus marcadores de la final y del partido por el tercer puesto en eliminatorias; no
                se pueden editar aquí.
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-amber-200/90 mb-2 m-0">Podio (equipos)</h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      ['champion', 'Campeón', podiumTeams.champion],
                      ['runnerUp', 'Subcampeón', podiumTeams.runnerUp],
                      ['thirdPlace', '3.er puesto', podiumTeams.thirdPlace],
                    ].map(([key, label, value]) => (
                      <label key={key} className="block text-xs text-sky-200/90">
                        {label}
                        <input
                          readOnly
                          disabled
                          tabIndex={-1}
                          aria-readonly="true"
                          className="mt-1 w-full cursor-default rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-sky-100/95 opacity-100"
                          placeholder="Marca final y 3.er puesto arriba"
                          value={value || ''}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-amber-200/90 mb-2 m-0">Pichichi / goleador</h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      ['topScorer', '1.er puesto'],
                      ['topScorer2', '2.º puesto'],
                      ['topScorer3', '3.er puesto'],
                    ].map(([key, label]) => (
                      <label key={key} className="block text-xs text-sky-200/90">
                        {label}
                        <input
                          disabled={isReadOnly}
                          list="wc-star-players"
                          className="mt-1 w-full rounded-2xl border border-white/15 bg-black/30 p-3 text-sm text-white placeholder:text-slate-500 disabled:opacity-40"
                          placeholder="Jugador (sugerencias)"
                          value={activeSpecials[key] || ''}
                          onChange={e => setSpecials(prev => ({ ...prev, [key]: e.target.value }))}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-amber-200/90 mb-2 m-0">Mejor jugador</h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      ['bestPlayer', '1.er puesto'],
                      ['bestPlayer2', '2.º puesto'],
                      ['bestPlayer3', '3.er puesto'],
                    ].map(([key, label]) => (
                      <label key={key} className="block text-xs text-sky-200/90">
                        {label}
                        <input
                          disabled={isReadOnly}
                          list="wc-star-players"
                          className="mt-1 w-full rounded-2xl border border-white/15 bg-black/30 p-3 text-sm text-white placeholder:text-slate-500 disabled:opacity-40"
                          placeholder="Jugador (sugerencias)"
                          value={activeSpecials[key] || ''}
                          onChange={e => setSpecials(prev => ({ ...prev, [key]: e.target.value }))}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <datalist id="wc-star-players">
                  {WORLD_CUP_STAR_PLAYER_OPTIONS.map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>

                <label className="block text-sm text-sky-200/90 max-w-md">
                  Máximo asistente
                  <input
                    disabled={isReadOnly}
                    list="wc-star-players"
                    className="mt-1 w-full rounded-2xl border border-white/15 bg-black/30 p-3 text-white placeholder:text-slate-500 disabled:opacity-40"
                    placeholder="Jugador (sugerencias)"
                    value={activeSpecials.topAssist || ''}
                    onChange={e => setSpecials(prev => ({ ...prev, topAssist: e.target.value }))}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-6">
            <div
              id="section-ranking"
              className="scroll-mt-28 rounded-3xl border border-cyan-400/15 bg-slate-900/55 backdrop-blur-md p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-amber-300" />
                <h2 className="text-2xl font-bold text-white">Clasificación global</h2>
              </div>
              <p className="text-xs text-sky-200/70 mb-4 leading-snug m-0">
                Orden por puntos tras usar el panel de resultados oficiales (enlace en Inicio) y pulsar «Guardar
                y recalcular puntos». Con la porra bloqueada, pulsa un nombre para ver su pronóstico en modo lectura.
                Pulsa la cifra de puntos para el desglose.
              </p>

              <div className="space-y-3 max-h-[min(70vh,42rem)] overflow-y-auto pr-1 -mr-1">
                {ranking.length === 0 && (
                  <div className="text-slate-400 text-sm">Todavía no hay usuarios registrados.</div>
                )}

                {ranking.map((user, index) => (
                  <div
                    key={user.username || user.nickname || index}
                    className={`rounded-2xl border p-4 flex items-center justify-between ${
                      porraPreviewUser?.username === user.username
                        ? 'border-amber-400/40 bg-amber-950/25'
                        : 'border-white/10 bg-black/30'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      {predictionsLockedGlobally ? (
                        <button
                          type="button"
                          onClick={() => openPorraPreview(user)}
                          className={`font-bold text-left hover:text-amber-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 rounded px-0.5 -mx-0.5 ${
                            porraPreviewUser?.username === user.username
                              ? 'text-amber-200 underline decoration-amber-400/50'
                              : 'text-white'
                          }`}
                          title="Ver porra en modo lectura"
                        >
                          #{index + 1} {rankingDisplayName(user)}
                        </button>
                      ) : (
                        <div className="font-bold text-white">
                          #{index + 1} {rankingDisplayName(user)}
                        </div>
                      )}

                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(user.updatedAt).toLocaleString('es-ES')}
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
                <div>
                  Resultado exacto (grupos y KO, con penaltis si hubo empate tras 90&apos; o 120&apos;, incl.
                  prórroga): +3 pts
                </div>
                <div>Ganador o empate acertado: +1 pt</div>
                <div>Clasificado en su posición de grupo: +2 pts</div>
                <div>Campeón acertado: +10 pts · Subcampeón: +5 · 3.er puesto: +4</div>
                <div>Pichichi / goleador 1.º / 2.º / 3.º: +5 / +3 / +2 pts</div>
                <div>Mejor jugador 1.º / 2.º / 3.º: +5 / +3 / +2 pts</div>
                <div>Máximo asistente: +5 pts</div>
              </div>
            </div>

            <div
              id="section-admin"
              className="scroll-mt-28 rounded-3xl border border-white/10 bg-slate-900/60 p-6"
            >
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
      </div>
      <PointsBreakdownModal state={pointsBreakdown} onClose={closePointsBreakdown} />
      <MatchPredictionsModal state={matchPredictionsModal} onClose={closeMatchPredictionsModal} />
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
