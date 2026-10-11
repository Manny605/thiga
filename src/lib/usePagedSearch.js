import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Liste paginée « Voir plus » au-dessus d'une fonction `search({ ...filters, page })`
 * qui renvoie `{ rows, count }`. Un changement de filtres repart de la page 0 ;
 * une réponse arrivée après un changement plus récent est ignorée.
 */
export function usePagedSearch(search, filters) {
  const key = JSON.stringify(filters)
  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const latest = useRef(0)

  useEffect(() => {
    const ticket = ++latest.current
    setLoading(true)
    search({ ...JSON.parse(key), page: 0 })
      .then(({ rows, count: total }) => {
        if (ticket !== latest.current) return
        setItems(rows)
        setCount(total)
        setPage(0)
      })
      .catch(() => {
        if (ticket !== latest.current) return
        setItems([])
        setCount(0)
      })
      .finally(() => { if (ticket === latest.current) setLoading(false) })
  }, [search, key])

  const loadMore = useCallback(async () => {
    const ticket = latest.current
    const next = page + 1
    setLoadingMore(true)
    try {
      const { rows } = await search({ ...JSON.parse(key), page: next })
      if (ticket !== latest.current) return
      setItems((prev) => [...prev, ...rows])
      setPage(next)
    } finally {
      if (ticket === latest.current) setLoadingMore(false)
    }
  }, [search, key, page])

  return { items, count, loading, loadingMore, hasMore: items.length < count, loadMore }
}
