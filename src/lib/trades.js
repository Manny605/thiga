import { supabase } from './supabaseClient'

const SELECT = 'trade, enabled, label_fr, label_ar, icon, sort_order'

function mapTrade(row) {
  return {
    id: row.trade,
    enabled: row.enabled,
    labelFr: row.label_fr,
    labelAr: row.label_ar,
    icon: row.icon || 'Boxes',
    sortOrder: row.sort_order,
  }
}

/**
 * Identifiant technique dérivé du libellé français.
 * Doit satisfaire la contrainte `trade_settings_trade_slug` : minuscules,
 * chiffres et tirets simples. Un libellé sans caractère latin (arabe seul)
 * ne produit rien d'exploitable — d'où le repli horodaté.
 */
export function slugify(label) {
  const slug = (label || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || `metier-${Date.now().toString(36)}`
}

export async function fetchTrades() {
  const { data, error } = await supabase
    .from('trade_settings')
    .select(SELECT)
    .order('sort_order', { ascending: true })
    .order('label_fr', { ascending: true })
  if (error) throw error
  return (data || []).map(mapTrade)
}

/**
 * Nombre d'annonces et de profils par métier.
 * Sert à l'administration : une catégorie encore portée par une ligne est
 * refusée à la suppression par la clé étrangère, autant le dire avant.
 *
 * Le décompte se fait ici, sur les identifiants rapatriés — donc plafonné à
 * la limite de lignes de l'API (1000 par défaut). Au-delà, il faudra passer
 * par une vue `group by` côté base.
 */
export async function fetchTradeUsage() {
  const [workers, jobs] = await Promise.all([
    supabase.from('worker_profiles').select('trade'),
    supabase.from('jobs').select('trade'),
  ])
  if (workers.error) throw workers.error
  if (jobs.error) throw jobs.error

  const usage = {}
  const bump = (trade, key) => {
    if (!usage[trade]) usage[trade] = { workers: 0, jobs: 0 }
    usage[trade][key] += 1
  }
  for (const w of workers.data || []) bump(w.trade, 'workers')
  for (const j of jobs.data || []) bump(j.trade, 'jobs')
  return usage
}

export async function createTrade({ id, labelFr, labelAr, icon, sortOrder }) {
  const { data, error } = await supabase
    .from('trade_settings')
    .insert({
      trade: id,
      label_fr: labelFr,
      label_ar: labelAr || labelFr,
      icon: icon || 'Boxes',
      sort_order: sortOrder ?? 100,
      enabled: true,
    })
    .select(SELECT)
    .single()
  if (error) throw error
  return mapTrade(data)
}

export async function updateTrade(id, patch) {
  const { data, error } = await supabase
    .from('trade_settings')
    .update({
      label_fr: patch.labelFr,
      label_ar: patch.labelAr || patch.labelFr,
      icon: patch.icon || 'Boxes',
    })
    .eq('trade', id)
    .select(SELECT)
    .single()
  if (error) throw error
  return mapTrade(data)
}

export async function setTradeEnabled(id, enabled) {
  const { data, error } = await supabase
    .from('trade_settings')
    .update({ enabled })
    .eq('trade', id)
    .select('trade')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('update refused')
}

/**
 * Suppression. Deux refus possibles, distingués par l'appelant :
 * - 23503 : la catégorie est encore portée par une annonce ou un profil ;
 * - zéro ligne : la policy a refusé (cas de 'autre', jamais supprimable).
 */
export async function deleteTrade(id) {
  const { data, error } = await supabase
    .from('trade_settings')
    .delete()
    .eq('trade', id)
    .select('trade')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('delete refused')
}
