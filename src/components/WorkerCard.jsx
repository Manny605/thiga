import { Link } from 'react-router-dom'
import { BadgeCheck, MapPin } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { useTrades } from '../trades/TradesProvider'
import Avatar from './ui/Avatar'
import Badge from './ui/Badge'

const DOT = {
  now: 'bg-vert-600',
  soon: 'bg-ocre-500',
  busy: 'bg-ink-400',
}

export default function WorkerCard({ w }) {
  const { t, n } = useI18n()
  const { tradeLabel } = useTrades()

  return (
    <Link
      to={`/travailleurs/${w.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-sand-200/70 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-vert-200 hover:shadow-lift"
    >
      {/* Filet qui se déploie au survol */}
      <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-vert-600 transition-transform duration-500 group-hover:scale-x-100" />

      <div className="flex items-start gap-4">
        <Avatar name={w.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-[17px] leading-tight text-ink">{w.name}</h3>
            {w.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-vert-600" />}
          </div>
          <p className="mt-1 text-[13px] text-ocre-700">{tradeLabel(w.trade)}</p>
          <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-ink-400">
            <MapPin className="h-3.5 w-3.5" />
            {w.city && t(`cities.${w.city}`)}
            {w.district && <span className="text-sand-400">·</span>}
            {w.district}
          </p>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-[13.5px] leading-relaxed text-ink-600">{w.bio}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {w.skills.slice(0, 3).map((s) => (
          <Badge key={s}>{s}</Badge>
        ))}
        {w.skills.length > 3 && <Badge>+{w.skills.length - 3}</Badge>}
      </div>

      <div className="mt-5 flex items-end justify-between border-t border-sand-200/70 pt-4">
        <div>
          <p className="font-display text-[19px] leading-none text-vert-700">
            {n(w.rate || 0)} <span className="text-[12px] text-ink-400">MRU {w.unit ? t(`common.${w.unit}`) : ''}</span>
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-400">
            <span className={`h-1.5 w-1.5 rounded-full ${DOT[w.availability]}`} />
            {t(`availability.${w.availability}`)}
          </p>
        </div>
        <p className="text-[12.5px] text-ink-400">
          {w.years} {t('common.years')}
        </p>
      </div>
    </Link>
  )
}
