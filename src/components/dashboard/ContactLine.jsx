import { MessageCircle, Phone } from 'lucide-react'
import { useI18n } from '../../i18n/I18nProvider'
import { internationalDigits } from '../../lib/contact'

/**
 * Coordonnées de l'autre partie d'une candidature présélectionnée :
 * le numéro en clair (sélectionnable), un lien d'appel et un lien WhatsApp.
 * `phone` absent : la personne n'a pas renseigné de numéro.
 */
export default function ContactLine({ label, phone }) {
  const { t } = useI18n()
  const digits = internationalDigits(phone)

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-vert-100 bg-vert-50/60 px-4 py-3">
      <span className="text-[13px] font-medium text-vert-700">{label}</span>
      {phone ? (
        <>
          <span dir="ltr" className="select-all text-[14.5px] font-medium tabular-nums text-ink">{phone}</span>
          <span className="ms-auto flex gap-2">
            <a
              href={`tel:+${digits}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-[13.5px] text-ink-600 transition-colors hover:border-vert-200 hover:text-vert-700"
            >
              <Phone className="h-3.5 w-3.5" />
              {t('reach.call')}
            </a>
            <a
              href={`https://wa.me/${digits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-vert-700 px-3 py-1.5 text-[13.5px] font-medium text-sand-50 transition-colors hover:bg-vert-800"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          </span>
        </>
      ) : (
        <span className="text-[13.5px] text-ink-400">{t('reach.noPhone')}</span>
      )}
    </div>
  )
}
