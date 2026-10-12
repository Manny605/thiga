// THIGA — suppression définitive d'un compte, réservée à l'admin.
//
// Supprimer un utilisateur demande la clé de service, qui ne doit jamais
// atteindre le navigateur : la page admin appelle cette fonction, qui vérifie
// elle-même que l'appelant est admin avant d'agir.
//
// Effacer l'utilisateur dans auth.users emporte en cascade son profil, ses
// annonces, candidatures, avis, contacts, signalements et notifications. Les
// fichiers du stockage, eux, ne suivent pas : on les retire d'abord.
//
// Déploiement : supabase functions deploy admin-delete-user --use-api

import { createClient } from 'npm:@supabase/supabase-js@2'

const BUCKETS = ['avatars', 'cv', 'identity-documents']

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })

  const url = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── l'appelant : session valide et rôle admin ──
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  const { data: caller, error: callerErr } = await admin.auth.getUser(token)
  if (callerErr || !caller.user) return json(401, { error: 'unauthenticated' })

  const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', caller.user.id).maybeSingle()
  if (callerProfile?.role !== 'admin') return json(403, { error: 'forbidden' })

  // ── la cible : un employeur ou un travailleur, jamais un admin ni soi-même ──
  let userId = ''
  try {
    userId = String((await req.json()).userId || '')
  } catch {
    return json(400, { error: 'invalid_body' })
  }
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return json(400, { error: 'invalid_user' })
  if (userId === caller.user.id) return json(400, { error: 'cannot_delete_self' })

  const { data: target } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle()
  if (!target) return json(404, { error: 'not_found' })
  if (target.role === 'admin') return json(400, { error: 'cannot_delete_admin' })

  // ── fichiers : chaque compte range les siens dans un dossier à son identifiant ──
  let filesRemoved = 0
  for (const bucket of BUCKETS) {
    const { data: files } = await admin.storage.from(bucket).list(userId, { limit: 1000 })
    const paths = (files || []).map((f) => `${userId}/${f.name}`)
    if (paths.length) {
      const { error } = await admin.storage.from(bucket).remove(paths)
      if (!error) filesRemoved += paths.length
    }
  }

  // ── le compte, et tout ce qui en dépend par cascade ──
  const { error: deleteErr } = await admin.auth.admin.deleteUser(userId)
  if (deleteErr) return json(500, { error: 'delete_failed', detail: deleteErr.message })

  return json(200, { ok: true, filesRemoved })
})
