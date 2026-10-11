// Middleware Vercel : aperçus de partage (WhatsApp, Facebook, Telegram, X…).
//
// Ces robots ne lisent pas le JavaScript : sur une application monopage, ils ne
// verraient que le titre générique d'index.html. Pour eux seuls, on renvoie
// index.html avec le titre, la description et l'image de la page demandée.
// Les visiteurs humains passent sans détour : rien n'est ralenti pour eux.
//
// Les données viennent de l'API publique Supabase avec la clé anonyme : les
// policies RLS s'appliquent, donc une offre expirée ou un profil non vérifié
// reçoit l'aperçu générique, comme pour n'importe quel visiteur.
//
// Variables requises dans le projet Vercel (déjà nécessaires au build) :
// VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY.

export const config = {
  // Toutes les pages, sauf les fichiers (assets, images, index.html lui-même).
  matcher: ['/((?!assets/|.*\\.).*)'],
}

const BOTS = /facebookexternalhit|facebot|whatsapp|telegrambot|twitterbot|slackbot|discordbot|linkedinbot|skypeuripreview|pinterest|vkshare|embedly|googlebot|bingbot|applebot/i

const DEFAULT = {
  title: 'THIGA — Trouvez le bon profil, près de chez vous',
  description:
    'THIGA met en relation employeurs et travailleurs de services en Mauritanie : ménage, garde d’enfants, conduite, cuisine, électricité, plomberie, jardinage, sécurité.',
}

const escape = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const clip = (s, max) => {
  const text = String(s ?? '').replace(/\s+/g, ' ').trim()
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/** « nouakchott » → « Nouakchott » ; les villes sont stockées sous forme d'identifiant. */
const cityName = (id) => (id ? id.charAt(0).toUpperCase() + id.slice(1) : '')

async function api(path) {
  const base = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!base || !key) return null
  const res = await fetch(`${base}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  if (!res.ok) return null
  const rows = await res.json()
  return rows[0] || null
}

async function tradeLabel(id) {
  const row = await api(`trade_settings?trade=eq.${encodeURIComponent(id)}&select=label_fr`)
  return row?.label_fr || id
}

/** Métadonnées de la page demandée, ou null pour l'aperçu générique. */
async function metaFor(pathname, origin) {
  const job = pathname.match(/^\/offres\/([0-9a-f-]{36})$/i)
  if (job) {
    const row = await api(`jobs?id=eq.${job[1]}&select=title,city,district,salary,unit,description,trade,profiles(full_name)`)
    if (!row) return null
    const pay = row.salary ? ` · ${row.salary.toLocaleString('fr-FR')} MRU${row.unit === 'perDay' ? '/jour' : '/mois'}` : ''
    return {
      title: `${row.title} — ${cityName(row.city)}`,
      description: clip(`${await tradeLabel(row.trade)}${pay} · ${row.profiles?.full_name || ''}. ${row.description || ''}`, 200),
      type: 'article',
    }
  }

  const worker = pathname.match(/^\/travailleurs\/([0-9a-f-]{36})$/i)
  if (worker) {
    const row = await api(`worker_profiles?profile_id=eq.${worker[1]}&select=trade,years,bio,profiles(full_name,city,avatar_path)`)
    if (!row) return null
    const photo = row.profiles?.avatar_path
      ? `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${row.profiles.avatar_path}`
      : null
    return {
      title: `${row.profiles?.full_name || 'Profil'} — ${await tradeLabel(row.trade)}`,
      description: clip(`${cityName(row.profiles?.city)} · ${row.years || 0} ans d’expérience. ${row.bio || ''}`, 200),
      image: photo,
      type: 'profile',
    }
  }

  if (pathname === '/offres') return { title: 'Offres d’emploi — THIGA', description: DEFAULT.description }
  if (pathname === '/travailleurs') return { title: 'Travailleurs vérifiés — THIGA', description: DEFAULT.description }
  return null
}

export default async function middleware(request) {
  if (!BOTS.test(request.headers.get('user-agent') || '')) return undefined

  const url = new URL(request.url)
  const [page, meta] = await Promise.all([
    fetch(new URL('/index.html', url.origin)).then((r) => r.text()),
    metaFor(url.pathname, url.origin).catch(() => null),
  ])

  const m = { ...DEFAULT, type: 'website', ...meta }
  const image = m.image || `${url.origin}/icon-512.png`
  const tags = [
    `<title>${escape(m.title)}</title>`,
    `<meta name="description" content="${escape(m.description)}" />`,
    `<link rel="canonical" href="${escape(url.origin + url.pathname)}" />`,
    `<meta property="og:site_name" content="THIGA" />`,
    `<meta property="og:locale" content="fr_FR" />`,
    `<meta property="og:type" content="${m.type}" />`,
    `<meta property="og:title" content="${escape(m.title)}" />`,
    `<meta property="og:description" content="${escape(m.description)}" />`,
    `<meta property="og:url" content="${escape(url.origin + url.pathname)}" />`,
    `<meta property="og:image" content="${escape(image)}" />`,
    `<meta name="twitter:card" content="${m.image ? 'summary_large_image' : 'summary'}" />`,
  ].join('\n    ')

  // Les balises génériques d'index.html sont retirées puis remplacées.
  const html = page
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta (?:name="description"|property="og:[^"]+"|name="twitter:[^"]+")[^>]*>\s*/g, '')
    .replace('</head>', `    ${tags}\n  </head>`)

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=600' },
  })
}
