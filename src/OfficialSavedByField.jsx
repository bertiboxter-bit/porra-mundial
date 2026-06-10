/**
 * @param {{
 *   savedByName: string
 *   savedByNameError: string | null
 *   onSavedByNameChange: (value: string) => void
 * }} props
 */
export default function OfficialSavedByField({
  savedByName,
  savedByNameError,
  onSavedByNameChange,
}) {
  return (
    <label className="block text-sm text-sky-200/90 max-w-md">
      <span className="font-semibold text-sky-100">
        Registrado por <span className="text-amber-300">*</span>
      </span>
      <input
        type="text"
        value={savedByName}
        onChange={event => onSavedByNameChange(event.target.value)}
        placeholder="Tu nombre (obligatorio para guardar)"
        required
        aria-invalid={Boolean(savedByNameError)}
        className={`mt-1 w-full rounded-xl border bg-black/30 px-3 py-2 text-white placeholder:text-slate-500 ${
          savedByNameError ? 'border-red-400/50 ring-1 ring-red-400/30' : 'border-white/15'
        }`}
      />
      <span className="block text-xs text-sky-200/60 mt-1">
        Obligatorio antes de guardar. Se recuerda en este navegador y queda en el historial de cada
        recálculo.
      </span>
      {savedByNameError ? (
        <span className="block text-xs text-red-300/95 mt-1">{savedByNameError}</span>
      ) : null}
    </label>
  )
}
