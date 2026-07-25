import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { useTrades } from '../trades/TradesProvider'
import { CITIES } from '../data/mock'
import { fetchWorkers } from '../lib/workers'
import PageHeader from '../components/layout/PageHeader'
import WorkerCard from '../components/WorkerCard'
import EmptyState from '../components/EmptyState'
import Reveal from '../components/ui/Reveal'
import { Checkbox, Select } from '../components/ui/Field'

export default function Workers() {
  const { t, n } = useI18n()
  const { visibleTrades, tradeLabel } = useTrades()
  const [params, setParams] = useSearchParams()
  const [openFilters, setOpenFilters] = useState(false)
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchWorkers()
      .then((rows) => { if (!cancelled) setWorkers(rows) })
      .catch(() => { if (!cancelled) setWorkers([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const trade = params.get('metier') || ''
  const city = params.get('ville') || ''
  const minExp = params.get('exp') || ''
  const verifiedOnly = params.get('verifie') === '1'
  const sort = params.get('tri') || 'recent'

  const set = (key, val) => {
    const next = new URLSearchParams(params)
    if (val) next.set(key, val)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const reset = () => setParams(new URLSearchParams(), { replace: true })

  const list = useMemo(() => {
    let out = workers.filter(
      (w) =>
        (!trade || w.trade === trade) &&
        (!city || w.city === city) &&
        (!minExp || w.years >= Number(minExp)) &&
        (!verifiedOnly || w.verified)
    )
    out = [...out].sort((a, b) =>
      sort === 'exp' ? b.years - a.years : b.lastActive.localeCompare(a.lastActive)
    )
    return out
  }, [workers, trade, city, minExp, verifiedOnly, sort])

  const activeCount = [trade, city, minExp, verifiedOnly ? '1' : ''].filter(Boolean).length

  const filters = (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Select label={t('common.trade')} value={trade} onChange={(e) => set('metier', e.target.value)}>
        <option value="">{t('common.allTrades')}</option>
        {visibleTrades.map((tr) => (
          <option key={tr.id} value={tr.id}>{tradeLabel(tr.id)}</option>
        ))}
      </Select>

      <Select label={t('common.city')} value={city} onChange={(e) => set('ville', e.target.value)}>
        <option value="">{t('common.allCities')}</option>
        {CITIES.map((c) => (
          <option key={c} value={c}>{t(`cities.${c}`)}</option>
        ))}
      </Select>

      <Select label={t('workers.minExp')} value={minExp} onChange={(e) => set('exp', e.target.value)}>
        <option value="">{t('workers.anyExp')}</option>
        {[2, 5, 10].map((y) => (
          <option key={y} value={y}>{y}+ {t('common.years')}</option>
        ))}
      </Select>

      <Select label={t('common.sort')} value={sort} onChange={(e) => set('tri', e.target.value)}>
        <option value="recent">{t('workers.sortRecent')}</option>
        <option value="exp">{t('workers.sortExp')}</option>
      </Select>
    </div>
  )

  return (
    <>
      <PageHeader kicker={t('nav.workers')} title={t('workers.title')} lede={t('workers.lede')} />

      {/* Barre de filtres */}
      <section className="sticky top-20 z-30 border-b border-sand-200/70 bg-sand-50/80 backdrop-blur-xl">
        <div className="shell py-4">
          <div className="flex items-center justify-between gap-4 lg:hidden">
            <button
              onClick={() => setOpenFilters((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-sand-300 bg-white px-3.5 py-2.5 text-[13px] font-medium shadow-sm"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t('common.filters')}
              {activeCount > 0 && (
                <span className="grid h-5 w-5 place-items-center rounded-full bg-vert-700 text-[11px] text-sand-50">
                  {activeCount}
                </span>
              )}
            </button>
            <p className="text-[13px] text-ink-400">
              <span className="font-medium text-ink">{n(list.length)}</span> {t('common.results')}
            </p>
          </div>

          <div className={`${openFilters ? 'mt-4 block' : 'hidden'} lg:mt-0 lg:block`}>{filters}</div>

          <div className="mt-4 hidden items-center justify-between lg:flex">
            <p className="text-[13px] text-ink-400">
              <span className="font-medium text-ink">{n(list.length)}</span> {t('common.results')}
            </p>
            <div className="flex items-center gap-5">
              <Checkbox
                label={t('workers.onlyVerified')}
                checked={verifiedOnly}
                onChange={(e) => set('verifie', e.target.checked ? '1' : '')}
              />
              {activeCount > 0 && (
                <button
                  onClick={reset}
                  className="border-b border-ink-400 pb-0.5 text-[12.5px] text-ink-600 transition-colors hover:border-vert-700 hover:text-vert-700"
                >
                  {t('common.reset')}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Résultats */}
      <section className="shell py-12 md:py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="col-span-full text-center text-[13.5px] text-ink-400">{t('common.loading')}</p>
          ) : list.length === 0 ? (
            <EmptyState onReset={reset} />
          ) : (
            list.map((w, i) => (
              <Reveal key={w.id} delay={Math.min(i, 6) * 60}>
                <WorkerCard w={w} />
              </Reveal>
            ))
          )}
        </div>
      </section>
    </>
  )
}
