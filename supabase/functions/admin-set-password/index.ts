// THIGA — mot de passe temporaire défini par l'admin.
//
// Pour l'utilisateur qui a perdu l'accès à son e-mail : l'admin génère un mot
// de passe provisoire, facile à dicter au téléphone, et le lui transmet. Le
// compte est marqué `must_change_password` : à sa prochaine connexion,
// l'application l'oblige à choisir le sien.
//
// Le mot de passe est généré ici, côté serveur, et renvoyé une seule fois.
//
// Déploiement : supabase functions deploy admin-set-password --use-api

import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

// Sans lettres ni chiffres ambigus à l'oral ou à l'écrit (l/1, o/0, i…).
const LETTERS = 'abcdefghjkmnpqrstuvwxyz'
const DIGITS = '23456789'

/** « kmrtp-48297 » : cinq lettres, cinq chiffres, tirés au hasard cryptographique. */
function temporaryPassword() {
  const pick = (alphabet: string, n: number) => {
    const bytes = crypto.getRandomValues(new Uint32Array(n))
    return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
  }
  return `${pick(LETTERS, 5)}-${pick(DIGITS, 5)}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── l'appelant : session valide et rôle admin ──
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  const { data: caller, error: callerErr } = await admin.auth.getUser(token)
  if (callerErr || !caller.user) return json(401, { error: 'unauthenticated' })
  const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', caller.user.id).maybeSingle()
  if (callerProfile?.role !== 'admin') return json(403, { error: 'forbidden' })

  // ── la cible : employeur ou travailleur ; l'admin change le sien dans ses paramètres ──
  let userId = ''
  try {
    userId = String((await req.json()).userId || '')
  } catch {
    return json(400, { error: 'invalid_body' })
  }
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return json(400, { error: 'invalid_user' })

  const { data: target } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle()
  if (!target) return json(404, { error: 'not_found' })
  if (target.role === 'admin') return json(400, { error: 'cannot_reset_admin' })

  const { data: existing, error: getErr } = await admin.auth.admin.getUserById(userId)
  if (getErr || !existing.user) return json(404, { error: 'not_found' })

  const password = temporaryPassword()
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password,
    // Fusion explicite : les métadonnées existantes (rôle, nom…) sont conservées.
    user_metadata: { ...existing.user.user_metadata, must_change_password: true },
  })
  if (error) return json(500, { error: 'update_failed', detail: error.message })

  return json(200, { ok: true, password })
})
