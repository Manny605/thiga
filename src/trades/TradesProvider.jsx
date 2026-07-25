import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { fetchTrades } from '../lib/trades'

const TradesContext = createContext(null)

/**
 * Catalogue des métiers, chargé une fois pour toute l'application.
 *
 * Il vivait auparavant dans `data/mock.js` (liste figée) doublé d'un appel à
 * `trade_settings` répété sur chaque page de recherche. Les libellés étant
 * désormais en base, ce contexte est la seule source : les écrans lisent
 * `visibleTrades` pour leurs listes déroulantes et `tradeLabel(id)` pour
 * afficher le métier d'une annonce ou d'un profil.
 */
export function TradesProvider({ children }) {
  const { lang, t } = useI18n()
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setTrades(await fetchTrades())
    } catch {
      // Catalogue indisponible : `tradeLabel` retombe sur le dictionnaire, donc
      // les métiers d'origine restent lisibles et les listes se vident au lieu
      // d'afficher des identifiants bruts.
      setTrades([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const value = useMemo(() => {
    const byId = new Map(trades.map((x) => [x.id, x]))

    /** Libellé dans la langue active ; repli sur le dictionnaire, puis sur l'identifiant. */
    const tradeLabel = (id) => {
      if (!id) return ''
      const trade = byId.get(id)
      if (trade) return (lang === 'ar' ? trade.labelAr : trade.labelFr) || trade.labelFr || id
      const key = `trades.${id}`
      const translated = t(key)
      return translated === key ? id : translated
    }

    return {
      trades,
      visibleTrades: trades.filter((x) => x.enabled),
      tradeIcon: (id) => byId.get(id)?.icon || 'Boxes',
      tradeLabel,
      loading,
      reload: load,
    }
  }, [trades, lang, t, loading, load])

  return <TradesContext.Provider value={value}>{children}</TradesContext.Provider>
}

export function useTrades() {
  const ctx = useContext(TradesContext)
  if (!ctx) throw new Error('useTrades doit être utilisé dans <TradesProvider>')
  return ctx
}
