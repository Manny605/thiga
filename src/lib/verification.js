import { supabase } from './supabaseClient'

/** Dernière demande de vérification d'identité de l'employeur connecté (ou null). */
export async function fetchMyVerification(employerId) {
  const { data, error } = await supabase
    .from('verification_requests')
    .select('id, status, note, reject_reason, review_note, created_at, reviewed_at')
    .eq('employer_id', employerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Upload du document dans le bucket privé, puis création de la demande. */
export async function submitVerification(employerId, file, note) {
  const path = `${employerId}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('identity-documents')
    .upload(path, file, { upsert: false })
  if (uploadError) throw uploadError

  const { error: insertError } = await supabase
    .from('verification_requests')
    .insert({ employer_id: employerId, document_path: path, note: note || null })
  if (insertError) throw insertError
}
