import { supabase } from './supabaseClient'

export async function fetchMyApplications(workerId) {
  const { data, error } = await supabase
    .from('applications')
    .select('id, status, created_at, job_id, jobs(title, city, profiles(full_name))')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false })
  if (error) throw error

  return (data || []).map((a) => ({
    id: a.id,
    status: a.status,
    date: a.created_at ? a.created_at.slice(0, 10) : '',
    jobId: a.job_id,
    jobTitle: a.jobs?.title || '',
    jobCity: a.jobs?.city || '',
    employer: a.jobs?.profiles?.full_name || '',
  }))
}

/**
 * Retrait d'une candidature par son auteur (policy `workers withdraw…`).
 * Voir `deleteJob` : une suppression refusée par RLS ne lève pas d'erreur,
 * elle ne renvoie aucune ligne — d'où le `.select()` de contrôle.
 */
export async function withdrawApplication(applicationId) {
  const { data, error } = await supabase
    .from('applications')
    .delete()
    .eq('id', applicationId)
    .select('id')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('delete refused')
}

export async function fetchMyWorkerProfile(workerId) {
  const { data, error } = await supabase
    .from('worker_profiles')
    .select(
      'trade, district, years, availability, rate, unit, langs, skills, bio, verified, refs, ' +
      'cv_path, cv_name, cv_uploaded_at, profiles(full_name, city)'
    )
    .eq('profile_id', workerId)
    .single()
  if (error) throw error

  return {
    trade: data.trade,
    district: data.district || '',
    years: data.years,
    availability: data.availability,
    rate: data.rate,
    unit: data.unit,
    langs: data.langs || [],
    skills: data.skills || [],
    bio: data.bio || '',
    verified: data.verified,
    refs: data.refs,
    cvPath: data.cv_path || null,
    cvName: data.cv_name || '',
    cvUploadedAt: data.cv_uploaded_at ? data.cv_uploaded_at.slice(0, 10) : '',
    name: data.profiles?.full_name || '',
    city: data.profiles?.city || '',
  }
}

export async function updateMyWorkerProfile(workerId, patch) {
  // `last_active` sert au tri « profils les plus récents » des pages publiques :
  // sans cette mise à jour, un profil fraîchement complété restait en fin de liste.
  const { error } = await supabase
    .from('worker_profiles')
    .update({ ...patch, last_active: new Date().toISOString() })
    .eq('profile_id', workerId)
  if (error) throw error
}

export async function fetchMySettings(workerId) {
  const [{ data: profile, error: profileErr }, { data: contact, error: contactErr }] = await Promise.all([
    supabase.from('profiles').select('full_name, city').eq('id', workerId).single(),
    supabase.from('private_contact').select('phone').eq('profile_id', workerId).maybeSingle(),
  ])
  if (profileErr) throw profileErr
  if (contactErr) throw contactErr

  return {
    fullName: profile.full_name,
    city: profile.city || '',
    phone: contact?.phone || '',
  }
}

export async function updateMySettings(workerId, patch) {
  const { error: profErr } = await supabase
    .from('profiles')
    .update({ full_name: patch.fullName, city: patch.city })
    .eq('id', workerId)
  if (profErr) throw profErr

  const { error: contactErr } = await supabase
    .from('private_contact')
    .upsert({ profile_id: workerId, phone: patch.phone })
  if (contactErr) throw contactErr
}
