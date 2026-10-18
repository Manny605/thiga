import { useI18n } from '../../../i18n/I18nProvider'
import { useAuth } from '../../../auth/AuthProvider'
import Panel from '../../../components/dashboard/Panel'
import PasswordPanel from '../../../components/dashboard/PasswordPanel'

export default function Settings() {
  const { t } = useI18n()
  const { user, profile } = useAuth()

  return (
    <>
      <Panel title={t('admin.account')}>
        <dl className="grid max-w-2xl gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-[13px] font-medium text-ink-400">{t('auth.fullName')}</dt>
            <dd className="mt-1 text-[15px] text-ink">{profile?.full_name}</dd>
          </div>
          <div>
            <dt className="text-[13px] font-medium text-ink-400">{t('auth.email')}</dt>
            <dd dir="ltr" className="mt-1 text-start text-[15px] text-ink">{user?.email}</dd>
          </div>
        </dl>
      </Panel>

      <PasswordPanel />
    </>
  )
}
