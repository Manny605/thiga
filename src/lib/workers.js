import { supabase } from './supabaseClient'

const SELECT = `
  profile_id, trade, district, years, availability, rate, unit, langs, skills, bio,
  verified, refs, last_active,
  profiles ( full_name, city )
`

/** Traduit une ligne `worker_profiles` (+ jointure profiles) vers la forme WorkerCard/WorkerDetail. */
export function mapWorker(row) {
  return {
    id: row.profile_id,
    name: row.profiles?.full_name || '',
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

export async function fetchWorkers() {
  const { data, error } = await supabase
    .from('worker_profiles')
    .select(SELECT)
    .order('last_active', { ascending: false })
  if (error) throw error
  return (data || []).map(mapWorker)
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
  return (data || []).map(mapWorker)
}
