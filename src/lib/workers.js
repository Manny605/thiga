import { supabase } from './supabaseClient'
import { avatarUrl } from './avatar'
import { fetchRatingStats } from './reviews'
import { pageRange, searchPattern } from './search'

const SELECT = `
  profile_id, trade, district, years, availability, rate, unit, langs, skills, bio,
  verified, refs, last_active,
  profiles ( full_name, city, avatar_path )
`

/** Traduit une ligne `worker_profiles` (+ jointure profiles) vers la forme WorkerCard/WorkerDetail. */
export function mapWorker(row) {
  return {
    id: row.profile_id,
    name: row.profiles?.full_name || '',
    avatar: avatarUrl(row.profiles?.avatar_path),
    trade: row.trade,
    city: row.profiles?.city || '',
    district: row.district,
    years: row.years,
    verified: row.verified,
    availability: row.availability,
    rate: row.rate,
    unit: row.unit,
    langs: row.langs || [],
    skills: row.skills || [],
    bio: row.bio || '',
    refs: row.refs,
    lastActive: row.last_active ? row.last_active.slice(0, 10) : '',
  }
}

/**
 * Annuaire public : profils vérifiés uniquement. Le filtre est explicite même
 * si la policy RLS l'applique déjà, car un employeur voit aussi ses candidats
 * non vérifiés : ils ne doivent pas apparaître dans l'annuaire pour autant.
 */
export async function fetchWorkers() {
  const { data, error } = await supabase
    .from('worker_profiles')
    .select(SELECT)
    .eq('verified', true)
    .order('last_active', { ascending: false })
  if (error) throw error
  return withRatings((data || []).map(mapWorker))
}

/** Ajoute `rating` ({ average, total } ou null) ; une note illisible ne bloque pas la liste. */
/**
 * Annuaire paginé : profils vérifiés, filtres, mots-clés (nom, métier,
 * compétences, présentation…) et tri appliqués par la base.
 */
export async function searchWorkers({ q, trade, city, minExp, sort, page = 0 }) {
  // Filtrer sur la ville impose une jointure obligatoire (!inner) vers profiles.
  const select = city ? SELECT.replace('profiles (', 'profiles!inner (') : SELECT
  let query = supabase
    .from('worker_profiles')
    .select(select, { count: 'exact' })
    .eq('verified', true)
  if (trade) query = query.eq('trade', trade)
  if (city) query = query.eq('profiles.city', city)
  if (minExp) query = query.gte('years', Number(minExp))
  const pattern = searchPattern(q)
  if (pattern) query = query.ilike('search_text', pattern)
  query = sort === 'exp'
    ? query.order('years', { ascending: false, nullsFirst: false })
    : query.order('last_active', { ascending: false, nullsFirst: false })
  const { data, error, count } = await query.order('profile_id').range(...pageRange(page))
  if (error) throw error
  return { rows: await withRatings((data || []).map(mapWorker)), count: count || 0 }
}

async function withRatings(workers) {
  const stats = await fetchRatingStats(workers.map((w) => w.id)).catch(() => ({}))
  return workers.map((w) => ({ ...w, rating: stats[w.id] || null }))
}

export async function fetchWorkerById(id) {
  const { data, error } = await supabase
    .from('worker_profiles')
    .select(SELECT)
    .eq('profile_id', id)
    .maybeSingle()
  if (error) throw error
  return data ? mapWorker(data) : null
}

export async function fetchFeaturedWorkers(limit = 3) {
  const { data, error } = await supabase
    .from('worker_profiles')
    .select(SELECT)
    .eq('verified', true)
    .order('last_active', { ascending: false })
    .limit(limit)
  if (error) throw error
  return withRatings((data || []).map(mapWorker))
}
