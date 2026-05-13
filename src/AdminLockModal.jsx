import { useEffect, useState } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { PREDICTIONS_LOCK_PASSWORD } from './lockConfig.js'

export default function AdminLockModal({ mode, onClose, onSuccess }) {
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (mode) {
      setPwd('')
      setErr('')
    }
  }, [mode])

  if (!mode) return null

  const isLock = mode === 'lock'
  const title = isLock ? 'Bloquear edición para todos' : 'Desbloquear edición para todos'

  const handleSubmit = async e => {
    e.preventDefault()
    setErr('')
    if (pwd !== PREDICTIONS_LOCK_PASSWORD) {
      setErr('Contraseña incorrecta.')
      return
    }
    setBusy(true)
    try {
      await onSuccess(isLock)
      onClose()
      setPwd('')
    } catch (caught) {
      console.error(caught)
      setErr(
        caught?.message ||
          'No se pudo actualizar. ¿Existe la columna predictions_locked en official_state? Ejecuta el script SQL del repositorio.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-lock-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-2xl border border-amber-400/35 bg-slate-900/95 backdrop-blur-md shadow-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          {isLock ? (
            <Lock className="text-amber-300 shrink-0" size={28} />
          ) : (
            <Unlock className="text-sky-300 shrink-0" size={28} />
          )}
          <h2 id="admin-lock-title" className="text-lg font-bold text-white m-0">
            {title}
          </h2>
        </div>
        <p className="text-sm text-sky-100/85 mb-4 m-0">
          {isLock
            ? 'Nadie podrá guardar ni cambiar marcadores ni predicciones especiales hasta que se desbloquee.'
            : 'Los participantes volverán a poder editar y guardar sus porras.'}
        </p>
        <label className="block text-sm text-sky-200/90 mb-1">Contraseña</label>
        <input
          type="password"
          autoComplete="off"
          value={pwd}
          onChange={e => setPwd(e.target.value)}
          className="w-full rounded-xl border border-white/20 bg-black/40 p-3 text-white mb-2"
          placeholder="Introduce la contraseña"
        />
        {err ? (
          <p className="text-sm text-red-300 mb-3 m-0" role="alert">
            {err}
          </p>
        ) : null}
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-white/20 py-3 font-semibold text-white hover:bg-white/10 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold py-3 hover:brightness-110 transition disabled:opacity-50"
          >
            {busy ? '…' : isLock ? 'Bloquear' : 'Desbloquear'}
          </button>
        </div>
      </form>
    </div>
  )
}
