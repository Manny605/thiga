import { supabase } from './supabaseClient'

const SELECT = `
  id, title, trade, city, district, contract, salary, unit, status,
  urgent, verified, description, duties, reqs, created_at,
  profiles ( full_name, employer_profiles ( employer_type ) )
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
    employer: row.profiles?.full_name || '',
    employerType: row.profiles?.employer_profiles?.employer_type || '',
  }
}

export async function fetchOnlineJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select(SELECT)
    .eq('status', 'online')
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
