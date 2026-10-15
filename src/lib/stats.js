import { supabase } from './supabaseClient'

/**
 * Chiffres publics de la plateforme (page À propos).
 * Ils étaient jusqu'ici lus dans `data/mock.js` : des nombres inventés
 * présentés comme réels. Les compteurs ci-dessous suivent les policies RLS,
 * donc ne comptent que ce qu'un visiteur peut effectivement voir.
 */
export async function fetchPublicStats() {
  // Les profils des travailleurs sont réservés aux employeurs : les deux
  // totaux passent par des fonctions qui ne renvoient qu'un nombre.
  const [workers, offers, verified] = await Promise.all([
    supabase.rpc('active_worker_count').then((r) => ({ error: r.error, count: r.data })),
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'online'),
    supabase.rpc('verified_worker_count').then((r) => ({ error: r.error, count: r.data })),
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
