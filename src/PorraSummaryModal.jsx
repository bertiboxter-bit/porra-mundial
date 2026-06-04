import { useEffect, useMemo } from 'react'
import { Copy, Download, FileText, Printer, X } from 'lucide-react'
import { buildPorraSummaryText, downloadPorraSummaryFile } from './porraExport.js'

/**
 * @param {{
 *   open: boolean
 *   onClose: () => void
 *   predictions: Record<string, unknown>
 *   knockoutScores: Record<string, unknown>
 *   specials: Record<string, unknown>
 *   displayName: string
 *   onCopied?: () => void
 * }} props
 */
export default function PorraSummaryModal({
  open,
  onClose,
  predictions,
  knockoutScores,
  specials,
  displayName,
  onCopied,
}) {
  const summaryText = useMemo(
    () => buildPorraSummaryText(predictions, knockoutScores, specials, displayName),
    [predictions, knockoutScores, specials, displayName],
  )

  useEffect(() => {
    if (!open) return
    const onKey = e => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText)
      onCopied?.()
    } catch {
      /* ignore */
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer')
    if (!printWindow) return
    printWindow.document.write(
      `<pre style="font-family:Consolas,monospace;font-size:12px;white-space:pre-wrap;padding:24px">${summaryText.replace(/</g, '&lt;')}</pre>`,
    )
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div
      className="fixed inset-0 z-[105] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="porra-summary-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-amber-400/30 bg-slate-900/98 shadow-2xl">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/10 shrink-0">
          <div className="flex items-start gap-2 min-w-0">
            <FileText className="text-amber-300 shrink-0 mt-0.5" size={22} aria-hidden />
            <div>
              <h2 id="porra-summary-title" className="text-lg font-bold text-white m-0">
                Resumen de mi pronóstico
              </h2>
              <p className="text-xs text-sky-200/75 mt-1 mb-0">
                Copia, imprime o descarga antes del cierre de la porra.
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

        <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-white/10 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
          >
            <Copy size={16} aria-hidden />
            Copiar
          </button>
          <button
            type="button"
            onClick={() => downloadPorraSummaryFile(summaryText, displayName)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-400/30 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-500/30"
          >
            <Download size={16} aria-hidden />
            Descargar .txt
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
          >
            <Printer size={16} aria-hidden />
            Imprimir
          </button>
        </div>

        <pre className="overflow-y-auto p-5 m-0 text-xs text-sky-100/90 leading-relaxed font-mono whitespace-pre-wrap min-h-0 flex-1">
          {summaryText}
        </pre>
      </div>
    </div>
  )
}
