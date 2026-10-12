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

  // E-mails (auth.users, via une fonction réservée à l'admin) et téléphones
  // (private_contact, lisible par l'admin) : deux requêtes pour toute la liste.
  const [emails, contacts] = await Promise.all([
    supabase.rpc('admin_user_emails'),
    supabase.from('private_contact').select('profile_id, phone'),
  ])
  const emailOf = Object.fromEntries((emails.data || []).map((r) => [r.id, r.email]))
  const phoneOf = Object.fromEntries((contacts.data || []).map((r) => [r.profile_id, r.phone]))

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
    email: emailOf[row.id] || '',
    phone: phoneOf[row.id] || '',
  }))
}

/**
 * Les fonctions Edge revérifient la session côté serveur. Si elle a été
 * révoquée (déconnexion depuis un autre appareil, par exemple), le jeton du
 * navigateur reste lisible pour les pages mais la fonction répond
 * « unauthenticated » : on ferme alors la session locale, et la garde des
 * espaces renvoie vers la connexion au lieu de laisser un message obscur.
 */
async function endRevokedSession(body) {
  if (body?.error === 'unauthenticated') await supabase.auth.signOut({ scope: 'local' })
}

/**
 * Suppression définitive d'un compte : fonction Edge `admin-delete-user`,
 * seule à détenir la clé de service. Elle revérifie que l'appelant est admin,
 * efface les fichiers du compte puis le compte (le reste suit en cascade).
 */
