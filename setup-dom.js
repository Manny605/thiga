// Doit être importé en tout premier : installe le DOM avant que React ne charge.
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
})

global.window = dom.window
global.document = dom.window.document
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true })
global.HTMLElement = dom.window.HTMLElement
global.Element = dom.window.Element
global.Node = dom.window.Node
global.getComputedStyle = dom.window.getComputedStyle
global.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0)
global.cancelAnimationFrame = clearTimeout
global.IS_REACT_ACT_ENVIRONMENT = true

// jsdom n'implémente pas IntersectionObserver, utilisé par <Reveal>.
class FakeIO { observe() {} unobserve() {} disconnect() {} }
global.IntersectionObserver = FakeIO
dom.window.IntersectionObserver = FakeIO

// Reproduit le navigateur de l'utilisateur : scrollTo renvoie une valeur.
// Si un effet la laisse fuiter, React tentera de l'appeler au démontage.
dom.window.scrollTo = () => 'valeur-piege'

export default dom
