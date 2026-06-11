/**
 * @param {{ scoreLine: string, compact?: boolean }} props
 */
export default function OfficialMatchBadge({ scoreLine, compact = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold uppercase tracking-wide text-emerald-200 bg-emerald-500/20 border border-emerald-400/35 rounded ${
        compact ? 'text-[9px] px-1 py-0.5' : 'text-[10px] px-1.5 py-0.5'
      }`}
      title="Resultado oficial ya publicado y contabilizado en la clasificación"
    >
      <span className="text-emerald-300/90" aria-hidden>
        ✓
      </span>
      Oficial {scoreLine}
    </span>
  )
}
