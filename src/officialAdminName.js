export const OFFICIAL_ADMIN_NAME_STORAGE_KEY = 'porra_official_admin_name'

export function readOfficialAdminName() {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(OFFICIAL_ADMIN_NAME_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function writeOfficialAdminName(name) {
  if (typeof window === 'undefined') return
  try {
    const trimmed = String(name ?? '').trim()
    if (trimmed) localStorage.setItem(OFFICIAL_ADMIN_NAME_STORAGE_KEY, trimmed)
    else localStorage.removeItem(OFFICIAL_ADMIN_NAME_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function normalizeOfficialSavedByName(name) {
  const trimmed = String(name ?? '').trim()
  return trimmed || 'Administrador'
}
