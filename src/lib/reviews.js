import { supabase } from './supabaseClient'
import { avatarUrl } from './avatar'

/**
 * Avis réciproques après une embauche (statut « hired »). La base vérifie que
 * l'auteur est bien partie à l'embauche et que la personne notée est l'autre.
 */

/** Avis déjà laissés par ce compte, indexés par candidature. */
export async function fetchMyReviews(reviewerId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, application_id, rating, comment')
    .eq('reviewer_id', reviewerId)
  if (error) throw error
  return Object.fromEntries((data || []).map((r) => [r.application_id, r]))
}

/** Crée ou modifie l'avis de ce compte sur cette embauche. */
export async function saveReview({ applicationId, reviewerId, revieweeId, rating, comment }) {
  const { data, error } = await supabase
    .from('reviews')
    .upsert(
      {
        application_id: applicationId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        rating,
        comment: comment?.trim() || null,
      },
      { onConflict: 'application_id,reviewer_id' }
    )
    .select('id, application_id, rating, comment')
    .single()
  if (error) throw error
  return data
}

/** Avis reçus par une personne, les plus récents d'abord. */
export async function fetchReviewsAbout(revieweeId, limit = 10) {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, reviewer:reviewer_id(full_name, avatar_path, role)')
    .eq('reviewee_id', revieweeId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data || []).map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment || '',
    date: r.created_at.slice(0, 10),
    reviewerName: r.reviewer?.full_name || '',
    reviewerAvatar: avatarUrl(r.reviewer?.avatar_path),
    reviewerRole: r.reviewer?.role || '',
  }))
}

/** Moyenne et nombre d'avis, indexés par personne ; une personne sans avis est absente. */
export async function fetchRatingStats(profileIds) {
  const ids = [...new Set(profileIds.filter(Boolean))]
  if (ids.length === 0) return {}
  const { data, error } = await supabase.from('review_stats').select('reviewee_id, average, total').in('reviewee_id', ids)
  if (error) throw error
  return Object.fromEntries((data || []).map((r) => [r.reviewee_id, { average: Number(r.average), total: r.total }]))
}
