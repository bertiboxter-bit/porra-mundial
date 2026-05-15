import { Eye, X } from 'lucide-react'
import { rankingDisplayName } from './userIdentity.js'

export default function PorraPreviewBanner({ user, onClose }) {
  if (!user) return null
  return (
    <div
      className="rounded-2xl border border-cyan-400/35 bg-cyan-950/45 px-4 py-3 text-sm text-cyan-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      role="status"
    >
      <div className="flex items-start gap-2 min-w-0">
        <Eye className="shrink-0 text-cyan-300 mt-0.5" size={18} aria-hidden />
        <span className="leading-snug">
          Viendo la porra de <strong className="text-white font-semibold">{rankingDisplayName(user)}</strong>{' '}
          en modo lectura. Los marcadores y premios no se pueden editar.
        </span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15 transition"
      >
        <X size={14} aria-hidden />
        Volver a mi vista
      </button>
    </div>
  )
}
