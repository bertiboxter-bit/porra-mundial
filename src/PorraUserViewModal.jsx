import { useEffect, useMemo } from 'react'
import { Eye, X } from 'lucide-react'
import { buildPorraSummaryText } from './porraExport.js'
import { getPorraDataFromUser } from './porraUserView.js'

/**
 * @param {{
 *   user: Record<string, unknown> | null
 *   onClose: () => void
 * }} props
 */
export default function PorraUserViewModal({ user, onClose }) {
  const porraData = useMemo(() => (user ? getPorraDataFromUser(user) : null), [user])

  const summaryText = useMemo(() => {
    if (!porraData) return ''
    return buildPorraSummaryText(
      porraData.predictions,
      porraData.knockoutScores,
      porraData.specials,
      porraData.displayName,
    )
  }, [porraData])

  useEffect(() => {
    if (!user) return
    const onKey = e => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [user, onClose])

  if (!user || !porraData) return null

  return (
    <div
      className="fixed inset-0 z-[106] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="porra-user-view-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-cyan-400/35 bg-slate-900/98 shadow-2xl">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/10 shrink-0">
          <div className="flex items-start gap-2 min-w-0">
            <Eye className="text-cyan-300 shrink-0 mt-0.5" size={22} aria-hidden />
            <div className="min-w-0">
              <h2 id="porra-user-view-title" className="text-lg font-bold text-white m-0 leading-tight">
                Porra de {porraData.displayName}
              </h2>
              <p className="text-xs text-sky-200/75 mt-1 mb-0 leading-snug">
                Modo lectura · {porraData.points} pts en la clasificación · No es tu porra editable
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-sky-200 hover:bg-white/10 transition shrink-0"
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>
        </div>

        <pre className="overflow-y-auto p-5 m-0 text-xs text-sky-100/90 leading-relaxed font-mono whitespace-pre-wrap min-h-0 flex-1">
          {summaryText}
        </pre>

        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500/80 to-cyan-600/80 text-white font-bold py-2.5 hover:brightness-110 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
