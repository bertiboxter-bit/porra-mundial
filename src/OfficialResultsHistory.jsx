import { History } from 'lucide-react'

export default function OfficialResultsHistory({ historyRows, historyError, savedByName, onSavedByNameChange }) {
  return (
    <section className="rounded-2xl border border-amber-400/15 bg-black/25 p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <History className="text-amber-300 shrink-0" size={20} aria-hidden />
        <h2 className="text-lg font-bold text-white m-0">Historial de guardados oficiales</h2>
      </div>

      <label className="block text-sm text-sky-200/90 max-w-md">
        <span className="font-semibold text-sky-100">Registrado por</span>
        <input
          type="text"
          value={savedByName}
          onChange={event => onSavedByNameChange(event.target.value)}
          placeholder="Nombre del administrador"
          className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white placeholder:text-slate-500"
        />
        <span className="block text-xs text-sky-200/60 mt-1">
          Se guarda en este navegador y aparece en cada entrada del historial al pulsar «Guardar y recalcular».
        </span>
      </label>

      {historyError ? (
        <p className="text-sm text-amber-200/90 m-0">
          No se pudo cargar el historial. Ejecuta el script{' '}
          <code className="text-amber-100">supabase/official-results-ranking.sql</code> en Supabase.
        </p>
      ) : historyRows.length === 0 ? (
        <p className="text-sm text-slate-400 m-0">Aún no hay guardados registrados.</p>
      ) : (
        <ol className="space-y-2 m-0 p-0 list-none max-h-48 overflow-y-auto pr-1">
          {historyRows.map(entry => (
            <li
              key={entry.id}
              className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-sky-100/90"
            >
              <time dateTime={entry.saved_at} className="text-sky-200/80 tabular-nums">
                {new Date(entry.saved_at).toLocaleString('es-ES')}
              </time>
              <span className="text-white/40 mx-2">·</span>
              <span className="font-semibold text-amber-100/95">{entry.saved_by}</span>
              <span className="text-sky-200/70">
                {' '}
                — {entry.participants_count}{' '}
                {entry.participants_count === 1 ? 'participante' : 'participantes'}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
