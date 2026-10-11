// Donne une photo de profil illustrée aux comptes de démonstration (@thigha.mr).
// Portraits stylisés générés en SVG puis rastérisés en WebP 512 px avec sharp :
// pas de faux visages de vraies personnes. Les vrais comptes ne sont jamais
// touchés, ni un compte de démo qui a déjà choisi sa photo (sauf --force).
//
// Nécessite la migration 20260726120000_avatars.sql et SUPABASE_SERVICE_ROLE_KEY.
//
// Usage : node scripts/seed-avatars.mjs                  (envoi)
//         node scripts/seed-avatars.mjs --preview <dir>  (PNG locaux, rien n'est envoyé)
//         node scripts/seed-avatars.mjs --force          (remplace les photos existantes)

process.loadEnvFile('.env.local')

import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const DEMO_DOMAIN = '@thigha.mr'
const args = process.argv.slice(2)
const previewDir = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null
const force = args.includes('--force')

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) throw new Error('VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquantes dans .env.local')

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

// ── palette (tailwind.config.js) ──────────────────────────────────────
const BACKGROUNDS = ['#E6EFE9', '#EFE8DB', '#F4F4F5', '#C2DBCC']
const CLOTHES = ['#004B2B', '#A18253', '#27272A', '#005332', '#7C6340', '#003A21']
const FABRICS = ['#004B2B', '#A78B60', '#7C6340', '#005332', '#52525B', '#8BBAA0']
const SKINS = ['#8D5A3B', '#6B4229', '#A86F4C', '#5A3722', '#B98160', '#7A4B30']
const HAIR = '#1C1714'

/** Hachage stable : un même compte garde la même illustration à chaque exécution. */
function hash(str) {
  let h = 2166136261
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}
const pick = (list, h, salt) => list[(h >>> salt) % list.length]

/** Étoile à huit branches du site, en filigrane. */
function star(cx, cy, r, color, opacity) {
  const sq = (rot) =>
    `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" transform="rotate(${rot} ${cx} ${cy})" />`
  return `<g fill="none" stroke="${color}" stroke-width="6" opacity="${opacity}">${sq(0)}${sq(45)}</g>`
}

const HEADWEAR = {
  short: (c) => `<path d="M178 226 C172 150 214 128 256 128 C298 128 340 150 334 226 C326 186 298 170 256 170 C214 170 186 186 178 226 Z" fill="${HAIR}" />`,
  curly: () => `<g fill="${HAIR}">${[
    [196, 176], [224, 152], [256, 144], [288, 152], [316, 176], [182, 206], [330, 206],
  ].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="30" />`).join('')}</g>`,
  // Chèche : bandes enroulées sur le haut de la tête.
  chech: (c) => `
    <path d="M170 222 C164 140 214 116 256 116 C298 116 348 140 342 222 C320 196 290 186 256 186 C222 186 192 196 170 222 Z" fill="${c.fabric}" />
    <path d="M178 176 C220 154 292 154 334 176" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="8" fill="none" />
    <path d="M172 204 C216 180 296 180 340 204" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="8" fill="none" />`,
  // Voile : l'étoffe encadre le visage et retombe sur les épaules (dessinée derrière).
  veil: (c) => `
    <path d="M150 512 C142 420 150 300 162 236 C174 150 214 116 256 116 C298 116 338 150 350 236 C362 300 370 420 362 512 Z" fill="${c.fabric}" />`,
}

function workerSvg(seed) {
  const h = hash(seed)
  const c = {
    bg: pick(BACKGROUNDS, h, 0),
    clothes: pick(CLOTHES, h, 3),
    fabric: pick(FABRICS, h, 7),
    skin: pick(SKINS, h, 11),
  }
  const style = pick(Object.keys(HEADWEAR), h, 15)
  const behind = style === 'veil' ? HEADWEAR.veil(c) : ''
  const above = style === 'veil'
    ? `<path d="M176 230 C170 160 214 140 256 140 C298 140 342 160 336 230 C318 196 292 184 256 184 C220 184 194 196 176 230 Z" fill="${c.fabric}" />`
    : HEADWEAR[style](c)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${c.bg}" />
  ${star(256, 230, 150, '#004B2B', 0.06)}
  ${behind}
  <path d="M84 512 C84 402 166 346 256 346 C346 346 428 402 428 512 Z" fill="${c.clothes}" />
  <path d="M222 300 h68 v62 c0 20 -68 20 -68 0 Z" fill="${c.skin}" />
  <path d="M222 330 c20 14 48 14 68 0 v14 c-20 14 -48 14 -68 0 Z" fill="#000000" opacity="0.12" />
  <ellipse cx="256" cy="236" rx="80" ry="94" fill="${c.skin}" />
  ${above}
</svg>`
}

