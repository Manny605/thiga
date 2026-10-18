import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { CITIES } from '../data/mock'
import { fetchPublicStats } from '../lib/stats'
import PageHeader from '../components/layout/PageHeader'
import SectionHeading from '../components/ui/SectionHeading'
import Reveal from '../components/ui/Reveal'
import Button from '../components/ui/Button'

export default function About() {
  const { t, n } = useI18n()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchPublicStats()
      .then((s) => { if (!cancelled) setStats(s) })
      .catch(() => { if (!cancelled) setStats(null) })
    return () => { cancelled = true }
  }, [])

  return (
    <>
      <PageHeader kicker={t('nav.about')} title={t('about.title')} lede={t('about.lede')} />

      <section className="shell py-20 md:py-28">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-4">
            <span className="eyebrow">{t('about.missionK')}</span>
            <div className="mt-4 h-px w-16 bg-ocre-500" />
          </Reveal>
          <Reveal delay={100} className="lg:col-span-8">
            <p className="font-display text-[clamp(1.35rem,2.6vw,1.9rem)] leading-[1.45] text-ink">
              {t('about.mission')}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-sand-200/70 bg-white">
        <div className="shell py-20 md:py-28">
          <SectionHeading num="01" kicker={t('about.valuesK')} title={t('about.valuesK')} className="border-t-ink/15" />
          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {t('about.values').map((v, i) => (
              <Reveal key={v.t} delay={i * 80} className="rounded-2xl border border-sand-200/70 bg-sand-50/60 p-8 md:p-10">
                <span className="font-display text-[14px] text-ocre-500 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 text-[22px] leading-snug">{v.t}</h3>
                <p className="mt-3 max-w-sm text-[15.5px] leading-relaxed text-ink-600">{v.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="shell py-20 md:py-28">
        <SectionHeading num="02" kicker={t('about.reachK')} title={t('about.reachK')} lede={t('about.reachD')} />
        <div className="mt-12 flex flex-wrap gap-2.5">
          {CITIES.map((c, i) => (
            <Reveal key={c} delay={i * 35}>
              <span className="rounded-full border border-sand-200/70 bg-white px-4 py-2.5 text-[15px] text-ink-600 shadow-sm transition-colors hover:border-vert-200 hover:text-vert-700">
                {t(`cities.${c}`)}
              </span>
            </Reveal>
          ))}
        </div>

        {stats && (
          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {[['workers', stats.workers], ['offers', stats.offers], ['verified', stats.verified]].map(
              ([k, v], i) => (
                <Reveal key={k} delay={i * 70} className="rounded-2xl border border-sand-200/70 bg-white p-8 text-center shadow-card">
                  <p className="font-display text-[clamp(1.9rem,4vw,2.6rem)] leading-none text-vert-700 tabular-nums">
                    {n(v)}
                  </p>
                  <p className="mt-2.5 text-[13.5px] text-ink-400">{t(`home.stats.${k}`)}</p>
                </Reveal>
              )
            )}
          </div>
        )}
      </section>
    </>
  )
}
