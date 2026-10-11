import { Star } from 'lucide-react'
import { useI18n } from '../../i18n/I18nProvider'

/** Note sur 5 en étoiles pleines, demi-étoile arrondie au plus proche. */
export function Stars({ value, size = 'h-4 w-4' }) {
  const rounded = Math.round(value * 2) / 2
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rounded >= i ? 1 : rounded >= i - 0.5 ? 0.5 : 0
        return (
          <span key={i} className={`relative inline-block ${size}`}>
            <Star className={`absolute inset-0 ${size} text-sand-300`} strokeWidth={1.5} />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={`${size} fill-ocre-500 text-ocre-500`} strokeWidth={1.5} />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

/** « ★★★★☆ 4,3 · 12 avis » ; rien quand la personne n'a pas encore d'avis. */
export function RatingSummary({ stats, size = 'h-4 w-4', className = '' }) {
  const { t, n } = useI18n()
  if (!stats?.total) return null
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      aria-label={`${n(stats.average)} / 5 · ${n(stats.total)} ${t('reviews.count')}`}
    >
      <Stars value={stats.average} size={size} />
      <span className="font-medium tabular-nums text-ink">{n(stats.average)}</span>
      <span className="text-ink-400">· {n(stats.total)} {t('reviews.count')}</span>
    </span>
  )
}
