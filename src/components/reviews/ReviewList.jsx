import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n/I18nProvider'
import { fetchRatingStats, fetchReviewsAbout } from '../../lib/reviews'
import Avatar from '../ui/Avatar'
import { RatingSummary, Stars } from './Stars'

/** Section publique « Avis » d'une fiche : moyenne puis derniers avis reçus. Rien sans avis. */
export default function ReviewList({ profileId, className = '' }) {
  const { t, d } = useI18n()
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([fetchReviewsAbout(profileId), fetchRatingStats([profileId])])
      .then(([list, s]) => {
        if (!active) return
        setReviews(list)
        setStats(s[profileId] || null)
      })
      .catch(() => {})
    return () => { active = false }
  }, [profileId])

  if (!stats?.total) return null

  return (
    <section className={`border-t border-sand-200/70 pt-8 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[22px]">{t('reviews.title')}</h2>
        <RatingSummary stats={stats} className="text-[14.5px]" />
      </div>

      <ul className="mt-5 space-y-3">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-2xl border border-sand-200/70 bg-white p-5 shadow-card">
            <div className="flex items-center gap-3">
              <Avatar name={r.reviewerName || t('reviews.hiddenReviewer')} src={r.reviewerAvatar} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-medium text-ink">{r.reviewerName || t('reviews.hiddenReviewer')}</p>
                <p className="text-[12.5px] text-ink-400">
                  {r.reviewerRole && <>{t(`admin.${r.reviewerRole}`)} · </>}{d(r.date)}
                </p>
              </div>
              <Stars value={r.rating} />
            </div>
            {r.comment && <p className="mt-3 text-[15px] leading-relaxed text-ink-800">{r.comment}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}
