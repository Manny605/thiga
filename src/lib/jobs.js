import { supabase } from './supabaseClient'
import { avatarUrl } from './avatar'
import { todayUtc } from './deadline'
import { pageRange, searchPattern } from './search'

const SELECT = `
  id, title, trade, city, district, contract, salary, unit, status,
  urgent, verified, description, duties, reqs, created_at, deadline,
  employer_id,
  profiles ( full_name, avatar_path, employer_profiles ( employer_type ) )
`

/** Traduit une ligne `jobs` (+ jointures) vers la forme attendue par JobCard/JobDetail. */
export function mapJob(row) {
  return {
    id: row.id,
    title: row.title,
    trade: row.trade,
    city: row.city,
    district: row.district,
    contract: row.contract,
    salary: row.salary,
    unit: row.unit,
    urgent: row.urgent,
    verified: row.verified,
    desc: row.description || '',
    duties: row.duties || [],
    reqs: row.reqs || [],
    posted: row.created_at ? row.created_at.slice(0, 10) : '',
    deadline: row.deadline || '',
    employer: row.profiles?.full_name || '',
    employerId: row.employer_id,
    employerAvatar: avatarUrl(row.profiles?.avatar_path),
    employerType: row.profiles?.employer_profiles?.employer_type || '',
  }
}

/**
 * Liste publique paginée : filtres, mots-clés et tri appliqués par la base.
 * Renvoie une page de résultats et le nombre total de correspondances.
 */
export async function searchJobs({ q, trade, city, contract, sort, page = 0 }) {
  let query = supabase
    .from('jobs')
    .select(SELECT, { count: 'exact' })
    .eq('status', 'online')
    .or(`deadline.is.null,deadline.gte.${todayUtc()}`)
  if (trade) query = query.eq('trade', trade)
  if (city) query = query.eq('city', city)
  if (contract) query = query.eq('contract', contract)
  const pattern = searchPattern(q)
  if (pattern) query = query.ilike('search_text', pattern)
  query = sort === 'salaire'
    ? query.order('salary', { ascending: false, nullsFirst: false })
    : query.order('created_at', { ascending: false })
  // Départage stable : sans lui, une ligne pourrait changer de page.
  const { data, error, count } = await query.order('id').range(...pageRange(page))
  if (error) throw error
  return { rows: (data || []).map(mapJob), count: count || 0 }
}

export async function fetchOnlineJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select(SELECT)
    .eq('status', 'online')
    // La policy masque déjà les annonces expirées au public, mais pas à leur
    // auteur : sans ce filtre, un employeur verrait les siennes dans la liste.
    .or(`deadline.is.null,deadline.gte.${todayUtc()}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(mapJob)
}

/**
 * Candidature déjà envoyée par ce travailleur sur cette offre (ou null).
 * Sans cette vérification, la fiche d'offre réaffichait le formulaire après
 * rechargement et l'envoi échouait sur la contrainte d'unicité.
 */
export async function fetchMyApplication(jobId, workerId) {
  const { data, error } = await supabase
    .from('applications')
    .select('id, status, created_at')
    .eq('job_id', jobId)
    .eq('worker_id', workerId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function fetchJobById(id) {
  const { data, error } = await supabase.from('jobs').select(SELECT).eq('id', id).maybeSingle()
  if (error) throw error
  return data ? mapJob(data) : null
}
