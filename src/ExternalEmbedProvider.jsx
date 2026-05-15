import { useCallback, useEffect, useMemo, useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { ExternalEmbedContext } from './externalEmbedContext.js'

/**
 * Proveedor + panel modal para abrir FIFA u otros enlaces externos dentro de la app (iframe).
 * @param {{ children: import('react').ReactNode }} props
 */
export function ExternalEmbedProvider({ children }) {
  /** @type {[{ url: string, title: string }] | null} */
  const [panel, setPanel] = useState(null)

  const openExternalPanel = useCallback(args => {
    if (!args?.url) return
    setPanel({
      url: args.url,
      title: args.title?.trim() || 'Contenido externo',
    })
  }, [])

  const closeExternalPanel = useCallback(() => setPanel(null), [])

  const value = useMemo(
    () => ({ openExternalPanel, closeExternalPanel }),
    [openExternalPanel, closeExternalPanel],
  )

  return (
    <ExternalEmbedContext.Provider value={value}>
      {children}
      {panel ? (
        <ExternalEmbedModal
          url={panel.url}
          title={panel.title}
          onClose={closeExternalPanel}
        />
      ) : null}
    </ExternalEmbedContext.Provider>
  )
}

/**
 * @param {{ url: string, title: string, onClose: () => void }} props
 */
function ExternalEmbedModal({ url, title, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const handleKey = e => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ext-embed-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition hover:bg-black/80"
        onClick={onClose}
        aria-label="Cerrar panel"
      />
      <div
        className="relative z-10 flex h-[90vh] max-h-[900px] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0a1628] shadow-2xl shadow-black/60"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5 sm:px-4 sm:py-3">
          <h2
            id="ext-embed-modal-title"
            className="min-w-0 flex-1 truncate text-sm font-bold text-sky-100 sm:text-base"
          >
            {title}
          </h2>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/35 bg-sky-500/15 px-2.5 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-500/25 hover:text-white sm:text-sm"
            >
              <ExternalLink size={16} className="shrink-0 opacity-90" aria-hidden />
              Nueva pestaña
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-sky-200 hover:bg-white/10 hover:text-white"
              aria-label="Cerrar"
            >
              <X size={22} aria-hidden />
            </button>
          </div>
        </header>

        <p className="shrink-0 border-b border-amber-400/25 bg-amber-500/[0.08] px-3 py-2 text-[11px] leading-snug text-amber-100/95 sm:text-xs sm:px-4">
          Varios sitios (<span className="font-semibold">entre ellos FIFA.com</span>) no permiten
          cargarse dentro de otra página. Si el área de abajo aparece vacía o con error, usa «Nueva
          pestaña».
        </p>

        <iframe
          key={url}
          src={url}
          title={title}
          className="min-h-0 w-full flex-1 border-0 bg-slate-950"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  )
}