const EMBLEMS = {
  // Maison : particuliers et familles.
  Particulier: `<path d="M256 150 L370 246 V362 H142 V246 Z" fill="none" stroke="#FFFFFF" stroke-width="16" stroke-linejoin="round" />
    <rect x="228" y="292" width="56" height="70" fill="#A78B60" />`,
  // Immeuble : entreprises et agences.
  Entreprise: `<rect x="176" y="146" width="160" height="216" fill="none" stroke="#FFFFFF" stroke-width="16" stroke-linejoin="round" />
    <g fill="#A78B60">${[0, 1, 2].flatMap((row) => [0, 1].map((col) =>
      `<rect x="${206 + col * 64}" y="${178 + row * 52}" width="36" height="30" />`)).join('')}</g>`,
}

function employerSvg(seed, type) {
  const h = hash(seed)
  const bg = pick(['#004B2B', '#003A21', '#005332', '#27272A'], h, 0)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${bg}" />
  ${star(256, 256, 176, '#A78B60', 0.22)}
  ${EMBLEMS[type] || EMBLEMS.Particulier}
</svg>`
}

// ── comptes de démo ───────────────────────────────────────────────────
const { data: { users }, error: usersErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
if (usersErr) throw usersErr
const demo = users.filter((u) => u.email?.endsWith(DEMO_DOMAIN))

const { data: profiles, error: profErr } = await admin
  .from('profiles')
  .select('id, role, full_name, avatar_path, employer_profiles(employer_type)')
  .in('id', demo.map((u) => u.id))
  .in('role', ['worker', 'employer'])
if (profErr) throw profErr

if (previewDir) await mkdir(previewDir, { recursive: true })
const emailOf = Object.fromEntries(demo.map((u) => [u.id, u.email]))
let done = 0

for (const p of profiles.sort((a, b) => emailOf[a.id].localeCompare(emailOf[b.id]))) {
  const email = emailOf[p.id]
  if (p.avatar_path && !force && !previewDir) {
    console.log(`– ${email.padEnd(28)} a déjà une photo, ignoré`)
    continue
  }

  const svg = p.role === 'worker'
    ? workerSvg(p.id)
    : employerSvg(p.id, p.employer_profiles?.employer_type)

  if (previewDir) {
    await writeFile(path.join(previewDir, `${email.split('@')[0]}.png`), await sharp(Buffer.from(svg)).resize(256).png().toBuffer())
    done++
    continue
  }

  const webp = await sharp(Buffer.from(svg)).resize(512).webp({ quality: 88 }).toBuffer()
  const objectPath = `${p.id}/${Date.now()}.webp`

  const { error: upErr } = await admin.storage
    .from('avatars')
    .upload(objectPath, webp, { contentType: 'image/webp', cacheControl: '31536000', upsert: false })
  if (upErr) {
    console.error(`✗ ${email} — envoi : ${upErr.message}`)
    continue
  }

  const { error: updErr } = await admin.from('profiles').update({ avatar_path: objectPath }).eq('id', p.id)
  if (updErr) {
    await admin.storage.from('avatars').remove([objectPath])
    console.error(`✗ ${email} — profil : ${updErr.message}`)
    continue
  }

  if (p.avatar_path) await admin.storage.from('avatars').remove([p.avatar_path])
  console.log(`✓ ${p.role.padEnd(8)} ${email.padEnd(28)} ${(webp.length / 1024).toFixed(1)} Ko`)
  done++
}

console.log(`\n${done} illustration(s) ${previewDir ? `écrite(s) dans ${previewDir}` : 'envoyée(s)'}.`)
