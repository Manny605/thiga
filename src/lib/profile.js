import { supabase } from './supabaseClient'

/**
 * Profil du compte connecté : rôle et statut compris.
 * Partagé par AuthProvider (contexte global) et par la page de connexion,
 * qui a besoin du rôle avant que le contexte ne soit à jour pour rediriger.
 */
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, city, status, avatar_path')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}
