import { useEffect, useState } from 'react'
import { Lock, Trophy } from 'lucide-react'
import {
  PORRA_CLOSING_AT_MS,
  WORLD_CUP_START_AT_MS,
  millisecondsRemainingUntil,
  padCountdownUnit,
  splitCountdownParts,
} from './porraDeadlines.js'

/**
 * @param {{
 *   title: string
 *   subtitle: string
 *   targetMs: number
 *   variant: 'closing' | 'kickoff'
 *   icon: import('react').ReactNode
 * }} props
 */
function CountdownCard({ title, subtitle, targetMs, variant, icon }) {
  const [remainingMs, setRemainingMs] = useState(() =>
    millisecondsRemainingUntil(targetMs),
  )

  useEffect(() => {
    const tick = () => {
      const left = millisecondsRemainingUntil(targetMs)
      setRemainingMs(left)
    }
    tick()
    const intervalId = window.setInterval(tick, 1000)
    return () => window.clearInterval(intervalId)
  }, [targetMs])

  if (remainingMs <= 0) return null

  const { hours, minutes, seconds } = splitCountdownParts(remainingMs)
  const accent =
    variant === 'closing'
      ? 'border-red-400/35 bg-red-950/30'
      : 'border-emerald-400/35 bg-emerald-950/25'

  return (
    <div
      className={`rounded-2xl border p-4 backdrop-blur-sm ${accent}`}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start gap-2 mb-3">
        <span className="shrink-0 mt-0.5 opacity-90" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white m-0 leading-snug">{title}</p>
          <p className="text-[11px] text-sky-200/75 mt-0.5 m-0 leading-snug">{subtitle}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          [hours, 'horas'],
          [minutes, 'min'],
          [seconds, 'seg'],
        ].map(([value, unit]) => (
          <div
            key={unit}
            className="rounded-xl bg-black/35 border border-white/10 px-2 py-2.5"
          >
            <div className="font-mono text-2xl sm:text-3xl font-black tabular-nums text-amber-200">
              {padCountdownUnit(value)}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-sky-200/65 mt-0.5">
              {unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PorraCountdownStrip() {
  const showClosing = millisecondsRemainingUntil(PORRA_CLOSING_AT_MS) > 0
  const showKickoff = millisecondsRemainingUntil(WORLD_CUP_START_AT_MS) > 0

  if (!showClosing && !showKickoff) return null

  return (
    <div
      className={`grid gap-4 ${showClosing && showKickoff ? 'md:grid-cols-2' : 'max-w-xl'}`}
      aria-label="Cuenta atrás del torneo"
    >
      {showClosing ? (
        <CountdownCard
          title="Cierre de la porra"
          subtitle="Lunes 8 de junio de 2026 · 23:59 (España)"
          targetMs={PORRA_CLOSING_AT_MS}
          variant="closing"
          icon={<Lock size={20} className="text-red-300" />}
        />
      ) : null}
      {showKickoff ? (
        <CountdownCard
          title="Inicio del Mundial"
          subtitle="Jueves 11 de junio de 2026 · 21:00 (España) · México – Sudáfrica"
          targetMs={WORLD_CUP_START_AT_MS}
          variant="kickoff"
          icon={<Trophy size={20} className="text-emerald-300" />}
        />
      ) : null}
    </div>
  )
}
