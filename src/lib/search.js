/** Taille d'une page de résultats dans les listes publiques. */
export const PAGE_SIZE = 12

/**
 * Motif `ilike` pour la colonne `search_text`, normalisé comme côté base
 * (`search_normalize` : minuscules, sans accents latins) ; null si vide.
 * `%` et `_` saisis sont retirés : ce seraient des jokers SQL.
 */
export function searchPattern(q) {
  const term = String(q || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[%_\\]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
  return term ? `%${term.split(' ').join('%')}%` : null
}

/** Bornes `range()` de la page `page` (0 = première). */
export function pageRange(page, size = PAGE_SIZE) {
  return [page * size, page * size + size - 1]
}
