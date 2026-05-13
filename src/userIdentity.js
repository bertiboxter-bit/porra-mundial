/** Último usuario (privado) recordado en este navegador */
export const USERNAME_STORAGE_KEY = 'porra_mundial_username'

export function normalizeUsername(raw) {
  if (!raw || typeof raw !== 'string') return ''
  let s = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (s.length > 40) s = s.slice(0, 40)
  return s
}

export function validateUsername(u) {
  if (u.length < 3) return 'El usuario debe tener al menos 3 caracteres.'
  if (u.length > 40) return 'El usuario no puede superar 40 caracteres.'
  if (!/^[a-z0-9_-]+$/.test(u)) {
    return 'Solo minúsculas, números, guion (-) y guion bajo (_).'
  }
  return ''
}

export function validateDisplayName(d) {
  const t = d.trim()
  if (!t) return 'Indica un nombre para la clasificación pública.'
  if (t.length > 80) return 'El nombre público no puede superar 80 caracteres.'
  return ''
}

/** Nombre mostrado en la clasificación */
export function rankingDisplayName(row) {
  if (!row || typeof row !== 'object') return '—'
  const pub =
    row.display_name ||
    row.displayName ||
    row.nickname
  if (pub && String(pub).trim()) return String(pub).trim()
  return '—'
}

export function readStoredUsername() {
  try {
    return localStorage.getItem(USERNAME_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}
