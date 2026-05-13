import { useEffect } from 'react'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

const variantStyles = {
  success: {
    border: 'border-emerald-400/35',
    iconWrap: 'bg-emerald-500/15 text-emerald-300',
    Icon: CheckCircle,
  },
  error: {
    border: 'border-red-400/40',
    iconWrap: 'bg-red-500/15 text-red-300',
    Icon: AlertCircle,
  },
  info: {
    border: 'border-sky-400/35',
    iconWrap: 'bg-sky-500/15 text-sky-200',
    Icon: Info,
  },
}

export default function MessageModal({ modal, onClose }) {
  useEffect(() => {
    if (!modal) return
    const onKey = e => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal, onClose])

  if (!modal) return null

  const variant = variantStyles[modal.variant] ?? variantStyles.info
  const { Icon } = variant

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="message-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar diálogo"
      />
      <div
        className={`relative w-full max-w-md rounded-2xl border ${variant.border} bg-slate-900/95 backdrop-blur-md shadow-2xl shadow-black/40 p-6`}
      >
        <div className="flex gap-4">
          <div
            className={`shrink-0 flex h-12 w-12 items-center justify-center rounded-xl ${variant.iconWrap}`}
          >
            <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            {modal.title ? (
              <h2 id="message-modal-title" className="text-lg font-bold text-white mb-2">
                {modal.title}
              </h2>
            ) : (
              <span id="message-modal-title" className="sr-only">
                Mensaje
              </span>
            )}
            <p className="text-sm text-sky-100/90 leading-relaxed whitespace-pre-wrap m-0">
              {modal.message}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold py-3 px-4 hover:brightness-110 transition"
        >
          Aceptar
        </button>
      </div>
    </div>
  )
}
