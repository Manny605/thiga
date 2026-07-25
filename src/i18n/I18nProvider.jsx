import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import fr from './fr'
import ar from './ar'

const dicts = { fr, ar }
const I18nContext = createContext(null)

/** Résout une clé pointée ("home.stats.workers") dans le dictionnaire. */
function resolve(dict, path) {
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), dict)
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('fr')
  const dict = dicts[lang]
  const dir = dict.dir

  useEffect(() => {
    const el = document.documentElement
    el.lang = lang
    el.dir = dir
  }, [lang, dir])

  const value = useMemo(() => {
    /** t('nav.home') -> string ; renvoie la clé si absente pour repérer les trous. */
    const t = (path) => {
      const v = resolve(dict, path)
      return v === undefined ? path : v
    }
    return {
      lang,
      dir,
      isRTL: dir === 'rtl',
      t,
      setLang,
      toggle: () => setLang((l) => (l === 'fr' ? 'ar' : 'fr')),
      other: lang === 'fr' ? dicts.ar.label : dicts.fr.label,
      /** Formate un nombre selon la locale active. */
      n: (x) =>
        new Intl.NumberFormat(lang === 'ar' ? 'ar-MR' : 'fr-MR').format(x),
      /** Formate une date ISO courte. */
      d: (iso) =>
        new Intl.DateTimeFormat(lang === 'ar' ? 'ar-MR' : 'fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(new Date(iso)),
    }
  }, [lang, dict, dir])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n doit être utilisé dans <I18nProvider>')
  return ctx
}
