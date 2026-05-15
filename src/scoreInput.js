/** Solo dígitos, máximo 2 caracteres (0–99). */
export function sanitizeScoreInput(raw) {
  if (raw == null || raw === '') return ''
  const digits = String(raw).replace(/\D/g, '')
  if (!digits) return ''
  return digits.slice(0, 2)
}
