import { supabase } from './supabaseClient'

const BUCKET = 'cv'
export const CV_MAX_BYTES = 5 * 1024 * 1024
export const CV_ACCEPT = 'application/pdf,image/png,image/jpeg'

/** Convention de chemin imposée par les policies : `<worker_id>/<fichier>`. */
function pathFor(workerId, file) {
  const safe = file.name.replace(/[^\w.\-]+/g, '-').slice(-80)
  return `${workerId}/${Date.now()}-${safe}`
}

/**
 * Dépose un CV et le rattache au profil.
 * L'ancien fichier n'est retiré que s'il ne sert plus : une candidature déjà
 * envoyée doit continuer d'ouvrir le CV que l'employeur a reçu.
 */
export async function uploadCv(workerId, file, previousPath) {
  const path = pathFor(workerId, file)

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type })
  if (upErr) throw upErr

  const { error: profErr } = await supabase
    .from('worker_profiles')
    .update({ cv_path: path, cv_name: file.name, cv_uploaded_at: new Date().toISOString() })
    .eq('profile_id', workerId)
  if (profErr) throw profErr

  if (previousPath && previousPath !== path) await removeUnusedFile(previousPath)

  return { path, name: file.name }
}

/** Détache le CV du profil ; le fichier ne part que s'il n'est plus référencé. */
export async function detachCv(workerId, path) {
  const { error } = await supabase
    .from('worker_profiles')
    .update({ cv_path: null, cv_name: null, cv_uploaded_at: null })
    .eq('profile_id', workerId)
  if (error) throw error

  if (path) await removeUnusedFile(path)
}

/** Supprime le fichier seulement si aucune candidature ne s'y rattache. */
async function removeUnusedFile(path) {
  const { count, error } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('cv_path', path)
  if (error) return
  if ((count || 0) > 0) return
  await supabase.storage.from(BUCKET).remove([path])
}

/** CV de référence du travailleur, pour le pré-remplissage du formulaire de candidature. */
export async function fetchMyCv(workerId) {
  const { data, error } = await supabase
    .from('worker_profiles')
    .select('cv_path, cv_name')
    .eq('profile_id', workerId)
    .maybeSingle()
  if (error) throw error
  return data?.cv_path ? { path: data.cv_path, name: data.cv_name || '' } : null
}

/** Dépose un CV pour une candidature précise, sans toucher au profil. */
export async function uploadApplicationCv(workerId, file) {
  const path = pathFor(workerId, file)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type })
  if (error) throw error
  return { path, name: file.name }
}

/** Lien de consultation temporaire (5 minutes), jamais d'URL publique. */
export async function getCvUrl(path) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300)
  if (error) throw error
  return data.signedUrl
}

/** Message d'erreur si le fichier ne convient pas, sinon null. */
export function describeCvProblem(file, t) {
  if (!file) return null
  if (file.size > CV_MAX_BYTES) return t('cv.errorTooLarge')
  if (!CV_ACCEPT.split(',').includes(file.type)) return t('cv.errorType')
  return null
}
