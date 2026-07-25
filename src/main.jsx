import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ConfigError from './ConfigError'
import './index.css'

const root = createRoot(document.getElementById('root'))

// La configuration est contrôlée avant d'importer <App> : `supabaseClient.js`
// lève son exception pendant l'évaluation du module, donc un simple try/catch
// autour du rendu n'attraperait rien — l'import échouerait avant. D'où
// l'import dynamique, en `.then()` : la cible de build de Vite n'accepte pas
// l'`await` de premier niveau.
const missing = [
  ['VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL],
  ['VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY],
]
  .filter(([, value]) => !value)
  .map(([name]) => name)

if (missing.length > 0) {
  root.render(
    <StrictMode>
      <ConfigError missing={missing} />
    </StrictMode>
  )
} else {
  import('./App').then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    )
  })
}
