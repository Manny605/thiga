import { ArrowRight, BadgeCheck, FileCheck2, Flag } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Reveal from '../components/ui/Reveal'
import SectionHeading from '../components/ui/SectionHeading'
import HomeOffers from '../components/HomeOffers'

const TRUST_ICONS = [BadgeCheck, FileCheck2, Flag]

export default function Home() {
  const { t } = useI18n()

  return (
    <>
      {/* ── Héros de bienvenue ────────────────────────────────── */}
      <section className="border-b border-sand-200 bg-white">
        <div className="shell grid gap-14 py-16 md:py-24 lg:grid-cols-12 lg:gap-10">
          {/* Colonne texte */}
          <div className="lg:col-span-7">
            <div className="animate-fade">
              <Badge tone="ocre">{t('home.kicker')}</Badge>
            </div>

            <h1 className="mt-6 animate-rise text-[clamp(2.4rem,6.2vw,4.6rem)] leading-[1.02]">
              {t('home.title')}
              <br />
              <em className="not-italic text-vert-700">{t('home.titleEm')}</em>
            </h1>

            <p className="mt-6 max-w-lg animate-rise text-[16px] leading-relaxed text-ink-600 [animation-delay:.1s]">
              {t('home.lede')}
            </p>

            <div className="mt-9 flex animate-rise flex-col gap-3 sm:flex-row [animation-delay:.18s]">
              <Button to="/travailleurs" size="lg">
                {t('home.ctaEmployer')}
                <ArrowRight className="flip-rtl h-4 w-4" />
              </Button>
              <Button to="/offres" variant="outline" size="lg">
                {t('home.ctaWorker')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 01 · Offres filtrables (fond gris) ────────────────── */}
      <HomeOffers />

      {/* ── 02 · Confiance (fond blanc) ───────────────────────── */}
      <section className="bg-white">
        <div className="shell py-20 md:py-28">
          <SectionHeading num="02" kicker={t('home.kSafety')} title={t('home.trustTitle')} lede={t('home.trustLede')} />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {t('home.trust').map((item, i) => {
              const Icon = TRUST_ICONS[i]
              return (
                <Reveal key={item.t} delay={i * 90} className="rounded-2xl border border-sand-200 bg-sand-50 p-7">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-vert-50 text-vert-700">
                    <Icon className="h-6 w-6" strokeWidth={1.4} />
                  </span>
                  <h3 className="mt-5 text-[19px] leading-snug">{item.t}</h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-ink-600">{item.d}</p>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
