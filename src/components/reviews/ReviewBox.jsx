import { useState } from 'react'
import { Star } from 'lucide-react'
import { useI18n } from '../../i18n/I18nProvider'
import { saveReview } from '../../lib/reviews'
import { Stars } from './Stars'

/**
 * Avis sur l'autre partie d'une embauche, dans les listes de candidatures.
 * Sans avis : le formulaire. Avec avis : son rappel et un bouton « Modifier ».
 */
export default function ReviewBox({ applicationId, reviewerId, revieweeId, existing, onSaved, prompt }) {
  const { t } = useI18n()
  const [editing, setEditing] = useState(!existing)
  const [rating, setRating] = useState(existing?.rating || 0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState(existing?.comment || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!editing && existing) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-sand-200 bg-sand-50/70 px-4 py-3">
        <span className="text-[13px] font-medium text-ink-600">{t('reviews.yours')}</span>
        <Stars value={existing.rating} />
        {existing.comment && <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink-600">« {existing.comment} »</span>}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="ms-auto text-[13.5px] text-vert-700 hover:underline"
        >
          {t('reviews.edit')}
        </button>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rating) return setError(t('reviews.pickRating'))
    setSaving(true)
    setError('')
    try {
      const saved = await saveReview({ applicationId, reviewerId, revieweeId, rating, comment })
      onSaved(saved)
      setEditing(false)
    } catch {
      setError(t('reviews.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const shown = hover || rating

  return (
    <form onSubmit={handleSubmit} className="mt-3 rounded-xl border border-ocre-300/60 bg-ocre-50 px-4 py-3.5">
      <p className="text-[13.5px] font-medium text-ink-800">{prompt}</p>

      <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label={t('reviews.ratingLabel')} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={rating === i}
            aria-label={`${i} / 5`}
            onClick={() => setRating(i)}
            onMouseEnter={() => setHover(i)}
            className="rounded-md p-0.5 transition-transform hover:scale-110"
          >
            <Star className={`h-6 w-6 ${i <= shown ? 'fill-ocre-500 text-ocre-500' : 'text-sand-400'}`} strokeWidth={1.5} />
          </button>
        ))}
      </div>

      <label className="mt-3 block">
        <span className="sr-only">{t('reviews.commentLabel')}</span>
        <textarea
          id={`review-${applicationId}`}
          rows={2}
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('reviews.commentPlaceholder')}
          className="w-full resize-y rounded-xl border border-sand-300 bg-white p-3 text-[14px] text-ink outline-none transition-all placeholder:text-ink-400/70 focus:border-vert-600 focus:ring-4 focus:ring-vert-600/10"
        />
      </label>

      {error && <p className="mt-2 text-[13.5px] text-red-600">{error}</p>}

      <div className="mt-2.5 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="h-9 rounded-xl bg-vert-700 px-4 text-[13.5px] font-medium text-sand-50 transition-colors hover:bg-vert-800 disabled:opacity-40"
        >
          {saving ? '…' : t('reviews.publish')}
        </button>
        {existing && (
          <button type="button" onClick={() => setEditing(false)} className="text-[13.5px] text-ink-600 hover:text-ink">
            {t('dash.cancel')}
          </button>
        )}
        <span className="ms-auto text-[12.5px] text-ink-400">{t('reviews.publicNote')}</span>
      </div>
    </form>
  )
}
