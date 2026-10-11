import { useState } from 'react'
import { Trash2, Upload } from 'lucide-react'
import { useI18n } from '../../i18n/I18nProvider'
import { useAuth } from '../../auth/AuthProvider'
import { AVATAR_ACCEPT, avatarUrl, describeAvatarProblem, removeAvatar, uploadAvatar } from '../../lib/avatar'
import Avatar from '../ui/Avatar'
import Panel from './Panel'

/** Dépôt et retrait de la photo de profil — partagé par les espaces employeur et travailleur. */
export default function AvatarPanel() {
  const { t } = useI18n()
  const { user, profile, refreshProfile } = useAuth()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  if (!user || !profile) return null
  const path = profile.avatar_path

  const run = async (action, okKey, errKey) => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await action()
      // L'en-tête du tableau de bord lit la photo dans le contexte d'auth.
      refreshProfile()
      setMessage(t(okKey))
    } catch {
      setError(t(errKey))
    } finally {
      setBusy(false)
    }
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permet de re-sélectionner le même fichier après une erreur
    if (!file) return

    const problem = describeAvatarProblem(file, t)
    if (problem) {
      setError(problem)
      setMessage('')
      return
    }
    run(() => uploadAvatar(user.id, file, path), 'avatar.uploaded', 'avatar.uploadError')
  }

  const handleRemove = () => run(() => removeAvatar(user.id, path), 'avatar.removed', 'avatar.removeError')

  return (
    <Panel title={t('avatar.title')} className="mb-6">
      <div className="flex flex-wrap items-center gap-5">
        <Avatar name={profile.full_name || ''} src={avatarUrl(path)} size="xl" />

        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] leading-relaxed text-ink-600">{t('avatar.lede')}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <label
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-sand-300 bg-white px-4 py-2.5 text-[14px] font-medium text-ink shadow-sm transition-colors hover:border-vert-200 hover:text-vert-700 ${busy ? 'pointer-events-none opacity-40' : ''}`}
            >
              <Upload className="h-4 w-4" strokeWidth={1.75} />
              {busy ? t('avatar.uploading') : path ? t('avatar.replace') : t('avatar.upload')}
              <input type="file" accept={AVATAR_ACCEPT} onChange={handleFile} disabled={busy} className="hidden" />
            </label>

            {path && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={busy}
                className="inline-flex h-[42px] items-center gap-2 rounded-xl border border-sand-300 bg-white px-3.5 text-[14px] text-ink-600 transition-colors hover:border-ocre-500 hover:text-ocre-700 disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('avatar.remove')}
              </button>
            )}
          </div>

          <p className="mt-2 text-[12.5px] text-ink-400">{t('avatar.constraints')}</p>
        </div>
      </div>

      {message && <p className="mt-3 text-[14px] text-vert-700">{message}</p>}
      {error && <p className="mt-3 text-[14px] text-red-600">{error}</p>}
    </Panel>
  )
}
