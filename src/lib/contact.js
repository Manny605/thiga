import { supabase } from './supabaseClient'

/**
 * Numéros lisibles par le compte connecté, indexés par identifiant de profil.
 * La policy ne renvoie que ceux auxquels il a droit (lui-même, ou l'autre
 * partie d'une candidature présélectionnée) : un identifiant absent du
 * résultat n'est donc pas une erreur.
 */
export async function fetchContacts(profileIds) {
  const ids = [...new Set(profileIds.filter(Boolean))]
  if (ids.length === 0) return {}
  const { data, error } = await supabase.from('private_contact').select('profile_id, phone').in('profile_id', ids)
  if (error) throw error
  return Object.fromEntries((data || []).filter((r) => r.phone).map((r) => [r.profile_id, r.phone]))
}

/**
 * Numéro au format international sans signe, pour wa.me et tel:.
 * Un numéro mauritanien saisi sans indicatif (8 chiffres) reçoit le 222.
 */
export function internationalDigits(phone) {
  const digits = String(phone || '').replace(/\D/g, '').replace(/^00/, '')
  return digits.length === 8 ? `222${digits}` : digits
}

/** Numéro mauritanien : 8 chiffres, commençant par 2, 3 ou 4 (mobiles et fixes). */
export function isValidMrPhone(digits) {
  return /^[234]\d{7}$/.test(digits)
}

/** « 22123456 » → « +222 22 12 34 56 », la forme enregistrée et affichée. */
export function formatMrPhone(digits) {
  return `+222 ${digits.replace(/(\d{2})(?=\d)/g, '$1 ')}`
}
