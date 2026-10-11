import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, RotateCcw } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { useTrades } from '../trades/TradesProvider'
import { CITIES, CONTRACTS } from '../data/mock'
import { fetchOnlineJobs } from '../lib/jobs'
import { Select } from './ui/Field'
import Button from './ui/Button'
import JobCard from './JobCard'
import EmptyState from './EmptyState'
import SectionHeading from './ui/SectionHeading'
import Reveal from './ui/Reveal'

const LIMIT = 4

/**
 * Liste d'offres filtrable en direct sur l'accueil.
 * Métier en pastilles, ville et contrat en listes déroulantes.
 * Le lien « voir toutes les offres » conserve les filtres actifs.
 */
export default function HomeOffers() {
  const { t, n } = useI18n()
  const { visibleTrades, tradeLabel } = useTrades()
  const [trade, setTrade] = useState('')
  const [city, setCity] = useState('')
  const [contract, setContract] = useState('')
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    let cancelled = false
    fetchOnlineJobs()
      .then((rows) => { if (!cancelled) setJobs(rows) })
      .catch(() => { if (!cancelled) setJobs([]) })
    return () => { cancelled = true }
  }, [])

  const list = useMemo(
    () =>
      jobs.filter(
        (j) =>
          (!trade || j.trade === trade) &&
          (!city || j.city === city) &&
          (!contract || j.contract === contract)
      ).sort((a, b) => b.posted.localeCompare(a.posted)),
    [jobs, trade, city, contract]
  )

  const shown = list.slice(0, LIMIT)
  const activeCount = [trade, city, contract].filter(Boolean).length
  const reset = () => {
    setTrade('')
    setCity('')
    setContract('')
  }

  const params = new URLSearchParams()
  if (trade) params.set('metier', trade)
  if (city) params.set('ville', city)
  if (contract) params.set('contrat', contract)
  const allHref = `/offres${params.toString() ? `?${params}` : ''}`

  return (
    <section className="border-y border-sand-200/70 bg-sand-100/40">
      <div className="shell py-20 md:py-28">
        <SectionHeading
          num="02"
          kicker={t('nav.jobs')}
          title={t('home.featuredJobs')}
          action={
            <Button to={allHref} variant="outline" size="sm">
              {t('nav.jobs')}
              <ArrowRight className="flip-rtl h-4 w-4" />
            </Button>
          }
        />

        {/* Filtres — tout en listes déroulantes */}
        <div className="mt-10 rounded-2xl border border-sand-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label={t('common.trade')} value={trade} onChange={(e) => setTrade(e.target.value)}>
              <option value="">{t('common.allTrades')}</option>
              {visibleTrades.map((tr) => (
                <option key={tr.id} value={tr.id}>{tradeLabel(tr.id)}</option>
              ))}
            </Select>
            <Select label={t('common.city')} value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">{t('common.allCities')}</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>{t(`cities.${c}`)}</option>
              ))}
            </Select>
            <Select label={t('jobs.type')} value={contract} onChange={(e) => setContract(e.target.value)}>
              <option value="">{t('jobs.allTypes')}</option>
              {CONTRACTS.map((c) => (
                <option key={c} value={c}>{t(`contracts.${c}`)}</option>
              ))}
            </Select>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-sand-200 pt-4">
            <p className="text-[14px] text-ink-400">
              <span className="font-medium text-ink">{n(list.length)}</span> {t('common.results')}
            </p>
            {activeCount > 0 && (
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-600 transition-colors hover:text-vert-700"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t('common.reset')}
              </button>
            )}
          </div>
        </div>

        {/* Résultats */}
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {shown.length === 0 ? (
            <EmptyState onReset={reset} />
          ) : (
            shown.map((j, i) => (
              <Reveal key={j.id} delay={Math.min(i, 6) * 60}>
                <JobCard j={j} />
              </Reveal>
            ))
          )}
        </div>

        {list.length > LIMIT && (
          <div className="mt-10 flex justify-center">
            <Link
              to={allHref}
              className="inline-flex items-center gap-2 rounded-xl border border-sand-300 bg-white px-5 py-3 text-sm font-medium text-ink shadow-sm transition-all hover:border-vert-200 hover:text-vert-700"
            >
              {t('home.featuredJobs')} · {n(list.length)}
              <ArrowRight className="flip-rtl h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
