import { useContext } from 'react'
import { ExternalEmbedContext } from './externalEmbedContext.js'

/**
 * Abre contenido externo en el panel embebido (modal con iframe).
 * @returns {{ openExternalPanel: (a: { url: string, title?: string }) => void, closeExternalPanel: () => void }}
 */
export function useExternalEmbed() {
  const ctx = useContext(ExternalEmbedContext)
  if (!ctx) {
    throw new Error('useExternalEmbed debe usarse dentro de ExternalEmbedProvider')
  }
  return ctx
}
