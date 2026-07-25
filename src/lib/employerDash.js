import { supabase } from './supabaseClient'

// Toutes les colonnes éditables : la liste alimente aussi le formulaire de
// modification, qui doit être pré-rempli avec l'annonce existante.
const JOB_FIELDS =
  'id, title, trade, city, district, contract, salary, unit, status, description, duties, reqs, created_at'

function mapJobRow(row, appsCount = 0) {
  return {
    id: row.id,
    title: row.title,
    trade: row.trade,
    city: row.city,
    district: row.district || '',
    contract: row.contract || '',
    salary: row.salary,
    unit: row.unit || 'perMonth',
    status: row.status,
    description: row.description || '',
    duties: row.duties || [],
    reqs: row.reqs || [],
    createdAt: row.created_at ? row.created_at.slice(0, 10) : '',
    appsCount,
  }
}

/** Champs d'une offre, tels qu'attendus par la table `jobs`. */
function jobPayload(payload) {
  return {
    title: payload.title,
    trade: payload.trade,
    city: payload.city,
    district: payload.district || null,
    contract: payload.contract || null,
    salary: payload.salary ?? null,
    unit: payload.unit || null,
    description: payload.description || null,
    duties: payload.duties || [],
    reqs: payload.reqs || [],
  }
}

export async function fetchMyJobs(employerId) {
  const { data, error } = await supabase
    .from('jobs')
    .select(JOB_FIELDS)
    .eq('employer_id', employerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  const jobs = data || []
  if (jobs.length === 0) return []

  const { data: apps, error: appsErr } = await supabase
    .from('applications')
    .select('job_id')
    .in('job_id', jobs.map((j) => j.id))
  if (appsErr) throw appsErr

  const counts = {}
  for (const a of apps || []) counts[a.job_id] = (counts[a.job_id] || 0) + 1

  return jobs.map((j) => mapJobRow(j, counts[j.id] || 0))
}

/** `limit` omis = liste complète (page Candidatures) ; sinon aperçu (Overview). */
export async function fetchRecentApplicants(employerId, limit) {
  const { data: jobs, error: jobsErr } = await supabase.from('jobs').select('id').eq('employer_id', employerId)
  if (jobsErr) throw jobsErr
  const jobIds = (jobs || []).map((j) => j.id)
  if (jobIds.length === 0) return []

  let query = supabase
    .from('applications')
    .select(
      'id, status, message, cv_path, cv_name, created_at, job_id, worker_id, ' +
      'jobs(title), worker:worker_id(full_name, worker_profiles(trade))'
    )
    .in('job_id', jobIds)
    .order('created_at', { ascending: false })
  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((a) => ({
    id: a.id,
    status: a.status,
    // Le mot du candidat était collecté à la candidature puis jamais affiché.
    message: a.message || '',
    cvPath: a.cv_path || null,
    cvName: a.cv_name || '',
    date: a.created_at ? a.created_at.slice(0, 10) : '',
    jobId: a.job_id,
    jobTitle: a.jobs?.title || '',
    workerId: a.worker_id,
    workerName: a.worker?.full_name || '',
    workerTrade: a.worker?.worker_profiles?.trade || '',
  }))
}

/**
 * Candidatures reçues d'un travailleur donné, sur les annonces de cet employeur.
 * Alimente la fiche publique du travailleur quand c'est un employeur qui la
 * consulte : il y retrouve le CV et le message qu'on lui a envoyés.
 */
export async function fetchApplicationsFromWorker(employerId, workerId) {
  const { data, error } = await supabase
    .from('applications')
    .select('id, status, message, cv_path, cv_name, created_at, jobs!inner(id, title, employer_id)')
    .eq('worker_id', workerId)
    .eq('jobs.employer_id', employerId)
    .order('created_at', { ascending: false })
  if (error) throw error

  return (data || []).map((a) => ({
    id: a.id,
    status: a.status,
    message: a.message || '',
    cvPath: a.cv_path || null,
    cvName: a.cv_name || '',
    date: a.created_at ? a.created_at.slice(0, 10) : '',
    jobId: a.jobs?.id,
    jobTitle: a.jobs?.title || '',
  }))
}

export async function createJob(employerId, payload) {
  const { data, error } = await supabase
    .from('jobs')
    .insert({ employer_id: employerId, ...jobPayload(payload) })
    .select(JOB_FIELDS)
    .single()
  if (error) throw error
  return mapJobRow(data)
}

/**
 * Modifie une annonce. Le trigger `guard_job_columns` renvoie en modération
 * une annonce en ligne dont le fond change : la ligne retournée porte donc le
 * statut réel après écriture, pas celui envoyé.
 */
export async function updateJob(jobId, payload) {
  const { data, error } = await supabase
    .from('jobs')
    .update(jobPayload(payload))
    .eq('id', jobId)
    .select(JOB_FIELDS)
    .single()
  if (error) throw error
  return mapJobRow(data)
}

/**
 * Suppression définitive ; les candidatures liées partent en cascade.
 *
 * `.select()` n'est pas décoratif : une suppression refusée par RLS ne renvoie
 * pas d'erreur, seulement zéro ligne. Sans cette vérification, l'écran
 * annoncerait une suppression qui n'a pas eu lieu.
 */
export async function deleteJob(jobId) {
  const { data, error } = await supabase.from('jobs').delete().eq('id', jobId).select('id')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('delete refused')
}

/** 'closed' pour retirer l'annonce, 'pending' pour la remettre en modération. */
export async function setJobStatus(jobId, status) {
  const { error } = await supabase.from('jobs').update({ status }).eq('id', jobId)
  if (error) throw error
}

export async function setApplicationStatus(applicationId, status) {
  const { error } = await supabase.from('applications').update({ status }).eq('id', applicationId)
  if (error) throw error
}

export async function fetchMySettings(employerId) {
  const [{ data: profile, error: profileErr }, { data: contact, error: contactErr }, { data: emp, error: empErr }] =
    await Promise.all([
      supabase.from('profiles').select('full_name, city').eq('id', employerId).single(),
      supabase.from('private_contact').select('phone').eq('profile_id', employerId).maybeSingle(),
      supabase.from('employer_profiles').select('employer_type').eq('profile_id', employerId).single(),
    ])
  if (profileErr) throw profileErr
  if (contactErr) throw contactErr
  if (empErr) throw empErr

  return {
    fullName: profile.full_name,
    city: profile.city || '',
    phone: contact?.phone || '',
    employerType: emp.employer_type,
  }
}

export async function updateMySettings(employerId, patch) {
  const { error: profErr } = await supabase
    .from('profiles')
    .update({ full_name: patch.fullName, city: patch.city })
    .eq('id', employerId)
  if (profErr) throw profErr

  const { error: empErr } = await supabase
    .from('employer_profiles')
    .update({ employer_type: patch.employerType })
    .eq('profile_id', employerId)
  if (empErr) throw empErr

  const { error: contactErr } = await supabase
    .from('private_contact')
    .upsert({ profile_id: employerId, phone: patch.phone })
  if (contactErr) throw contactErr
}
