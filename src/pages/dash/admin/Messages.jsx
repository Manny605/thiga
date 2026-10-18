import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Inbox, Mail, MailCheck, MailX, Trash2, UserRound } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { fetchContactMessages, handleContactMessage, deleteContactMessage, emailContactMessage } from '../../../lib/admin'
import Panel from '../../../components/dashboard/Panel'
import StatusPill from '../../../components/dashboard/StatusPill'
import ContactLine from '../../../components/dashboard/ContactLine'
import { Textarea } from '../../../components/ui/Field'
import { useAdmin } from './AdminLayout'

function MessageCard({ m, onDone }) {
  const { t, d } = useI18n()
  const [mode, setMode] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [emailed, setEmailed] = useState(m.emailed)
  const [sending, setSending] = useState(false)

  const resend = async () => {
    setError('')
    setSending(true)
    try {
      await emailContactMessage(m.id)
      setEmailed(true)
    } catch {
      setError(t('admin.messageEmailError'))
    } finally {
      setSending(false)
    }
  }

  const confirm = async () => {
    setError('')
    setBusy(true)
    try {
      if (mode === 'handle') await handleContactMessage(m.id, note)
      else await deleteContactMessage(m.id)
      onDone(m.id)
    } catch {
      setError(t('dash.actionError'))
      setBusy(false)
    }
  }

  const btn = 'inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-[13.5px] font-medium transition-colors disabled:opacity-50'

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[16px] font-semibold text-ink">{m.name}</p>
          <p className="mt-1 text-[13px] text-ink-400">
            {t('admin.messageReceivedOn')} {d(m.date)} · {m.time} UTC
          </p>
        </div>
        <span className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sand-100 px-2.5 py-1 text-[12.5px] font-medium text-ink-600">
            {t(`contact.subjects.${m.subject}`)}
          </span>
          {emailed ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-vert-50 px-2.5 py-1 text-[12.5px] font-medium text-vert-700">
              <MailCheck className="h-3.5 w-3.5" />
              {t('admin.messageEmailed')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ocre-100 px-2.5 py-1 text-[12.5px] font-medium text-ocre-700">
              <MailX className="h-3.5 w-3.5" />
              {t('admin.messageNotEmailed')}
            </span>
          )}
        </span>
      </div>

      {m.profileId && (
        <p className="mt-3 flex items-center gap-1.5 text-[13.5px] text-ink-600">
          <UserRound className="h-4 w-4 text-ink-400" />
          {t('admin.messageFromAccount')}{' '}
          <Link to={`/admin/utilisateurs/${m.profileId}`} className="font-medium text-ink hover:text-vert-700 hover:underline">
            {m.accountName}
          </Link>
          {m.role && <> · {t(`admin.${m.role}`)}</>}
        </p>
      )}

      <p className="mt-4 whitespace-pre-line break-words rounded-xl bg-sand-50 px-4 py-3 text-[15px] leading-relaxed text-ink-800">
        {m.message}
      </p>

      {m.phone && <ContactLine label={t('auth.phone')} phone={m.phone} />}
      {m.email && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-sand-200 bg-white px-4 py-3">
          <span className="text-[13px] font-medium text-ink-600">{t('auth.email')}</span>
          <span dir="ltr" className="select-all break-all text-[14.5px] text-ink">{m.email}</span>
          <a
            href={`mailto:${m.email}?subject=${encodeURIComponent(`THIGA — ${t(`contact.subjects.${m.subject}`)}`)}`}
            className="ms-auto inline-flex items-center gap-1.5 rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-[13.5px] text-ink-600 transition-colors hover:border-vert-200 hover:text-vert-700"
          >
            <Mail className="h-3.5 w-3.5" />
            {t('admin.messageReply')}
          </a>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setMode(mode === 'handle' ? null : 'handle')} disabled={busy} className={`${btn} border-vert-100 bg-vert-50 text-vert-700 hover:bg-vert-700 hover:text-sand-50`}>
          <Check className="h-4 w-4" />
          {t('admin.messageHandle')}
        </button>
        {!emailed && (
          <button onClick={resend} disabled={sending} className={`${btn} border-sand-300 bg-white text-ink-600 hover:border-vert-200 hover:text-vert-700`}>
            <Mail className="h-4 w-4" />
            {sending ? '…' : t('admin.messageEmailSend')}
          </button>
        )}
        <button onClick={() => setMode(mode === 'delete' ? null : 'delete')} disabled={busy} className={`${btn} border-sand-300 bg-white text-ink-600 hover:border-red-300 hover:text-red-700`}>
          <Trash2 className="h-4 w-4" />
          {t('admin.messageDelete')}
        </button>
      </div>

      {mode && (
        <div className={`mt-3 rounded-xl border p-4 ${mode === 'delete' ? 'border-red-200 bg-red-50' : 'border-sand-200 bg-sand-50'}`}>
          <p className="text-[13.5px] leading-relaxed text-ink-800">
            {t(mode === 'handle' ? 'admin.messageHandleConfirm' : 'admin.messageDeleteConfirm')}
          </p>
          {mode === 'handle' && (
            <div className="mt-3">
              <Textarea label={t('admin.resolutionNote')} rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={confirm}
              disabled={busy}
              className={`h-9 rounded-lg px-3.5 text-[13.5px] font-medium text-white transition-colors disabled:opacity-50 ${
                mode === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-vert-700 hover:bg-vert-800'
              }`}
            >
              {busy ? '…' : t(mode === 'handle' ? 'admin.messageHandle' : 'admin.messageDelete')}
            </button>
            <button onClick={() => setMode(null)} className="h-9 rounded-lg border border-sand-300 bg-white px-3.5 text-[13.5px] text-ink-600 transition-colors hover:text-ink">
              {t('dash.cancel')}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-[13.5px] text-red-600">{error}</p>}
    </Panel>
  )
}

function History() {
  const { t, d } = useI18n()
  const [list, setList] = useState(null)

  useEffect(() => {
    let active = true
    fetchContactMessages('handled')
      .then((l) => { if (active) setList(l) })
      .catch(() => { if (active) setList([]) })
    return () => { active = false }
  }, [])

  if (list === null) return <div className="h-40 animate-pulse rounded-2xl bg-sand-100" aria-hidden="true" />

  return (
    <Panel bodyClass="">
      {list.length === 0 ? (
        <p className="px-6 py-14 text-center text-[14.5px] text-ink-400">{t('admin.messagesNoHistory')}</p>
      ) : (
        <ul className="divide-y divide-sand-200">
          {list.map((m) => (
            <li key={m.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 px-6 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-ink">
                  {m.name}{' '}
                  <span dir="ltr" className="font-normal text-ink-400">{m.phone || m.email}</span>
                </p>
                <p className="mt-1 text-[13px] text-ink-400">
                  {t(`contact.subjects.${m.subject}`)} · {t('admin.messageReceivedOn')} {d(m.date)}
                </p>
                <p className="mt-2 line-clamp-2 break-words text-[14px] text-ink-600">{m.message}</p>
                {m.adminNote && <p className="mt-2 text-[13.5px] italic text-ink-600">{m.adminNote}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusPill status="online">{t('admin.reportsClosed')}</StatusPill>
                {m.handledAt && <span className="text-[12.5px] text-ink-400">{t('admin.resolvedOn')} {d(m.handledAt)}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export default function Messages() {
  const { t, n } = useI18n()
  const { contactMessages, dropContactMessage } = useAdmin()
  const [tab, setTab] = useState('open')

  const tabs = [
    { id: 'open', label: t('admin.reportsOpen'), count: contactMessages.length },
    { id: 'closed', label: t('admin.reportsClosed') },
  ]

  return (
    <>
      <div className="mb-6 flex gap-1 border-b border-sand-200/70" role="tablist">
        {tabs.map((x) => {
          const on = tab === x.id
          return (
            <button
              key={x.id}
              role="tab"
              aria-selected={on}
              onClick={() => setTab(x.id)}
              className={`relative -mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-[14.5px] transition-colors ${
                on ? 'border-vert-700 text-vert-700' : 'border-transparent text-ink-400 hover:text-ink'
              }`}
            >
              {x.label}
              {x.count != null && (
                <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11.5px] ${on ? 'bg-vert-700 text-sand-50' : 'bg-sand-200 text-ink-600'}`}>
                  {n(x.count)}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {tab === 'closed' ? (
        <History />
      ) : contactMessages.length === 0 ? (
        <Panel>
          <div className="flex flex-col items-center py-14 text-center">
            <Inbox className="h-7 w-7 text-sand-400" strokeWidth={1.25} />
            <p className="mt-4 font-display text-lg text-ink">{t('admin.messagesNone')}</p>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-4">
          {contactMessages.map((m) => <MessageCard key={m.id} m={m} onDone={dropContactMessage} />)}
        </div>
      )}
    </>
  )
}
