import './setup-dom.js'

import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

import { I18nProvider } from './src/i18n/I18nProvider.jsx'
import Layout from './src/components/layout/Layout.jsx'
import Home from './src/pages/Home.jsx'
import Jobs from './src/pages/Jobs.jsx'
import JobDetail from './src/pages/JobDetail.jsx'
import Workers from './src/pages/Workers.jsx'
import WorkerDetail from './src/pages/WorkerDetail.jsx'
import Login from './src/pages/Login.jsx'
import Register from './src/pages/Register.jsx'
import Contact from './src/pages/Contact.jsx'
import About from './src/pages/About.jsx'
import NotFound from './src/pages/NotFound.jsx'
import EmployerDash from './src/pages/dash/EmployerDash.jsx'
import WorkerDash from './src/pages/dash/WorkerDash.jsx'
import AdminDash from './src/pages/dash/AdminDash.jsx'

const ROUTES = [
  ['/', Home, true],
  ['/offres', Jobs, true],
  ['/offres/j1', JobDetail, true],
  ['/offres/inexistant', JobDetail, true],
  ['/travailleurs', Workers, true],
  ['/travailleurs/w5', WorkerDetail, true],
  ['/connexion', Login, true],
  ['/inscription', Register, true],
  ['/contact', Contact, true],
  ['/a-propos', About, true],
  ['/introuvable', NotFound, true],
  ['/tableau-de-bord/employeur', EmployerDash, false],
  ['/tableau-de-bord/travailleur', WorkerDash, false],
  ['/admin', AdminDash, false],
]

// Toute erreur ou avertissement React fait échouer le test.
const problems = []
const say = console.error.bind(console)

// Bruit connu, sans rapport avec le code de l'app : dépréciation de l'utilitaire
// de test, et drapeaux d'avenir de React Router v7.
const IGNORE = ['ReactDOMTestUtils.act', 'React Router Future Flag']
const note = (a) => {
  const m = String(a)
  if (!IGNORE.some((x) => m.includes(x))) problems.push(m)
}
console.error = (...a) => note(a[0])
console.warn = (...a) => note(a[0])

const h = React.createElement
let fail = 0

for (const [path, Page, inLayout] of ROUTES) {
  const before = problems.length
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  const tree = h(
    I18nProvider, null,
    h(MemoryRouter, { initialEntries: [path] },
      h(Routes, null,
        inLayout
          ? h(Route, { element: h(Layout) }, h(Route, { path: '*', element: h(Page) }))
          : h(Route, { path: '*', element: h(Page) })))
  )

  await act(async () => { root.render(tree) })
  const size = container.innerHTML.length
  // Le démontage déclenche les fonctions de nettoyage des effets.
  await act(async () => { root.unmount() })
  container.remove()

  const news = [...new Set(problems.slice(before))]
  if (news.length) {
    fail++
    say(`ECHEC ${path}`)
    news.forEach((p) => say('       ' + p.split('\n')[0].slice(0, 120)))
  } else {
    say(`ok    ${path.padEnd(30)} ${String(size).padStart(6)} car.  monté + démonté`)
  }
}

say(fail === 0
  ? `\nAucune erreur ni avertissement React sur ${ROUTES.length} routes.`
  : `\n${fail} route(s) en echec.`)
process.exit(fail ? 1 : 0)
