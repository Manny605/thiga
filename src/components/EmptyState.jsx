import { SearchX } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'

export default function EmptyState({ onReset }) {
  const { t } = useI18n()
  return (
    <div className="col-span-full flex flex-col items-center rounded-2xl border border-dashed border-sand-300 bg-white/60 px-6 py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sand-100 text-ink-400">
        <SearchX className="h-7 w-7" strokeWidth={1.25} />
      </span>
      <p className="mt-5 font-display text-xl text-ink">{t('common.empty')}</p>
      <p className="mt-2 text-[13.5px] text-ink-400">{t('common.emptyHint')}</p>
      {onReset && (
        <button
          onClick={onReset}
          className="mt-6 rounded-xl bg-vert-700 px-4 py-2 text-[13px] font-medium text-sand-50 shadow-sm transition-colors hover:bg-vert-800"
        >
          {t('common.reset')}
        </button>
      )}
    </div>
  )
}
