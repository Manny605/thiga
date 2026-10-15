// THIGA — transmet un message de la page Contact par e-mail à la propriétaire.
//
// Appelée par la page Contact juste après le dépôt (submit_contact_message),
// avec l'identifiant du message. Elle ne reçoit aucun contenu : elle relit le
// message en base, l'envoie via Resend et date l'envoi (emailed_at). Un message
// n'est envoyé qu'une fois ; rappeler la fonction pour un message déjà parti
// ne fait rien. Ouverte aux visiteurs (clé anon) : au pire, elle déclenche
// l'envoi d'un message déjà déposé, lui-même limité par la base.
//
// Secrets : RESEND_API_KEY (obligatoire) ; CONTACT_TO (défaut : adresse de la
// propriétaire) ; CONTACT_FROM (défaut : expéditeur de test Resend, qui
// n'écrit qu'à l'adresse du compte Resend tant qu'aucun domaine n'est vérifié).
//
// Déploiement : supabase functions deploy contact-email --use-api

import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const SUBJECTS: Record<string, string> = {
  general: 'Question générale',
  account: 'Mon compte',
  job: 'Une annonce ou une candidature',
  partnership: 'Partenariat',
  other: 'Autre',
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })

  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) return json(503, { error: 'not_configured' })

  let id = ''
  try {
    id = String((await req.json()).id || '')
  } catch {
    return json(400, { error: 'invalid_body' })
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json(400, { error: 'invalid_id' })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Réserve le message : seul le premier appel le trouve non envoyé.
  const { data: m, error } = await admin
    .from('contact_messages')
    .update({ emailed_at: new Date().toISOString() })
    .eq('id', id)
    .is('emailed_at', null)
    .select('id, name, phone, email, subject, message, created_at')
    .maybeSingle()
  if (error) return json(500, { error: 'db_error' })
  if (!m) return json(200, { sent: false })

  const subject = SUBJECTS[m.subject] || m.subject
  const lines = [
    ['Nom', m.name],
    ['Téléphone', m.phone || '—'],
    ['E-mail', m.email || '—'],
    ['Sujet', subject],
  ]
  const when = new Date(m.created_at).toLocaleString('fr-FR', { timeZone: 'Africa/Nouakchott' })

  const text =
    `Nouveau message reçu sur THIGA le ${when}.\n\n` +
    lines.map(([k, v]) => `${k} : ${v}`).join('\n') +
    `\n\n${m.message}\n\n— Retrouvez-le dans l'espace admin, module Messages.`

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2a24;max-width:560px">
      <p style="margin:0 0 16px">Nouveau message reçu sur <strong>THIGA</strong> le ${escape(when)}.</p>
      <table style="border-collapse:collapse;margin-bottom:16px">
        ${lines
          .map(
            ([k, v]) =>
              `<tr><td style="padding:4px 16px 4px 0;color:#6b7280">${k}</td><td style="padding:4px 0"><strong>${escape(v)}</strong></td></tr>`
          )
          .join('')}
      </table>
      <div style="white-space:pre-line;background:#f6f3ec;border-radius:10px;padding:14px 16px;line-height:1.55">${escape(m.message)}</div>
      <p style="margin:16px 0 0;color:#6b7280;font-size:13px">Répondez directement à cet e-mail si l'expéditeur a laissé son adresse, ou appelez-le. Le message est aussi dans l'espace admin, module Messages.</p>
    </div>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('CONTACT_FROM') || 'THIGA <onboarding@resend.dev>',
      to: [Deno.env.get('CONTACT_TO') || 'fatouelbech38@gmail.com'],
      ...(m.email ? { reply_to: m.email } : {}),
      subject: `[THIGA] ${subject} — ${m.name}`,
      text,
      html,
    }),
  })

  if (!res.ok) {
    // Échec : on libère le message pour qu'un nouvel appel puisse le renvoyer.
    await admin.from('contact_messages').update({ emailed_at: null }).eq('id', m.id)
    return json(502, { error: 'send_failed', detail: (await res.text()).slice(0, 300) })
  }

  return json(200, { sent: true })
})
