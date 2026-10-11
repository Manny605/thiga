import { supabase } from './supabaseClient'
import { avatarUrl } from './avatar'

// ── Utilisateurs ──────────────────────────────────────────────────────

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, city, status, avatar_path, created_at, worker_profiles(trade, verified), employer_profiles(verified)')
    .in('role', ['worker', 'employer'])
    .order('created_at', { ascending: false })
  if (error) throw error

  return (data || []).map((row) => ({
    id: row.id,
    name: row.full_name,
    avatarPath: row.avatar_path || null,
    avatar: avatarUrl(row.avatar_path),
    role: row.role,
    trade: row.worker_profiles?.trade || null,
    city: row.city,
    status: row.status,
    verified: row.role === 'worker' ? !!row.worker_profiles?.verified : !!row.employer_profiles?.verified,
    joined: row.created_at ? row.created_at.slice(0, 10) : '',
  }))
}

export async function setUserStatus(profileId, status) {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', profileId)
  if (error) throw error
}

export async function setUserVerified(profileId, role, verified) {
  const table = role === 'worker' ? 'worker_profiles' : 'employer_profiles'
  const { error } = await supabase.from(table).update({ verified }).eq('profile_id', profileId)
  if (error) throw error
}

// ── Modération (annonces en attente + vérifications d'identité) ───────

export async function fetchModerationQueue() {
  const [{ data: jobs, error: jobsErr }, { data: reqs, error: reqsErr }] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, title, created_at, profiles(full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('verification_requests')
      .select('id, employer_id, document_path, created_at, profiles!verification_requests_employer_id_fkey(full_name, city, role)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])
  if (jobsErr) throw jobsErr
  if (reqsErr) throw reqsErr

  const jobItems = (jobs || []).map((j) => ({
    id: `job:${j.id}`,
    kind: 'job',
    label: j.title,
    by: j.profiles?.full_name || '',
    date: j.created_at ? j.created_at.slice(0, 10) : '',
    ref: j.id,
  }))

  const verifItems = (reqs || []).map((r) => ({
    id: `verification:${r.id}`,
    kind: 'profile',
    label: r.profiles?.full_name || '',
    by: r.profiles?.city || '',
    date: r.created_at ? r.created_at.slice(0, 10) : '',
    ref: r.id,
    profileId: r.employer_id,
    role: r.profiles?.role || 'employer',
    documentPath: r.document_path,
  }))

  return [...jobItems, ...verifItems].sort((a, b) => b.date.localeCompare(a.date))
}

export async function resolveJob(jobId, decision) {
  const { error } = await supabase
    .from('jobs')
    .update({ status: decision === 'approve' ? 'online' : 'closed' })
    .eq('id', jobId)
  if (error) throw error
}

/** Valide ou refuse une demande ; l'approbation pose le badge sur le profil du bon rôle. */
export async function resolveVerification(requestId, profileId, role, decision) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('verification_requests')
    .update({
      status: decision === 'approve' ? 'approved' : 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id,
    })
    .eq('id', requestId)
  if (error) throw error

  if (decision === 'approve') {
    const table = role === 'worker' ? 'worker_profiles' : 'employer_profiles'
    const { error: profErr } = await supabase.from(table).update({ verified: true }).eq('profile_id', profileId)
    if (profErr) throw profErr
  }
}

/** URL signée temporaire pour que l'admin consulte le document soumis. */
export async function getVerificationDocumentUrl(path) {
  const { data, error } = await supabase.storage.from('identity-documents').createSignedUrl(path, 300)
  if (error) throw error
  return data.signedUrl
}

// ── Signalements ────────────────────────────────────────────────────

export async function fetchReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('id, kind, reason, severity, created_at, job_id, worker_id, jobs(title), worker:worker_id(full_name, status)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
  if (error) throw error

  return (data || []).map((r) => ({
    id: r.id,
    target: r.kind === 'job' ? r.jobs?.title || '' : r.worker?.full_name || '',
    kind: r.kind,
    reason: r.reason,
    severity: r.severity,
    date: r.created_at ? r.created_at.slice(0, 10) : '',
    // Cibles du signalement : sans elles, l'admin ne pouvait que « classer »
    // un signalement, jamais agir sur ce qui était signalé.
    jobId: r.job_id,
    workerId: r.worker_id,
    workerSuspended: r.worker?.status === 'suspended',
  }))
}

export async function closeReport(reportId) {
  const { error } = await supabase.from('reports').update({ status: 'closed' }).eq('id', reportId)
  if (error) throw error
}

/**
 * Suppression d'une annonce par l'admin ; candidatures et signalements suivent
 * en cascade. Le `.select()` confirme la suppression : refusée par RLS, elle
 * renverrait zéro ligne sans erreur.
 */
export async function deleteJob(jobId) {
  const { data, error } = await supabase.from('jobs').delete().eq('id', jobId).select('id')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('delete refused')
}

// ── Vue d'ensemble ─────────────────────────────────────────────────

export async function fetchAdminStats() {
  const [{ count: users }, { count: pendingJobs }, { count: pendingVerifs }, { count: reports }, { count: matches }] =
    await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('verification_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('applications').select('id', { count: 'exact', head: true }),
    ])

  return {
    users: users || 0,
    pending: (pendingJobs || 0) + (pendingVerifs || 0),
    reports: reports || 0,
    matches: matches || 0,
  }
}
