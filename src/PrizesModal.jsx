import { useEffect } from 'react'
import { Gift, Medal, X } from 'lucide-react'

const PRIZE_ROWS = [
  { place: '1.º puesto', amount: '200 €', accent: 'from-amber-300 to-amber-500' },
  { place: '2.º puesto', amount: '110 €', accent: 'from-slate-200 to-slate-400' },
  { place: '3.er puesto', amount: '50 €', accent: 'from-amber-600/90 to-amber-800/90' },
]

/**
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function PrizesModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKey = e => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[105] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prizes-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="relative w-full max-w-md flex flex-col rounded-2xl border border-amber-400/35 bg-slate-900/98 shadow-2xl">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/10 shrink-0">
          <div className="flex items-start gap-2 min-w-0">
            <Gift className="text-amber-300 shrink-0 mt-0.5" size={22} aria-hidden />
            <div>
              <h2 id="prizes-modal-title" className="text-lg font-bold text-white m-0">
                Premios
              </h2>
              <p className="text-xs text-sky-200/75 mt-1 mb-0 leading-snug">
                Clasificación final de la porra al terminar el Mundial.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-sky-200 hover:bg-white/10 shrink-0"
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>
        </div>

        <ul className="p-5 space-y-3 m-0 list-none">
          {PRIZE_ROWS.map((row, index) => (
            <li
              key={row.place}
              className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${row.accent} text-slate-900 font-black text-sm`}
                  aria-hidden
                >
                  {index + 1}
                </span>
                <span className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Medal size={16} className="text-amber-300/90 shrink-0" aria-hidden />
                  {row.place}
                </span>
              </div>
              <span className="text-xl font-black tabular-nums text-amber-200 shrink-0">{row.amount}</span>
            </li>
          ))}
        </ul>

        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold py-2.5 hover:brightness-110 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
