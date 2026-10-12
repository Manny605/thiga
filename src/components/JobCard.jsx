import { Link } from 'react-router-dom'
import { ArrowRight, Briefcase, MapPin } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { useTrades } from '../trades/TradesProvider'
import Badge from './ui/Badge'

export default function JobCard({ j }) {
  const { t, n, d } = useI18n()
  const { tradeLabel } = useTrades()

  return (
    <Link
      to={`/offres/${j.id}`}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-sand-200/70 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-vert-200 hover:shadow-lift sm:p-6"
    >
      <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-vert-600 transition-transform duration-500 group-hover:scale-x-100" />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="vert">{tradeLabel(j.trade)}</Badge>
        {/* `contract`, `district` et `unit` sont facultatifs en base. */}
        {j.contract && <Badge>{t(`contracts.${j.contract}`)}</Badge>}
        {j.urgent && <Badge tone="ocre">{t('common.urgent')}</Badge>}
      </div>

      <h3 className="mt-3.5 text-[19px] leading-snug text-ink transition-colors group-hover:text-vert-700 sm:text-[21px]">
        {j.title}
      </h3>

      <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[14px] text-ink-400">
        <span className="flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5" />
          {j.employer}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {t(`cities.${j.city}`)}{j.district ? ` · ${j.district}` : ''}
        </span>
      </p>

      <p className="mt-3.5 line-clamp-2 text-[14.5px] leading-relaxed text-ink-600">{j.desc}</p>

      {/* Pousse le pied de carte en bas : toutes les cartes d'une grille ont la même hauteur. */}
      <div className="min-h-5 flex-1" aria-hidden="true" />

      <div className="flex items-center justify-between border-t border-sand-200/70 pt-4">
        <div>
          <p className="font-display text-[19px] leading-none text-vert-700">
            {n(j.salary)}{' '}
            <span className="text-[13px] text-ink-400">MRU {j.unit ? t(`common.${j.unit}`) : ''}</span>
          </p>
          <p className="mt-1.5 text-[13px] text-ink-400">
            {j.deadline ? `${t('common.deadlineUntil')} ${d(j.deadline)}` : `${t('common.publishedOn')} ${d(j.posted)}`}
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-[14px] font-medium text-ink-600 transition-colors group-hover:text-vert-700">
          {t('common.viewOffer')}
          <ArrowRight className="flip-rtl h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}
