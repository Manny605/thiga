import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, FileCheck2, Flag, MapPin } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { useTrades } from '../trades/TradesProvider'
import { fetchPublicStats } from '../lib/stats'
import { fetchFeaturedWorkers } from '../lib/workers'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Reveal from '../components/ui/Reveal'
import SectionHeading from '../components/ui/SectionHeading'
import SearchBar from '../components/SearchBar'
import TradeIcon from '../components/TradeIcon'
import HomeOffers from '../components/HomeOffers'

const TRUST_ICONS = [BadgeCheck, FileCheck2, Flag]

/** Colonne visuelle du héros : profils réels en vedette sur un panneau vert à motif. */
function HeroVisual({ workers, stats }) {
  const { t, n } = useI18n()
  const { tradeLabel } = useTrades()

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="relative overflow-hidden rounded-3xl bg-vert-700 p-6 shadow-lift sm:p-8">
        <div className="motif-light pointer-events-none absolute inset-0 opacity-[0.09]" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -end-24 -top-24 h-72 w-72 rounded-full bg-ocre-300/25 blur-3xl"
          aria-hidden="true"
        />

        <p className="relative text-[12px] font-medium uppercase tracking-[0.16em] text-vert-100/80">
          {t('home.featuredWorkers')}
        </p>

        <ul className="stagger relative mt-5 space-y-3">
          {workers.map((w) => (
            <li key={w.id}>
              <Link
                to={`/travailleurs/${w.id}`}
                className="flex items-center gap-3.5 rounded-2xl bg-white/95 p-3.5 shadow-card transition-transform duration-300 hover:-translate-y-0.5"
              >
                <Avatar name={w.name} src={w.avatar} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-[15px] font-medium text-ink">
                    {w.name}
                    {w.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-vert-600" />}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-ink-400">
                    <span className="text-ocre-700">{tradeLabel(w.trade)}</span>
                    {w.city && (
                      <>
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {t(`cities.${w.city}`)}
                      </>
                    )}
                  </p>
                </div>
                <ArrowRight className="flip-rtl h-4 w-4 shrink-0 text-ink-400" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Pastilles de chiffres : uniquement des compteurs réels, jamais de valeur inventée. */}
      {stats && (
        <div className="relative -mt-6 flex justify-center gap-3 px-4 sm:justify-start">
          {[
            ['workers', stats.workers],
            ['verified', stats.verified],
          ].map(([k, v]) => (
            <div key={k} className="animate-rise rounded-2xl border border-sand-200 bg-white px-4 py-3 shadow-card">
              <p className="font-display text-[22px] font-semibold leading-none text-vert-700 tabular-nums">{n(v)}</p>
              <p className="mt-1.5 text-[12px] text-ink-400">{t(`home.stats.${k}`)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const { t } = useI18n()
  const { visibleTrades, tradeLabel } = useTrades()
  const [stats, setStats] = useState(null)
  const [workers, setWorkers] = useState([])

  useEffect(() => {
    let active = true
    fetchPublicStats().then((s) => { if (active) setStats(s) }).catch(() => {})
    fetchFeaturedWorkers(3).then((w) => { if (active) setWorkers(w) }).catch(() => {})
    return () => { active = false }
  }, [])

  return (
    <>
      {/* ── Héros : recherche immédiate + profils réels ───────── */}
      <section className="relative overflow-hidden border-b border-sand-200 bg-white">
        <div
          className="motif pointer-events-none absolute inset-0 opacity-[0.05] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_65%)]"
          aria-hidden="true"
        />
        <div className="shell relative grid items-center gap-14 py-14 md:py-20 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <div className="animate-fade">
              <Badge tone="ocre">{t('home.kicker')}</Badge>
            </div>

            <h1 className="mt-6 animate-rise text-[clamp(2.5rem,6vw,4.4rem)] font-semibold leading-[1.02]">
              {t('home.title')}
              <br />
              <em className="not-italic text-vert-700">{t('home.titleEm')}</em>
            </h1>

            <p className="mt-6 max-w-xl animate-rise text-[17px] leading-relaxed text-ink-600 [animation-delay:.1s]">
              {t('home.lede')}
            </p>

            <div className="mt-9 animate-rise rounded-2xl border border-sand-200 bg-white p-3 shadow-card [animation-delay:.18s] sm:p-4">
              <p className="mb-3 px-1 text-[13px] font-medium text-ink-600">{t('home.searchTitle')}</p>
              <SearchBar target="/travailleurs" compact />
            </div>

            <div className="mt-5 flex animate-rise flex-wrap items-center gap-x-5 gap-y-2 text-[14px] [animation-delay:.24s]">
              <Link to="/offres" className="inline-flex items-center gap-1.5 font-medium text-vert-700 hover:text-vert-800">
                {t('home.ctaWorker')}
                <ArrowRight className="flip-rtl h-4 w-4" />
              </Link>
              <span className="h-4 w-px bg-sand-300" aria-hidden="true" />
              <Link to="/inscription" className="text-ink-600 hover:text-ink">
                {t('nav.register')}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            {workers.length > 0 && <HeroVisual workers={workers} stats={stats} />}
          </div>
        </div>
      </section>

      {/* ── 01 · Métiers ─────────────────────────────────────── */}
      {visibleTrades.length > 0 && (
        <section className="bg-sand-50">
          <div className="shell py-20 md:py-24">
            <SectionHeading num="01" kicker={t('common.trade')} title={t('home.tradesTitle')} lede={t('home.tradesLede')} />
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {visibleTrades.map((tr, i) => (
                <Reveal key={tr.id} delay={(i % 5) * 60}>
                  <Link
                    to={`/travailleurs?metier=${tr.id}`}
                    className="group flex h-full flex-col gap-4 rounded-2xl border border-sand-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-vert-200 hover:shadow-lift"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-vert-50 text-vert-700 transition-colors group-hover:bg-vert-700 group-hover:text-sand-50">
                      <TradeIcon name={tr.icon} className="h-5 w-5" />
                    </span>
                    <span className="flex items-center justify-between gap-2 text-[15px] font-medium text-ink">
                      {tradeLabel(tr.id)}
                      <ArrowRight className="flip-rtl h-4 w-4 shrink-0 text-ink-400 opacity-0 transition-opacity group-hover:opacity-100" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 02 · Offres filtrables ───────────────────────────── */}
      <HomeOffers />

      {/* ── 03 · Comment ça marche ───────────────────────────── */}
      <section className="bg-white">
        <div className="shell py-20 md:py-24">
          <SectionHeading num="03" kicker={t('home.kPath')} title={t('home.howTitle')} lede={t('home.howLede')} />
          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {t('home.steps').map((step, i) => (
              <Reveal as="li" key={step.t} delay={i * 90} className="relative rounded-2xl border border-sand-200 bg-sand-50 p-7">
                <span className="font-display text-[44px] font-semibold leading-none text-ocre-300 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-5 text-[19px] leading-snug">{step.t}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-ink-600">{step.d}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 04 · Confiance ───────────────────────────────────── */}
      <section className="border-t border-sand-200 bg-sand-50">
        <div className="shell py-20 md:py-24">
          <SectionHeading num="04" kicker={t('home.kSafety')} title={t('home.trustTitle')} lede={t('home.trustLede')} />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {t('home.trust').map((item, i) => {
              const Icon = TRUST_ICONS[i]
              return (
                <Reveal key={item.t} delay={i * 90} className="rounded-2xl border border-sand-200 bg-white p-7 shadow-card">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-vert-50 text-vert-700">
                    <Icon className="h-6 w-6" strokeWidth={1.6} />
                  </span>
                  <h3 className="mt-5 text-[19px] leading-snug">{item.t}</h3>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-ink-600">{item.d}</p>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Appel final ──────────────────────────────────────── */}
      <section className="bg-sand-50 pb-20 md:pb-24">
        <div className="shell">
          <Reveal className="relative overflow-hidden rounded-3xl bg-vert-800 px-6 py-12 text-center shadow-lift sm:px-12 md:py-16">
            <div className="motif-light pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden="true" />
            <h2 className="relative text-[clamp(1.8rem,3.6vw,2.7rem)] font-semibold text-sand-50">{t('home.ctaTitle')}</h2>
            <p className="relative mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-vert-100/85">{t('home.ctaLede')}</p>
            <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button to="/inscription" variant="invert" size="lg">
                {t('nav.register')}
                <ArrowRight className="flip-rtl h-4 w-4" />
              </Button>
              <Button to="/travailleurs" size="lg" className="border border-sand-50/25 bg-transparent hover:bg-white/10">
                {t('home.ctaEmployer')}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