export async function deleteUserAccount(userId) {
  const { data, error } = await supabase.functions.invoke('admin-delete-user', { body: { userId } })
  if (error) {
    // Réponse d'erreur de la fonction : on remonte sa raison plutôt qu'un message générique.
    const body = await error.context?.json?.().catch(() => null)
    await endRevokedSession(body)
    throw new Error(body?.detail || body?.error || error.message)
  }
  if (!data?.ok) throw new Error(data?.error || 'delete failed')
  return data
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
export async function resolveVerification(requestId, profileId, role, decision, { reason = null, note = '' } = {}) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('verification_requests')
    .update({
      status: decision === 'approve' ? 'approved' : 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id,
      // Motif et précision n'ont de sens qu'en cas de refus.
      reject_reason: decision === 'approve' ? null : reason,
      review_note: decision === 'approve' ? null : note.trim() || null,
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

/**
 * Signalements ouverts (`open`) ou traités (`closed`), avec le déclarant,
 * sa précision et, une fois traités, la décision prise.
 */
export async function fetchReports(status = 'open') {
  const { data, error } = await supabase
    .from('reports')
    .select(
      'id, kind, reason, severity, details, status, resolution, admin_note, created_at, resolved_at, job_id, worker_id, ' +
      'jobs(title, status), worker:worker_id(full_name, status, role), reporter:reporter_id(full_name)'
    )
    .eq('status', status)
    .order(status === 'open' ? 'created_at' : 'resolved_at', { ascending: false })
    .limit(status === 'open' ? 500 : 100)
  if (error) throw error

  return (data || []).map((r) => ({
    id: r.id,
    target: r.kind === 'job' ? r.jobs?.title || '' : r.worker?.full_name || '',
    kind: r.kind,
    reason: r.reason,
    severity: r.severity,
    details: r.details || '',
    reporter: r.reporter?.full_name || '',
    date: r.created_at ? r.created_at.slice(0, 10) : '',
    resolution: r.resolution,
    adminNote: r.admin_note || '',
    resolvedAt: r.resolved_at ? r.resolved_at.slice(0, 10) : '',
    // Cibles du signalement : sans elles, l'admin ne pouvait que « classer »
    // un signalement, jamais agir sur ce qui était signalé.
    jobId: r.job_id,
    jobOnline: r.jobs?.status === 'online',
    workerId: r.worker_id,
    workerSuspended: r.worker?.status === 'suspended',
  }))
}

/**
 * Clôt un ou plusieurs signalements d'une même cible en traçant la décision :
 * `dismissed` (sans suite), `content_removed` (annonce retirée) ou
 * `account_suspended` (compte suspendu), avec une note interne facultative.
 */
export async function closeReports(reportIds, { resolution = 'dismissed', note = '' } = {}) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('reports')
    .update({
      status: 'closed',
      resolution,
      admin_note: note.trim() || null,
      resolved_at: new Date().toISOString(),
      resolved_by: user?.id,
    })
    .in('id', reportIds)
  if (error) throw error
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

// ── Fiche d'un utilisateur ─────────────────────────────────────────────

/**
 * Tout ce que l'admin doit voir d'un compte, quel que soit son rôle ou son
 * statut : identité, contact privé, profil métier, annonces ou candidatures,
 * dernière demande de vérification. Les policies réservent ces lectures à l'admin.
 */
export async function fetchUserDetail(id) {
  const [profile, contact, email, worker, employer, verification] = await Promise.all([
    supabase.from('profiles').select('id, role, full_name, city, status, avatar_path, created_at').eq('id', id).maybeSingle(),
    supabase.from('private_contact').select('phone').eq('profile_id', id).maybeSingle(),
    supabase.rpc('admin_user_email', { p_user: id }),
    supabase
      .from('worker_profiles')
      .select('trade, district, years, availability, rate, unit, langs, skills, bio, verified, refs, cv_path, cv_name, last_active')
      .eq('profile_id', id)
      .maybeSingle(),
    supabase.from('employer_profiles').select('employer_type, verified').eq('profile_id', id).maybeSingle(),
    supabase
      .from('verification_requests')
      .select('id, status, document_path, note, reject_reason, review_note, created_at, reviewed_at')
      .eq('employer_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  if (profile.error) throw profile.error
  if (!profile.data) return null
  const p = profile.data

  // Activité : annonces publiées (employeur) ou candidatures envoyées (travailleur).
  let jobs = []
  let applications = []
  if (p.role === 'employer') {
    const { data } = await supabase
      .from('jobs')
      .select('id, title, status, created_at, deadline, applications(count)')
      .eq('employer_id', id)
      .order('created_at', { ascending: false })
    jobs = (data || []).map((j) => ({
      id: j.id,
      title: j.title,
      status: j.status,
      date: j.created_at.slice(0, 10),
      deadline: j.deadline || '',
      appsCount: j.applications?.[0]?.count || 0,
    }))
  } else if (p.role === 'worker') {
    const { data } = await supabase
      .from('applications')
      .select('id, status, created_at, job_id, jobs(title, profiles(full_name))')
      .eq('worker_id', id)
      .order('created_at', { ascending: false })
    applications = (data || []).map((a) => ({
      id: a.id,
      status: a.status,
      date: a.created_at.slice(0, 10),
      jobId: a.job_id,
      jobTitle: a.jobs?.title || '',
      employer: a.jobs?.profiles?.full_name || '',
    }))
  }

  const w = worker.data
  return {
    id: p.id,
    role: p.role,
    name: p.full_name,
    city: p.city || '',
    status: p.status,
    avatarPath: p.avatar_path || null,
    avatar: avatarUrl(p.avatar_path),
    joined: p.created_at.slice(0, 10),
    email: email.data || '',
    phone: contact.data?.phone || '',
    verified: p.role === 'worker' ? !!w?.verified : !!employer.data?.verified,
    worker: w
      ? {
          trade: w.trade,
          district: w.district || '',
          years: w.years,
          availability: w.availability,
          rate: w.rate,
          unit: w.unit,
          langs: w.langs || [],
          skills: w.skills || [],
          bio: w.bio || '',
          refs: w.refs,
          cvPath: w.cv_path || null,
          cvName: w.cv_name || '',
          lastActive: w.last_active ? w.last_active.slice(0, 10) : '',
        }
      : null,
    employerType: employer.data?.employer_type || '',
    verification: verification.data
      ? {
          id: verification.data.id,
          status: verification.data.status,
          documentPath: verification.data.document_path,
          note: verification.data.note || '',
          rejectReason: verification.data.reject_reason || null,
          reviewNote: verification.data.review_note || '',
          date: verification.data.created_at.slice(0, 10),
        }
      : null,
    jobs,
    applications,
  }
}

// ── Accès au compte (dépannage) ────────────────────────────────────────

/**
 * Mot de passe temporaire généré côté serveur (fonction Edge
 * `admin-set-password`), renvoyé une seule fois pour être dicté à l'utilisateur.
 * Le compte devra en choisir un nouveau à sa prochaine connexion.
 */
export async function setTemporaryPassword(userId) {
  const { data, error } = await supabase.functions.invoke('admin-set-password', { body: { userId } })
  if (error) {
    const body = await error.context?.json?.().catch(() => null)
    await endRevokedSession(body)
    throw new Error(body?.detail || body?.error || error.message)
  }
  if (!data?.password) throw new Error(data?.error || 'no password')
  return data.password
}

/**
 * Demandes de réinitialisation déposées depuis « Mot de passe oublié ? ».
 * Pour chaque compte retrouvé, le numéro enregistré est joint : c'est à lui,
 * et à lui seul, que l'admin transmet le mot de passe temporaire.
 */
export async function fetchResetRequests(status = 'pending') {
  const { data, error } = await supabase
    .from('password_reset_requests')
    .select('id, phone, email, matched_profile_id, phone_matches, status, admin_note, created_at, resolved_at, profile:matched_profile_id(full_name, role, status)')
    .eq('status', status)
    .order('created_at', { ascending: status === 'pending' })
    .limit(200)
  if (error) throw error

  const ids = [...new Set((data || []).map((r) => r.matched_profile_id).filter(Boolean))]
  const phones = {}
  if (ids.length) {
    const { data: contacts } = await supabase.from('private_contact').select('profile_id, phone').in('profile_id', ids)
    for (const c of contacts || []) phones[c.profile_id] = c.phone
  }

  return (data || []).map((r) => ({
    id: r.id,
    phone: r.phone,
    email: r.email || '',
    profileId: r.matched_profile_id,
    name: r.profile?.full_name || '',
    role: r.profile?.role || '',
    suspended: r.profile?.status === 'suspended',
    registeredPhone: r.matched_profile_id ? phones[r.matched_profile_id] || '' : '',
    phoneMatches: r.phone_matches,
    status: r.status,
    adminNote: r.admin_note || '',
    date: r.created_at.slice(0, 10),
    time: r.created_at.slice(11, 16),
    resolvedAt: r.resolved_at ? r.resolved_at.slice(0, 10) : '',
  }))
}

/** Clôt une demande : `done` (mot de passe transmis) ou `rejected`, avec note interne. */
export async function resolveResetRequest(id, status, note = '') {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('password_reset_requests')
    .update({ status, admin_note: note.trim() || null, resolved_at: new Date().toISOString(), resolved_by: user?.id })
    .eq('id', id)
  if (error) throw error
}
