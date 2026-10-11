/**
 * Écran affiché quand la configuration Supabase manque au build.
 *
 * Sans lui, `supabaseClient.js` lève son exception pendant l'évaluation du
 * module : React ne monte jamais et la page reste blanche, sans rien indiquer.
 * Le cas se produit surtout en production, chez un hébergeur où les variables
 * n'ont pas été déclarées — ou déclarées après le build, Vite les inscrivant
 * dans le bundle au moment de la compilation.
 */
export default function ConfigError({ missing }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-50 px-5 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-sand-200 bg-white p-8 shadow-card">
        <p className="text-[12.5px] uppercase tracking-[0.14em] text-ocre-700">Configuration</p>
        <h1 className="mt-3 text-[24px] leading-tight">L’application n’est pas configurée</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          {missing.length > 1
            ? 'Ces variables d’environnement manquent au moment de la construction :'
            : 'Cette variable d’environnement manque au moment de la construction :'}
        </p>

        <ul className="mt-4 space-y-1.5">
          {missing.map((name) => (
            <li key={name} className="rounded-lg bg-sand-100 px-3 py-2 font-mono text-[13.5px] text-ink">
              {name}
            </li>
          ))}
        </ul>

        <div className="mt-6 border-t border-sand-200/70 pt-5 text-[14px] leading-relaxed text-ink-600">
          <p className="font-medium text-ink">En local</p>
          <p className="mt-1">
            Renseignez-les dans <span className="font-mono text-[13px]">.env.local</span>, puis relancez le serveur.
          </p>

          <p className="mt-4 font-medium text-ink">Chez l’hébergeur</p>
          <p className="mt-1">
            Déclarez-les dans les réglages du site, puis <strong>relancez un build</strong>. Vite inscrit ces
            valeurs dans le bundle au moment de la compilation : les ajouter sans reconstruire ne change rien.
          </p>
        </div>
      </div>
    </div>
  )
}
