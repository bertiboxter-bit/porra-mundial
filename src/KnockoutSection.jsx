import { getKnockoutWinnerFromCell } from './bracketLogic.js'
import { TeamFlag } from './TeamFlag.jsx'
import MatchFifaLink from './MatchFifaLink.jsx'
import MatchPredictionsLink from './MatchPredictionsLink.jsx'
import ScoreInput from './ScoreInput.jsx'

function MatchCard({
  title,
  dateLabel,
  fifaMatchNumber,
  homeLabel,
  awayLabel,
  homeSource,
  awaySource,
  homeTeam,
  awayTeam,
  scoreKey,
  scores,
  onPatch,
  locked,
  showMatchPredictions,
  onOpenMatchPredictions,
}) {
  const p = scores[scoreKey] || {}
  const h = Number(p.home)
  const a = Number(p.away)
  const regValid = !Number.isNaN(h) && !Number.isNaN(a)
  const draw90 = regValid && h === a
  const decided = getKnockoutWinnerFromCell(homeTeam, awayTeam, p)
  const canEdit = Boolean(homeTeam && awayTeam)
  const editable = canEdit && !locked
  const inputCls =
    'w-11 sm:w-12 rounded-lg border border-white/20 bg-black/30 p-1.5 sm:p-2 text-center text-sm disabled:opacity-40'

  return (
    <div className="rounded-2xl border border-[#2a6fb0]/40 bg-gradient-to-br from-[#0a2342]/90 to-[#051525]/95 p-4 text-left flex flex-col gap-2 shadow-lg shadow-black/30">
      <div className="flex justify-between items-start gap-2 flex-wrap">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#7ec8ff]">
          {title}
        </span>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {dateLabel ? (
            <span className="text-[11px] text-amber-200/90 whitespace-nowrap">{dateLabel}</span>
          ) : null}
          {fifaMatchNumber ? (
            <MatchFifaLink
              home={homeTeam || undefined}
              away={awayTeam || undefined}
              fifaMatchNumber={fifaMatchNumber}
              compact
            />
          ) : null}
          {showMatchPredictions && onOpenMatchPredictions ? (
            <MatchPredictionsLink
              onClick={() =>
                onOpenMatchPredictions({
                  title:
                    homeTeam && awayTeam
                      ? `${homeTeam} – ${awayTeam}`
                      : `${homeLabel} – ${awayLabel}`,
                  subtitle: title,
                  scoreKey,
                })
              }
            />
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2 min-h-[3rem]">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 min-w-0">
            {homeTeam ? <TeamFlag teamName={homeTeam} size={20} /> : null}
            <div className="min-w-0">
              <div
                className={`text-sm font-semibold leading-snug ${decided === homeTeam ? 'text-amber-300' : 'text-white/90'}`}
              >
                {homeLabel}
              </div>
              {homeSource ? (
                <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-300/65">
                  {homeSource}
                </div>
              ) : null}
            </div>
          </div>
          <div className="text-center text-[10px] text-white/40 py-1">vs</div>
          <div className="flex items-start gap-2 min-w-0">
            {awayTeam ? <TeamFlag teamName={awayTeam} size={20} /> : null}
            <div className="min-w-0">
              <div
                className={`text-sm font-semibold leading-snug ${decided === awayTeam ? 'text-amber-300' : 'text-white/90'}`}
              >
                {awayLabel}
              </div>
              {awaySource ? (
                <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-300/65">
                  {awaySource}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 shrink-0">
          {draw90 ? (
            <div className="flex items-center justify-center gap-2">
              <ScoreInput
                disabled={!editable}
                aria-label="Penaltis marcados por el local"
                className={inputCls}
                value={p.pensHome ?? ''}
                onChange={val => onPatch(scoreKey, 'pensHome', val)}
              />
              <div className="flex items-center gap-1.5">
                <ScoreInput
                  disabled={!editable}
                  aria-label="Goles local (90' o 120', incl. prórroga)"
                  className={inputCls}
                  value={p.home ?? ''}
                  onChange={val => onPatch(scoreKey, 'home', val)}
                />
                <span className="text-white/50">-</span>
                <ScoreInput
                  disabled={!editable}
                  aria-label="Goles visitante (90' o 120', incl. prórroga)"
                  className={inputCls}
                  value={p.away ?? ''}
                  onChange={val => onPatch(scoreKey, 'away', val)}
                />
              </div>
              <ScoreInput
                disabled={!editable}
                aria-label="Penaltis marcados por el visitante"
                className={inputCls}
                value={p.pensAway ?? ''}
                onChange={val => onPatch(scoreKey, 'pensAway', val)}
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <ScoreInput
                disabled={!editable}
                aria-label="Goles local (90' o 120', incl. prórroga)"
                className={inputCls}
                value={p.home ?? ''}
                onChange={val => onPatch(scoreKey, 'home', val)}
              />
              <span className="text-white/50">-</span>
              <ScoreInput
                disabled={!editable}
                aria-label="Goles visitante (90' o 120', incl. prórroga)"
                className={inputCls}
                value={p.away ?? ''}
                onChange={val => onPatch(scoreKey, 'away', val)}
              />
            </div>
          )}
          {draw90 ? (
            <span className="text-[9px] text-sky-200/65 text-center max-w-[14rem] leading-tight">
              Empate tras 90&apos; o 120&apos; (incl. prórroga): penaltis a izquierda y derecha
            </span>
          ) : null}
        </div>
      </div>
      {!canEdit && (
        <p className="text-[10px] text-sky-200/60 m-0">Completa fases anteriores para habilitar marcador.</p>
      )}
    </div>
  )
}

export default function KnockoutSection({
  bracket,
  knockoutScores,
  onPatch,
  locked,
  showMatchPredictions,
  onOpenKnockoutMatchPredictions,
}) {
  const matchPredictionsProps = {
    showMatchPredictions,
    onOpenMatchPredictions: onOpenKnockoutMatchPredictions,
  }
  return (
    <div className="rounded-3xl border border-[#c9a227]/25 bg-[#061a2e]/85 backdrop-blur-md p-6 shadow-2xl shadow-black/40">
      <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-sky-200 mb-1">
        Eliminatorias
      </h2>
      <p className="text-sm text-sky-100/75 mb-8 leading-relaxed">
        Marcador al final del tiempo reglamentario (90 o 120 minutos, incluida la prórroga si hubo). Si hay
        empate, aparecen dos celdas para la tanda de penaltis (goles anotados en la serie). Los cruces posteriores
        usan el ganador definitivo.
      </p>

      <h3 className="font-bold text-amber-200/95 text-sm uppercase tracking-wide mb-3">
        Dieciseisavos (73–88)
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 mb-10">
        {bracket.round32.map(m => (
          <MatchCard
            key={m.fifa}
            title={`Partido ${m.fifa}`}
            fifaMatchNumber={m.fifa}
            dateLabel={m.dateLabel}
            homeLabel={m.homeLabel}
            awayLabel={m.awayLabel}
            homeSource={m.homeSource}
            awaySource={m.awaySource}
            homeTeam={m.homeTeam}
            awayTeam={m.awayTeam}
            scoreKey={m.scoreKey}
            scores={knockoutScores}
            onPatch={onPatch}
            locked={locked}
            {...matchPredictionsProps}
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
            fifaMatchNumber={m.fifa}
            dateLabel={m.labelEs}
            homeLabel={m.homeLabel}
            awayLabel={m.awayLabel}
            homeSource={m.homeSource}
            awaySource={m.awaySource}
            homeTeam={m.homeTeam}
            awayTeam={m.awayTeam}
            scoreKey={m.scoreKey}
            scores={knockoutScores}
            onPatch={onPatch}
            locked={locked}
            {...matchPredictionsProps}
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
            fifaMatchNumber={m.fifa}
            dateLabel={m.labelEs}
            homeLabel={m.homeLabel}
            awayLabel={m.awayLabel}
            homeSource={m.homeSource}
            awaySource={m.awaySource}
            homeTeam={m.homeTeam}
            awayTeam={m.awayTeam}
            scoreKey={m.scoreKey}
            scores={knockoutScores}
            onPatch={onPatch}
            locked={locked}
            {...matchPredictionsProps}
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
            fifaMatchNumber={m.fifa}
            dateLabel={m.labelEs}
            homeLabel={m.homeLabel}
            awayLabel={m.awayLabel}
            homeSource={m.homeSource}
            awaySource={m.awaySource}
            homeTeam={m.homeTeam}
            awayTeam={m.awayTeam}
            scoreKey={m.scoreKey}
            scores={knockoutScores}
            onPatch={onPatch}
            locked={locked}
            {...matchPredictionsProps}
          />
        ))}
      </div>

      <h3 className="font-bold text-amber-200/95 text-sm uppercase tracking-wide mb-3">
        Tercer puesto (103)
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 mb-10">
        <MatchCard
          title="Partido 103"
          fifaMatchNumber={103}
          dateLabel={bracket.thirdPlace.dateLabel}
          homeLabel={bracket.thirdPlace.homeLabel}
          awayLabel={bracket.thirdPlace.awayLabel}
          homeSource={bracket.thirdPlace.homeSource}
          awaySource={bracket.thirdPlace.awaySource}
          homeTeam={bracket.thirdPlace.homeTeam}
          awayTeam={bracket.thirdPlace.awayTeam}
          scoreKey={bracket.thirdPlace.scoreKey}
          scores={knockoutScores}
          onPatch={onPatch}
          locked={locked}
          {...matchPredictionsProps}
        />
      </div>

      <h3 className="font-bold text-amber-200/95 text-sm uppercase tracking-wide mb-3">
        Final (104)
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <MatchCard
          title="Final"
          fifaMatchNumber={104}
          dateLabel={bracket.final.dateLabel}
          homeLabel={bracket.final.homeLabel}
          awayLabel={bracket.final.awayLabel}
          homeSource={bracket.final.homeSource}
          awaySource={bracket.final.awaySource}
          homeTeam={bracket.final.homeTeam}
          awayTeam={bracket.final.awayTeam}
          scoreKey={bracket.final.scoreKey}
          scores={knockoutScores}
          onPatch={onPatch}
          locked={locked}
          {...matchPredictionsProps}
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
