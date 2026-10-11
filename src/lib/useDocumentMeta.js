import { useEffect } from 'react'

const SITE = 'THIGA'

/**
 * Titre d'onglet et description de la page courante, rétablis au départ.
 * Google exécute le JavaScript et les lit ; les aperçus WhatsApp ou Facebook,
 * qui ne l'exécutent pas, passent par `middleware.js` (Vercel).
 * `title` vide = titre par défaut du site, laissé tel quel.
 */
export function useDocumentMeta(title, description) {
  useEffect(() => {
    if (!title) return undefined
    const prevTitle = document.title
    const meta = document.querySelector('meta[name="description"]')
    const prevDescription = meta?.getAttribute('content')

    document.title = `${title} · ${SITE}`
    if (meta && description) meta.setAttribute('content', description.slice(0, 160))

    return () => {
      document.title = prevTitle
      if (meta && prevDescription != null) meta.setAttribute('content', prevDescription)
    }
  }, [title, description])
}
