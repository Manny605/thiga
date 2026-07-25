import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { useTrades } from '../trades/TradesProvider'
import { CITIES } from '../data/mock'
import { Select } from './ui/Field'
import Button from './ui/Button'

/** Barre de recherche métier + ville. `target` = route de destination. */
export default function SearchBar({ target = '/travailleurs', compact = false }) {
  const { t } = useI18n()
  const { visibleTrades, tradeLabel } = useTrades()
  const nav = useNavigate()
  const [trade, setTrade] = useState('')
  const [city, setCity] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (trade) p.set('metier', trade)
    if (city) p.set('ville', city)
    nav(`${target}${p.toString() ? `?${p}` : ''}`)
  }

  return (
    <form
      onSubmit={submit}
      className={`grid gap-3 sm:grid-cols-[1fr_1fr_auto] ${compact ? '' : 'sm:gap-4'}`}
    >
      <Select value={trade} onChange={(e) => setTrade(e.target.value)} aria-label={t('common.trade')}>
        <option value="">{t('common.allTrades')}</option>
        {visibleTrades.map((tr) => (
          <option key={tr.id} value={tr.id}>{tradeLabel(tr.id)}</option>
        ))}
      </Select>

      <Select value={city} onChange={(e) => setCity(e.target.value)} aria-label={t('common.city')}>
        <option value="">{t('common.allCities')}</option>
        {CITIES.map((c) => (
          <option key={c} value={c}>{t(`cities.${c}`)}</option>
        ))}
      </Select>

      <Button type="submit" className="sm:w-auto">
        <Search className="h-4 w-4" />
        {t('common.search')}
      </Button>
    </form>
  )
}
