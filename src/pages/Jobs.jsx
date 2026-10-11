import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { useTrades } from '../trades/TradesProvider'
import { CITIES, CONTRACTS } from '../data/mock'
import { searchJobs } from '../lib/jobs'
import { usePagedSearch } from '../lib/usePagedSearch'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import SearchField from '../components/SearchField'
import Button from '../components/ui/Button'
import PageHeader from '../components/layout/PageHeader'
import JobCard from '../components/JobCard'
import EmptyState from '../components/EmptyState'
import Reveal from '../components/ui/Reveal'
import { Select } from '../components/ui/Field'

export default function Jobs() {
  const { t, n } = useI18n()
  const { visibleTrades, tradeLabel } = useTrades()
  const [params, setParams] = useSearchParams()
  const [openFilters, setOpenFilters] = useState(false)

  const trade = params.get('metier') || ''
  const city = params.get('ville') || ''
  const contract = params.get('contrat') || ''
  const sort = params.get('tri') || 'recent'

  const set = (key, val) => {
    const next = new URLSearchParams(params)
    if (val) next.set(key, val)
    else next.delete(key)
    setParams(next, { replace: true })
  }
  const reset = () => setParams(new URLSearchParams(), { replace: true })

  const q = params.get('q') || ''
  const { items: list, count, loading, loadingMore, hasMore, loadMore } = usePagedSearch(searchJobs, { q, trade, city, contract, sort })

  useDocumentMeta(t('jobs.title'), t('jobs.lede'))

  const activeCount = [q, trade, city, contract].filter(Boolean).length

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

      <Select label={t('jobs.type')} value={contract} onChange={(e) => set('contrat', e.target.value)}>
        <option value="">{t('jobs.allTypes')}</option>
        {CONTRACTS.map((c) => (
          <option key={c} value={c}>{t(`contracts.${c}`)}</option>
        ))}
      </Select>

      <Select label={t('common.sort')} value={sort} onChange={(e) => set('tri', e.target.value)}>
        <option value="recent">{t('jobs.sortRecent')}</option>
        <option value="salaire">{t('jobs.sortSalary')}</option>
      </Select>
    </div>
  )

  return (
    <>
      <PageHeader kicker={t('nav.jobs')} title={t('jobs.title')} lede={t('jobs.lede')} />

      <section className="sticky top-20 z-30 border-b border-sand-200/70 bg-sand-50/80 backdrop-blur-xl">
        <div className="shell py-4">
          <div className="mb-4">
            <SearchField
              id="jobs-search"
              value={q}
              onChange={(v) => set('q', v)}
              label={t('common.search')}
              clearLabel={t('common.clear')}
              placeholder={t('jobs.searchPlaceholder')}
            />
          </div>
          <div className="flex items-center justify-between gap-4 lg:hidden">
            <button
              onClick={() => setOpenFilters((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-sand-300 bg-white px-3.5 py-2.5 text-[14px] font-medium shadow-sm"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t('common.filters')}
              {activeCount > 0 && (
                <span className="grid h-5 w-5 place-items-center rounded-full bg-vert-700 text-[12px] text-sand-50">
                  {activeCount}
                </span>
              )}
            </button>
            <p className="text-[14px] text-ink-400">
              <span className="font-medium text-ink">{n(count)}</span> {t('common.results')}
            </p>
          </div>

          <div className={`${openFilters ? 'mt-4 block' : 'hidden'} lg:mt-0 lg:block`}>{filters}</div>

          <div className="mt-4 hidden items-center justify-between lg:flex">
            <p className="text-[14px] text-ink-400">
              <span className="font-medium text-ink">{n(count)}</span> {t('common.results')}
            </p>
            {activeCount > 0 && (
              <button
                onClick={reset}
                className="border-b border-ink-400 pb-0.5 text-[13.5px] text-ink-600 transition-colors hover:border-vert-700 hover:text-vert-700"
              >
                {t('common.reset')}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="shell py-12 md:py-16">
        <div className="grid gap-5 lg:grid-cols-2">
          {loading ? (
            <p className="col-span-full text-center text-[14.5px] text-ink-400">{t('common.loading')}</p>
          ) : list.length === 0 ? (
            <EmptyState onReset={reset} />
          ) : (
            list.map((j, i) => (
              <Reveal key={j.id} delay={Math.min(i, 6) * 60}>
                <JobCard j={j} />
              </Reveal>
            ))
          )}
        </div>

        {!loading && hasMore && (
          <div className="mt-10 flex flex-col items-center gap-2">
            <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? t('common.loading') : t('common.loadMore')}
            </Button>
            <p className="text-[13px] text-ink-400">
              {t('common.shown')} {n(list.length)} / {n(count)}
            </p>
          </div>
        )}
      </section>
    </>
  )
}
