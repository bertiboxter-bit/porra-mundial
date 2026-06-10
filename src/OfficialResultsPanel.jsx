import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Save, Loader2, Goal, Star, Share2, Shield } from 'lucide-react'
import {
  GROUP_LETTERS,
  GROUPS,
  GROUP_STAGE_MATCHES,
  calculateGroupTable,
  computeFullKnockout,
  applyKnockoutScorePatch,
  applyDefaultTieOrdersToPredictions,
} from './bracketLogic.js'
import KnockoutSection from './KnockoutSection.jsx'
import { TeamNameWithFlag } from './TeamFlag.jsx'
import GroupTieBreakPanel from './GroupTieBreakPanel.jsx'
import MatchFifaLink from './MatchFifaLink.jsx'
import ScoreInput from './ScoreInput.jsx'
import { getGroupMatchKickoffLabelEs } from './groupMatchKickoffs.js'
import { sanitizeScoreInput } from './scoreInput.js'
import MessageModal from './MessageModal.jsx'
import {
  fetchOfficialState,
  fetchOfficialResultsLog,
  saveOfficialAndRecalculatePoints,
} from './officialResultsService.js'
import OfficialResultsHistory from './OfficialResultsHistory.jsx'
import OfficialSavedByField from './OfficialSavedByField.jsx'
import {
  readOfficialAdminName,
  writeOfficialAdminName,
  normalizeOfficialSavedByName,
  validateOfficialSavedByName,
} from './officialAdminName.js'
import { mergeSpecials } from './porraSpecials.js'
import { WORLD_CUP_GOALKEEPER_OPTIONS } from './worldCup2026Goalkeepers.js'
import { WORLD_CUP_STAR_PLAYER_OPTIONS } from './worldCup2026StarPlayers.js'

