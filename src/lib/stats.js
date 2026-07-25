import { supabase } from './supabaseClient'

/**
 * Chiffres publics de la plateforme (page À propos).
 * Ils étaient jusqu'ici lus dans `data/mock.js` : des nombres inventés
 * présentés comme réels. Les compteurs ci-dessous suivent les policies RLS,
 * donc ne comptent que ce qu'un visiteur peut effectivement voir.
 */
export async function fetchPublicStats() {
  const [workers, offers, verified] = await Promise.all([
    supabase.from('worker_profiles').select('profile_id', { count: 'exact', head: true }),
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'online'),
    supabase.from('worker_profiles').select('profile_id', { count: 'exact', head: true }).eq('verified', true),
  ])

  if (workers.error) throw workers.error
  if (offers.error) throw offers.error
  if (verified.error) throw verified.error

  return {
    workers: workers.count || 0,
    offers: offers.count || 0,
    verified: verified.count || 0,
  }
}
