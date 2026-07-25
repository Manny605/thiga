// Monte puis démonte chaque route dans un DOM jsdom.
// Contrairement à un rendu serveur, les effets s'exécutent réellement :
// c'est ce qui permet d'attraper les erreurs de nettoyage au démontage.
import { JSDOM } from 'jsdom'

const ROUTES = [
  '/', '/offres', '/offres/j1', '/offres/inexistant',
  '/travailleurs', '/travailleurs/w5', '/travailleurs/zzz',
  '/connexion', '/inscription', '/contact', '/a-propos', '/page-absente',
  '/tableau-de-bord/employeur', '/tableau-de-bord/travailleur',
  '/admin', '/admin/utilisateurs', '/admin/moderation',
  '/admin/signalements', '/admin/categories',
]

// `localstorage-file` : avertissement de jsdom émis au premier accès au
// stockage local (client Supabase, état « lu » des notifications). Il tombe
// sur la première route montée, quelle qu'elle soit, et ne vient pas de React.
const IGNORE = /not wrapped in act|ReactDOMTestUtils\.act|deprecated|localstorage-file/i

async function main() {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
  })

  for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node',
                   'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'MutationObserver']) {
    // navigator est en lecture seule sur Node 22 : on passe par defineProperty
    Object.defineProperty(globalThis, k, { value: dom.window[k], writable: true, configurable: true })
  }
  globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  dom.window.scrollTo = () => {}   // non implémenté par jsdom
  dom.window.scrollY = 0

  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = await import('react-dom/test-utils')
  const { default: App } = await import('../src/App.jsx')

  let fail = 0

  for (const route of ROUTES) {
    dom.window.history.pushState({}, '', route)
    const host = dom.window.document.getElementById('root')

    const problems = []
    const origErr = console.error
    console.error = (...a) => { problems.push(String(a[0])) }

    try {
      const root = createRoot(host)
      await act(async () => { root.render(React.createElement(App)) })
      const html = host.innerHTML
      await act(async () => { root.unmount() })
      console.error = origErr

      const real = problems.filter((p) => !IGNORE.test(p))
      if (real.length) {
        fail++
        console.log(`ECHEC ${route}\n      ${real[0].split('\n')[0].slice(0, 150)}`)
      } else if (html.length < 300) {
        fail++
        console.log(`ECHEC ${route} → rendu quasi vide (${html.length} car.)`)
      } else {
        console.log(`ok    ${route.padEnd(30)} ${String(html.length).padStart(7)} car.`)
      }
    } catch (e) {
      console.error = origErr
      fail++
      console.log(`ECHEC ${route} → ${e.message.split('\n')[0]}`)
    }
  }

  console.log(fail === 0
    ? `\n${ROUTES.length} routes montées et démontées sans erreur ni avertissement React.`
    : `\n${fail} route(s) en echec.`)
  process.exit(fail === 0 ? 0 : 1)
}

main()