export default function OfficialResultsPanel({ onBack }) {
  const [predictions, setPredictions] = useState({})
  const [knockoutScores, setKnockoutScores] = useState({})
  const [specials, setSpecials] = useState(() => mergeSpecials(null))
  const [loadBusy, setLoadBusy] = useState(true)
  const [saveBusy, setSaveBusy] = useState(false)
  const [modal, setModal] = useState(null)
  const [savedByName, setSavedByName] = useState(() => readOfficialAdminName())
  const [historyRows, setHistoryRows] = useState([])
  const [historyError, setHistoryError] = useState(false)

  const closeModal = useCallback(() => setModal(null), [])
  const showModal = useCallback(payload => {
    setModal({
      title: payload.title ?? '',
      message: payload.message,
      variant: payload.variant ?? 'info',
    })
  }, [])

  const loadOfficialResultsHistory = useCallback(async () => {
    const { rows, error } = await fetchOfficialResultsLog()
    setHistoryRows(rows)
    setHistoryError(Boolean(error))
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadBusy(true)
      try {
        const st = await fetchOfficialState()
        if (!cancelled) await loadOfficialResultsHistory()
        if (cancelled) return
        if (st) {
          setPredictions(st.predictions || {})
          setKnockoutScores(st.knockout || {})
          setSpecials(mergeSpecials(st.specials))
        }
      } catch (e) {
        console.error(e)
        if (!cancelled) {
          showModal({
            variant: 'error',
            title: 'No se pudo cargar',
            message:
              '¿Has creado la tabla official_state en la base de datos? Ejecuta el script official-state.sql del repositorio en el editor SQL de tu proveedor.',
          })
        }
      } finally {
        if (!cancelled) setLoadBusy(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [showModal, loadOfficialResultsHistory])

  const handleSavedByNameChange = useCallback(value => {
    setSavedByName(value)
    writeOfficialAdminName(value)
  }, [])

  const fullBracket = useMemo(
    () => computeFullKnockout(predictions, knockoutScores),
    [predictions, knockoutScores],
  )

  const patchKoScore = (key, side, val) => {
    setKnockoutScores(prev => applyKnockoutScorePatch(prev, key, side, val))
  }

  const savedByNameError = validateOfficialSavedByName(savedByName)
  const canSaveOfficial = !savedByNameError

  const handleSave = async () => {
    const nameError = validateOfficialSavedByName(savedByName)
    if (nameError) {
      showModal({
        variant: 'error',
        title: 'Nombre obligatorio',
        message: nameError,
      })
      return
    }

    setSaveBusy(true)
    try {
      const predictionsToSave = applyDefaultTieOrdersToPredictions(predictions)
      setPredictions(predictionsToSave)
      const registradoPor = normalizeOfficialSavedByName(savedByName)
      await saveOfficialAndRecalculatePoints({
        predictions: predictionsToSave,
        knockout: knockoutScores,
        specials,
        savedByName: registradoPor,
      })
      await loadOfficialResultsHistory()
      showModal({
        variant: 'success',
        title: 'Guardado',
        message: `Resultados oficiales guardados por ${registradoPor}. Puntos y clasificación actualizados para todos los participantes.`,
      })
    } catch (e) {
      console.error(e)
      showModal({
        variant: 'error',
        title: 'Error al guardar',
        message: e?.message || 'No se pudo guardar o recalcular. Revisa los permisos de la base de datos y que exista la tabla official_state.',
      })
    } finally {
      setSaveBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f18] via-[#142038] to-[#1a0a20] p-4 md:p-8 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="rounded-2xl border border-amber-400/20 bg-black/30 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 text-sky-200 hover:text-white text-sm font-semibold mb-3"
              >
                <ArrowLeft size={18} />
                Volver a la porra
              </button>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-sky-200">
                Resultados oficiales
              </h1>
              <p className="text-sky-100/80 text-sm mt-2 max-w-2xl m-0">
                Introduce los mismos marcadores que en la porra, pero con los resultados reales. Al guardar se
                actualizan los puntos de cada participante según el reglamento (grupos, KO con mismos
                emparejamientos, premios si los rellenas abajo).
              </p>
            </div>
            <button
              type="button"
              disabled={saveBusy || loadBusy || !canSaveOfficial}
              onClick={handleSave}
              title={
                canSaveOfficial
                  ? undefined
                  : 'Rellena «Registrado por» antes de guardar'
              }
              className="shrink-0 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold px-6 py-3 flex items-center justify-center gap-2 hover:brightness-110 transition disabled:opacity-50"
            >
              {saveBusy ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {saveBusy ? 'Guardando…' : 'Guardar y recalcular puntos'}
            </button>
          </div>

          <OfficialSavedByField
            savedByName={savedByName}
            savedByNameError={savedByNameError}
            onSavedByNameChange={handleSavedByNameChange}
          />
        </header>

        <OfficialResultsHistory historyRows={historyRows} historyError={historyError} />

        {loadBusy ? (
          <div className="text-center text-sky-200 py-20">Cargando datos oficiales…</div>
        ) : (
          <>
            <div className="rounded-3xl border border-cyan-400/15 bg-slate-900/50 backdrop-blur-md shadow-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Fase de grupos (oficial)</h2>
              <div className="space-y-8">
                {GROUP_LETTERS.map(group => {
                  const teams = GROUPS[group]
                  const groupMatches = GROUP_STAGE_MATCHES.filter(m => m.group === group)
                  const table = calculateGroupTable(predictions, teams, groupMatches, group)
                  return (
                    <div
                      key={group}
                      className="rounded-3xl border border-[#2a6fb0]/35 bg-gradient-to-br from-slate-900/80 to-[#061525]/90 p-5 shadow-lg"
                    >
                      <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-sky-200 mb-5">
                        Grupo {group}
                      </h3>
                      <div className="grid lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          {groupMatches.map(match => (
                            <div
                              key={match.id}
                              className="rounded-2xl border border-white/10 bg-black/25 p-3"
                            >
                              <div className="text-xs text-sky-200/80 mb-2 text-left flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span>
                                  <span className="font-bold text-amber-200/90">Jornada {match.matchday}</span>
                                  <span className="text-white/50"> · </span>
                                  <span>
                                    {match.kickoffLabelEs ??
                                      getGroupMatchKickoffLabelEs(match.home, match.away) ??
                                      match.dateLabel}
                                  </span>
                                </span>
                                <MatchFifaLink home={match.home} away={match.away} />
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
                                    className="w-14 rounded-lg border border-white/20 bg-slate-950/80 p-2 text-center text-white"
                                    value={predictions[match.id]?.home ?? ''}
                                    onChange={val =>
                                      setPredictions(prev => ({
                                        ...prev,
                                        [match.id]: {
                                          ...prev[match.id],
                                          home: sanitizeScoreInput(val),
                                        },
                                      }))
                                    }
                                    aria-label={`Goles de ${match.home}`}
                                  />
                                  <span className="text-white/40">-</span>
                                  <ScoreInput
                                    className="w-14 rounded-lg border border-white/20 bg-slate-950/80 p-2 text-center text-white"
                                    value={predictions[match.id]?.away ?? ''}
                                    onChange={val =>
                                      setPredictions(prev => ({
                                        ...prev,
                                        [match.id]: {
                                          ...prev[match.id],
                                          away: sanitizeScoreInput(val),
                                        },
                                      }))
                                    }
                                    aria-label={`Goles de ${match.away}`}
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
                                {table.map((team, idx) => (
                                  <tr key={team.team} className="border-t border-white/10">
                                    <td className="p-3 font-medium text-white/90">
                                      <span className="inline-flex items-center gap-2">
                                        <span className="text-[10px] text-sky-300/70 w-4 shrink-0">
                                          {idx + 1}º
                                        </span>
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
                            requireExplicitConfirm={false}
                          />
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
              locked={false}
            />

            <div className="rounded-3xl border border-amber-400/20 bg-slate-900/60 p-6">
              <h2 className="text-xl font-bold text-white mb-2">Premios oficiales (texto libre)</h2>
              <p className="text-sm text-slate-400 mb-4 m-0">
                Misma ortografía que usen los participantes (sin distinguir mayúsculas). Campeón, subcampeón
                y 3.er puesto se validan también contra la final y el partido de tercer puesto si hay
                marcadores. Pichichi y mejor jugador: rellena 1º, 2º y 3º puesto para puntuar el podio. Guante de
                oro: un solo ganador (+5 pts).
              </p>
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-amber-200/90 mb-2 m-0 flex items-center gap-2">
                    <Goal size={16} className="text-amber-300/90 shrink-0" aria-hidden />
                    Pichichi / goleador
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      ['topScorer', '1.er puesto'],
                      ['topScorer2', '2.º puesto'],
                      ['topScorer3', '3.er puesto'],
                    ].map(([key, label]) => (
                      <label key={key} className="block text-xs text-sky-200/90">
                        {label}
                        <input
                          list="wc-star-players-official"
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 p-2.5 text-sm text-white placeholder:text-slate-500"
                          placeholder="Jugador (sugerencias)"
                          value={specials[key] || ''}
                          onChange={e => setSpecials(prev => ({ ...prev, [key]: e.target.value }))}
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-200/90 mb-2 m-0 flex items-center gap-2">
                    <Star size={16} className="text-amber-300/90 shrink-0" aria-hidden />
                    Mejor jugador
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      ['bestPlayer', '1.er puesto'],
                      ['bestPlayer2', '2.º puesto'],
                      ['bestPlayer3', '3.er puesto'],
                    ].map(([key, label]) => (
                      <label key={key} className="block text-xs text-sky-200/90">
                        {label}
                        <input
                          list="wc-star-players-official"
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 p-2.5 text-sm text-white placeholder:text-slate-500"
                          placeholder="Jugador (sugerencias)"
                          value={specials[key] || ''}
                          onChange={e => setSpecials(prev => ({ ...prev, [key]: e.target.value }))}
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <label className="block text-sm text-sky-200/90 max-w-md">
                  <span className="inline-flex items-center gap-2">
                    <Share2 size={16} className="text-amber-300/90 shrink-0" aria-hidden />
                    Máximo asistente
                  </span>
                  <input
                    list="wc-star-players-official"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-white placeholder:text-slate-500"
                    placeholder="Jugador (sugerencias)"
                    value={specials.topAssist || ''}
                    onChange={e => setSpecials(prev => ({ ...prev, topAssist: e.target.value }))}
                  />
                </label>
                <label className="block text-sm text-sky-200/90 max-w-md">
                  <span className="inline-flex items-center gap-2">
                    <Shield size={16} className="text-amber-300/90 shrink-0" aria-hidden />
                    Guante de oro
                  </span>
                  <input
                    list="wc-goalkeepers-official"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-white placeholder:text-slate-500"
                    placeholder="Portero (sugerencias)"
                    value={specials.goldenGlove || ''}
                    onChange={e => setSpecials(prev => ({ ...prev, goldenGlove: e.target.value }))}
                  />
                </label>
                <datalist id="wc-star-players-official">
                  {WORLD_CUP_STAR_PLAYER_OPTIONS.map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
                <datalist id="wc-goalkeepers-official">
                  {WORLD_CUP_GOALKEEPER_OPTIONS.map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
            </div>
          </>
        )}
      </div>
      <MessageModal modal={modal} onClose={closeModal} />
    </div>
  )
}
