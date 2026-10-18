import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, FileCheck2, Flag } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { useTrades } from '../trades/TradesProvider'
import { fetchPublicStats } from '../lib/stats'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Reveal from '../components/ui/Reveal'
import SectionHeading from '../components/ui/SectionHeading'
import TradeIcon from '../components/TradeIcon'
import HomeOffers from '../components/HomeOffers'
import bannerSm from '../../assets/hero-banner-800.webp'
import bannerLg from '../../assets/hero-banner-1400.webp'

const TRUST_ICONS = [BadgeCheck, FileCheck2, Flag]

function HeroBanner({ stats }) {
  const { t, n } = useI18n()

  return (
    <div className="relative">
      <img
        src={bannerSm}
        srcSet={`${bannerSm} 800w, ${bannerLg} 1400w`}
        sizes="(min-width: 1024px) 50vw, 100vw"
        width="1400"
        height="700"
        alt=""
        aria-hidden="true"
        fetchpriority="high"
        decoding="async"
        className="pointer-events-none w-full animate-fade select-none lg:scale-110"
      />

      {stats && (
        <div className="absolute -bottom-4 start-4 flex gap-3 sm:start-8">
          {[
            ['workers', stats.workers],
            ['verified', stats.verified],
          ].map(([k, v], i) => (
            <div
              key={k}
              className="animate-rise rounded-2xl border border-sand-200 bg-white/95 px-4 py-3 shadow-card backdrop-blur"
              style={{ animationDelay: `${0.25 + i * 0.1}s` }}
            >
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

  useEffect(() => {
    let active = true
    fetchPublicStats().then((s) => { if (active) setStats(s) }).catch(() => {})
    return () => { active = false }
  }, [])

  return (
    <>
      <section className="relative overflow-hidden border-b border-sand-200 bg-white">
        <div
          className="motif pointer-events-none absolute inset-0 opacity-[0.05] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_65%)]"
          aria-hidden="true"
        />
        <div className="shell relative grid items-center gap-12 py-14 md:py-20 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <div className="animate-fade">
              <Badge tone="ocre">{t('home.kicker')}</Badge>
            </div>

            <h1 className="mt-6 animate-rise text-[clamp(2.5rem,5.4vw,4.1rem)] font-semibold leading-[1.02]">
              {t('home.title')}
              <br />
              <em className="not-italic text-vert-700">{t('home.titleEm')}</em>
            </h1>

            <p className="mt-6 max-w-xl animate-rise text-[17px] leading-relaxed text-ink-600 [animation-delay:.1s]">
              {t('home.lede')}
            </p>
          </div>

          <div className="lg:col-span-6">
            <HeroBanner stats={stats} />
          </div>
        </div>
      </section>

      <HomeOffers />

      {visibleTrades.length > 0 && (
        <section className="bg-white">
          <div className="shell py-20 md:py-24">
            <SectionHeading num="02" kicker={t('common.trade')} title={t('home.tradesTitle')} lede={t('home.tradesLede')} />
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {visibleTrades.map((tr, i) => (
                <Reveal key={tr.id} delay={(i % 5) * 60}>
                  <Link
                    to={`/offres?metier=${tr.id}`}
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

      <section className="border-t border-sand-200 bg-sand-50">
        <div className="shell py-20 md:py-24">
          <Reveal className="grid items-center gap-8 rounded-3xl border border-sand-200 bg-white p-8 shadow-card md:grid-cols-12 md:p-12">
            <div className="md:col-span-8">
              <span className="eyebrow">{t('home.recruitK')}</span>
              <h2 className="mt-3 text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-tight">{t('home.recruitTitle')}</h2>
              <p className="mt-3 max-w-xl text-[15.5px] leading-relaxed text-ink-600">{t('home.recruitLede')}</p>
            </div>
            <div className="flex flex-col gap-3 md:col-span-4">
              <Button to="/inscription?role=employeur" size="lg">
                {t('auth.employersOnlyCta')}
                <ArrowRight className="flip-rtl h-4 w-4" />
              </Button>
              <Button to="/connexion" state={{ from: { pathname: '/travailleurs' } }} variant="outline" size="lg">
                {t('home.recruitLogin')}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-sand-200 bg-white">
        <div className="shell py-20 md:py-24">
          <SectionHeading num="04" kicker={t('home.kPath')} title={t('home.howTitle')} lede={t('home.howLede')} />
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

      <section className="border-t border-sand-200 bg-sand-50">
        <div className="shell py-20 md:py-24">
          <SectionHeading num="05" kicker={t('home.kSafety')} title={t('home.trustTitle')} lede={t('home.trustLede')} />
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
              <Button to="/inscription?role=employeur" size="lg" className="border border-sand-50/25 bg-transparent hover:bg-white/10">
                {t('home.ctaEmployer')}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
