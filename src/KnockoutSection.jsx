import { getKnockoutWinner } from './bracketLogic.js'
import { TeamFlag } from './TeamFlag.jsx'

function ScorePair({ sKey, scores, onPatch, locked, canEdit }) {
  const p = scores[sKey] || {}
  const editable = canEdit && !locked
  return (
    <div className="flex items-center justify-center gap-2 shrink-0">
      <input
        type="number"
        min="0"
        disabled={!editable}
        className="w-12 rounded-lg border border-white/20 bg-black/30 p-2 text-center text-sm disabled:opacity-40"
        value={p.home ?? ''}
        onChange={e => onPatch(sKey, 'home', e.target.value)}
      />
      <span className="text-white/50">-</span>
      <input
        type="number"
        min="0"
        disabled={!editable}
        className="w-12 rounded-lg border border-white/20 bg-black/30 p-2 text-center text-sm disabled:opacity-40"
        value={p.away ?? ''}
        onChange={e => onPatch(sKey, 'away', e.target.value)}
      />
    </div>
  )
}

function MatchCard({
  title,
  dateLabel,
  homeLabel,
  awayLabel,
  homeTeam,
  awayTeam,
  scoreKey,
  scores,
  onPatch,
  locked,
}) {
  const p = scores[scoreKey] || {}
  const decided = getKnockoutWinner(homeTeam, awayTeam, p.home, p.away)
  const canEdit = Boolean(homeTeam && awayTeam)
  return (
    <div className="rounded-2xl border border-[#2a6fb0]/40 bg-gradient-to-br from-[#0a2342]/90 to-[#051525]/95 p-4 text-left flex flex-col gap-2 shadow-lg shadow-black/30">
      <div className="flex justify-between items-start gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#7ec8ff]">
          {title}
        </span>
        {dateLabel && (
          <span className="text-[11px] text-amber-200/90 whitespace-nowrap">{dateLabel}</span>
        )}
      </div>
      <div className="flex items-center gap-2 min-h-[3rem]">
        <div className="flex-1 min-w-0">
          <div
            className={`flex items-start gap-2 min-w-0 ${decided === homeTeam ? 'text-amber-300' : 'text-white/90'}`}
          >
            {homeTeam ? <TeamFlag teamName={homeTeam} size={20} /> : null}
            <span className="text-sm font-semibold leading-snug">{homeLabel}</span>
          </div>
          <div className="text-center text-[10px] text-white/40 py-1">vs</div>
          <div
            className={`flex items-start gap-2 min-w-0 ${decided === awayTeam ? 'text-amber-300' : 'text-white/90'}`}
          >
            {awayTeam ? <TeamFlag teamName={awayTeam} size={20} /> : null}
            <span className="text-sm font-semibold leading-snug">{awayLabel}</span>
          </div>
        </div>
        <ScorePair
          sKey={scoreKey}
          scores={scores}
          onPatch={onPatch}
          locked={locked}
          canEdit={canEdit}
        />
      </div>
      {!canEdit && (
        <p className="text-[10px] text-sky-200/60 m-0">Completa fases anteriores para habilitar marcador.</p>
      )}
    </div>
  )
}

