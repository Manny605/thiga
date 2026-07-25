// Peuple le projet Supabase avec les données de démonstration de src/data/mock.js.
// Nécessite la migration supabase/migrations/20260724190000_init.sql déjà appliquée,
// et SUPABASE_SERVICE_ROLE_KEY dans .env.local (jamais bundlée, usage local uniquement).
//
// Usage : node scripts/seed.mjs

process.loadEnvFile('.env.local')

import { createClient } from '@supabase/supabase-js'
import { WORKERS, JOBS } from '../src/data/mock.js'

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  throw new Error('VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquantes dans .env.local')
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PASSWORD = 'Password123!'

async function createAccount({ email, full_name, phone, city, role, trade }) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role, full_name, phone, city, trade },
  })
  if (error) {
    console.error(`✗ ${email} — ${error.message}`)
    return null
  }
  console.log(`✓ ${role.padEnd(8)} ${email}`)
  return data.user.id
}

// ── Employeurs (un compte par nom d'employeur unique dans JOBS) ────────
const employerNames = [...new Set(JOBS.map((j) => j.employer))]
const employerIds = {}

for (const [i, name] of employerNames.entries()) {
  const sample = JOBS.find((j) => j.employer === name)
  const id = await createAccount({
    email: `employeur${i + 1}@thiga.mr`,
    full_name: name,
    phone: `+222 45 00 00 ${String(i).padStart(2, '0')}`,
    city: sample.city,
    role: 'employer',
  })
  if (!id) continue
  employerIds[name] = id
  const { error } = await admin
    .from('employer_profiles')
    .update({ employer_type: sample.employerType, verified: sample.verified })
    .eq('profile_id', id)
  if (error) console.error(`  ✗ employer_profiles ${name} — ${error.message}`)
}

// ── Travailleurs ────────────────────────────────────────────────────────
const workerIds = {}

for (const [i, w] of WORKERS.entries()) {
  const id = await createAccount({
    email: `travailleur${i + 1}@thiga.mr`,
    full_name: w.name,
    phone: `+222 46 00 00 ${String(i).padStart(2, '0')}`,
    city: w.city,
    role: 'worker',
    trade: w.trade,
  })
  if (!id) continue
  workerIds[w.id] = id
  const { error } = await admin
    .from('worker_profiles')
    .update({
      district: w.district,
      years: w.years,
      availability: w.availability,
      rate: w.rate,
      unit: w.unit,
      langs: w.langs,
      skills: w.skills,
      bio: w.bio,
      verified: w.verified,
      refs: w.refs,
    })
    .eq('profile_id', id)
  if (error) console.error(`  ✗ worker_profiles ${w.name} — ${error.message}`)
}

// ── Offres ────────────────────────────────────────────────────────────
for (const j of JOBS) {
  const employer_id = employerIds[j.employer]
  if (!employer_id) continue
  const { error } = await admin.from('jobs').insert({
    employer_id,
    title: j.title,
    trade: j.trade,
    city: j.city,
    district: j.district,
    contract: j.contract,
    salary: j.salary,
    unit: j.unit,
    status: 'online',
    urgent: j.urgent,
    verified: j.verified,
    description: j.desc,
    duties: j.duties,
    reqs: j.reqs,
  })
  if (error) console.error(`✗ job "${j.title}" — ${error.message}`)
  else console.log(`✓ job      ${j.title}`)
}

console.log(`\nTerminé. Mot de passe de tous les comptes de démo : ${PASSWORD}`)
