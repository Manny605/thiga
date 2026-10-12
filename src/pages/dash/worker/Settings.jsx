import { useEffect, useState } from 'react'
import { useI18n } from '../../../i18n/I18nProvider'
import { useAuth } from '../../../auth/AuthProvider'
import { fetchMySettings, updateMySettings } from '../../../lib/workerDash'
import { CITIES } from '../../../data/mock'
import Panel from '../../../components/dashboard/Panel'
import AvatarPanel from '../../../components/dashboard/AvatarPanel'
import PasswordPanel from '../../../components/dashboard/PasswordPanel'
import Button from '../../../components/ui/Button'
import { Input, Select } from '../../../components/ui/Field'

export default function Settings() {
  const { t } = useI18n()
  const { user, refreshProfile } = useAuth()

  const [settings, setSettings] = useState(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    fetchMySettings(user.id)
      .then((s) => {
        setSettings(s)
        setFullName(s.fullName)
        setPhone(s.phone)
        setCity(s.city)
      })
      .catch(() => setError(t('dash.loadError')))
  }, [user?.id, t])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      await updateMySettings(user.id, { fullName, phone, city })
      refreshProfile()
      setMessage(t('dash.profileSaved'))
    } catch {
      setError(t('dash.profileSaveError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!settings) return null

  return (
    <>
      <AvatarPanel />
      <Panel title={t('dash.settings')}>
        <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
          <Input label={t('auth.fullName')} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input label={t('auth.phone')} type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Select label={t('common.city')} value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="" disabled>{t('common.allCities')}</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{t(`cities.${c}`)}</option>
            ))}
          </Select>

          {message && <p className="text-[14px] text-vert-700">{message}</p>}
          {error && <p className="text-[14px] text-red-600">{error}</p>}

          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? '…' : t('dash.save')}
          </Button>
        </form>
      </Panel>

      <PasswordPanel />
    </>
  )
}
