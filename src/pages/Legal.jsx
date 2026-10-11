import { useI18n } from '../i18n/I18nProvider'
import { LEGAL, LEGAL_UPDATED } from '../content/legal'
import PageHeader from '../components/layout/PageHeader'
import NotFound from './NotFound'
import { useDocumentMeta } from '../lib/useDocumentMeta'

/** Les [[champs à compléter]] sont surlignés : impossible de les publier sans les voir. */
function Paragraph({ text }) {
  const parts = text.split(/(\[\[[^\]]+\]\])/g)
  return (
    <p className="text-[15.5px] leading-[1.75] text-ink-800">
      {parts.map((part, i) =>
        part.startsWith('[[') ? (
          <mark key={i} className="rounded bg-ocre-100 px-1 text-ocre-700">
            {part.slice(2, -2)}
          </mark>
        ) : (
          part
        )
      )}
    </p>
  )
}

/** Mentions légales, confidentialité, conditions : même gabarit, texte dans `content/legal.js`. */
export default function Legal({ doc }) {
  const { t, d, lang } = useI18n()
  const page = (LEGAL[lang] || LEGAL.fr)[doc]
  useDocumentMeta(page?.title, page?.lede)
  if (!page) return <NotFound />

  return (
    <>
      <PageHeader kicker={t('footer.company')} title={page.title} lede={page.lede}>
        <p className="text-[13.5px] text-ink-400">
          {t('legal.updated')} {d(LEGAL_UPDATED)}
        </p>
      </PageHeader>

      <div className="shell py-14 md:py-20">
        <article className="max-w-[68ch] space-y-12">
          {page.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-[22px] font-semibold">{s.h}</h2>
              <div className="mt-4 space-y-3.5">
                {s.p.map((text) => (
                  <Paragraph key={text} text={text} />
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>
    </>
  )
}