export default function KnockoutSection({ bracket, knockoutScores, onPatch, locked }) {
  return (
    <div className="rounded-3xl border border-[#c9a227]/25 bg-[#061a2e]/85 backdrop-blur-md p-6 shadow-2xl shadow-black/40">
      <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-sky-200 mb-1">
        Eliminatorias
      </h2>
      <p className="text-sm text-sky-100/75 mb-8 leading-relaxed">
        Introduce marcadores en cada ronda (sin empates en 90&apos;). Los cruces posteriores se
        rellenan con los ganadores. Fechas según calendario FIFA (Wikipedia / FIFA).
      </p>

      <h3 className="font-bold text-amber-200/95 text-sm uppercase tracking-wide mb-3">
        Dieciseisavos (73–88)
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 mb-10">
        {bracket.round32.map(m => (
          <MatchCard
            key={m.fifa}
            title={`Partido ${m.fifa}`}
            dateLabel={m.dateLabel}
            homeLabel={m.homeLabel}
            awayLabel={m.awayLabel}
            homeTeam={m.homeTeam}
            awayTeam={m.awayTeam}
            scoreKey={m.scoreKey}
            scores={knockoutScores}
            onPatch={onPatch}
            locked={locked}
          />
        ))}
      </div>

      <h3 className="font-bold text-amber-200/95 text-sm uppercase tracking-wide mb-3">
        Octavos (89–96)
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 mb-10">
        {bracket.round16.map(m => (
          <MatchCard
            key={m.fifa}
            title={`Partido ${m.fifa}`}
            dateLabel={m.labelEs}
            homeLabel={m.homeLabel}
            awayLabel={m.awayLabel}
            homeTeam={m.homeTeam}
            awayTeam={m.awayTeam}
            scoreKey={m.scoreKey}
            scores={knockoutScores}
            onPatch={onPatch}
            locked={locked}
          />
        ))}
      </div>

      <h3 className="font-bold text-amber-200/95 text-sm uppercase tracking-wide mb-3">
        Cuartos (97–100)
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 mb-10">
        {bracket.quarter.map(m => (
          <MatchCard
            key={m.fifa}
            title={`Partido ${m.fifa}`}
            dateLabel={m.labelEs}
            homeLabel={m.homeLabel}
            awayLabel={m.awayLabel}
            homeTeam={m.homeTeam}
            awayTeam={m.awayTeam}
            scoreKey={m.scoreKey}
            scores={knockoutScores}
            onPatch={onPatch}
            locked={locked}
          />
        ))}
      </div>

      <h3 className="font-bold text-amber-200/95 text-sm uppercase tracking-wide mb-3">
        Semifinales (101–102)
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 mb-10">
        {bracket.semi.map(m => (
          <MatchCard
            key={m.fifa}
            title={`Partido ${m.fifa}`}
            dateLabel={m.labelEs}
            homeLabel={m.homeLabel}
            awayLabel={m.awayLabel}
            homeTeam={m.homeTeam}
            awayTeam={m.awayTeam}
            scoreKey={m.scoreKey}
            scores={knockoutScores}
            onPatch={onPatch}
            locked={locked}
          />
        ))}
      </div>

      <h3 className="font-bold text-amber-200/95 text-sm uppercase tracking-wide mb-3">
        Tercer puesto (103)
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 mb-10">
        <MatchCard
          title="Partido 103"
          dateLabel={bracket.thirdPlace.dateLabel}
          homeLabel={bracket.thirdPlace.homeLabel}
          awayLabel={bracket.thirdPlace.awayLabel}
          homeTeam={bracket.thirdPlace.homeTeam}
          awayTeam={bracket.thirdPlace.awayTeam}
          scoreKey={bracket.thirdPlace.scoreKey}
          scores={knockoutScores}
          onPatch={onPatch}
          locked={locked}
        />
      </div>

      <h3 className="font-bold text-amber-200/95 text-sm uppercase tracking-wide mb-3">
        Final (104)
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <MatchCard
          title="Final"
          dateLabel={bracket.final.dateLabel}
          homeLabel={bracket.final.homeLabel}
          awayLabel={bracket.final.awayLabel}
          homeTeam={bracket.final.homeTeam}
          awayTeam={bracket.final.awayTeam}
          scoreKey={bracket.final.scoreKey}
          scores={knockoutScores}
          onPatch={onPatch}
          locked={locked}
        />
      </div>

      {bracket.final.winner && (
        <div className="mt-8 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 to-sky-500/10 p-5 text-center">
          <div className="text-xs uppercase tracking-widest text-amber-200/80 mb-1">
            Campeón (porra)
          </div>
          <div className="text-2xl font-black text-amber-100 inline-flex items-center justify-center gap-3 flex-wrap">
            <TeamFlag teamName={bracket.final.winner} size={28} />
            <span>{bracket.final.winner}</span>
          </div>
        </div>
      )}
    </div>
  )
}
