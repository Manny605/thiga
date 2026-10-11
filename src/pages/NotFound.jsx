import { useI18n } from '../i18n/I18nProvider'
import Button from '../components/ui/Button'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-display text-[clamp(4rem,14vw,9rem)] leading-none text-sand-300">404</p>
      <h1 className="mt-4 text-[26px]">{t('common.empty')}</h1>
      <p className="mt-3 text-[15.5px] text-ink-600">{t('common.emptyHint')}</p>
      <Button to="/" size="lg" className="mt-9">{t('nav.home')}</Button>
    </div>
  )
}
