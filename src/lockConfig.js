/** Contraseña del panel de bloqueo global; puedes sobreescribirla con VITE_PREDICTIONS_LOCK_PASSWORD */
export const PREDICTIONS_LOCK_PASSWORD =
  typeof import.meta.env?.VITE_PREDICTIONS_LOCK_PASSWORD === 'string' &&
  import.meta.env.VITE_PREDICTIONS_LOCK_PASSWORD.length > 0
    ? import.meta.env.VITE_PREDICTIONS_LOCK_PASSWORD
    : 'PM@2026'
