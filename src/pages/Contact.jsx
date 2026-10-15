import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flag, KeyRound, Mail, MapPin, MessageSquareText, Send } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { CONTACT_EMAIL, fetchContacts, isValidMrPhone } from '../lib/contact'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import PageHeader from '../components/layout/PageHeader'
import Reveal from '../components/ui/Reveal'
import Button from '../components/ui/Button'
import { Input, PhoneInput, Select, Textarea } from '../components/ui/Field'

const SUBJECTS = ['general', 'account', 'job', 'partnership', 'other']
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const EMPTY = { name: '', phone: '', email: '', subject: 'general', message: '', website: '' }

/**
 * Contactez-nous : ouvert à tous. Le message arrive dans l'espace admin
 * (module Messages) ; l'équipe répond au numéro ou à l'e-mail laissé.
 * Un compte connecté voit ses coordonnées déjà remplies.
 */
export default function Contact() {
  const { t } = useI18n()
  const { user, profile } = useAuth()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [state, setState] = useState('idle') // idle | sending | sent | error | rate

  useDocumentMeta(t('contact.title'), t('contact.lede'))

  // Préremplissage pour un compte connecté : nom, e-mail et numéro enregistrés.
  useEffect(() => {
    if (!user) return
    let active = true
    setForm((f) => ({ ...f, name: f.name || profile?.full_name || '', email: f.email || user.email || '' }))
    fetchContacts([user.id])
      .then((phones) => {
        const digits = (phones[user.id] || '').replace(/\D/g, '').slice(-8)
        if (active && digits) setForm((f) => ({ ...f, phone: f.phone || digits }))
      })
      .catch(() => {})
    return () => { active = false }
  }, [user, profile?.full_name])

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined, ...(key === 'phone' || key === 'email' ? { reach: undefined } : {}) }))
  }

  const validate = () => {
    const e = {}
    if (form.name.trim().length < 2) e.name = t('contact.errName')
    if (form.phone && !isValidMrPhone(form.phone)) e.phone = t('auth.errPhone')
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) e.email = t('contact.errEmail')
    if (!form.phone && !form.email.trim()) e.reach = t('contact.errReach')
    if (form.message.trim().length < 10) e.message = t('contact.errMessage')
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) {
      const first = ['name', 'reach', 'phone', 'email', 'message'].find((k) => e[k])
      document.getElementById(`contact-${first === 'reach' ? 'phone' : first}`)?.focus()
      return
    }
    // Champ piège invisible : rempli, c'est un robot. On fait comme si de rien n'était.
    if (form.website) {
      setState('sent')
      return
    }
    setState('sending')
    const { data: id, error } = await supabase.rpc('submit_contact_message', {
      p_name: form.name.trim(),
      p_phone: form.phone || null,
      p_email: form.email.trim() || null,
      p_subject: form.subject,
      p_message: form.message.trim(),
    })
    if (error) {
      setState(/rate_limited/.test(error.message || '') ? 'rate' : 'error')
      return
    }
    // Copie par e-mail à la propriétaire. Le message est déjà enregistré :
    // un échec d'envoi ne concerne pas le visiteur (l'admin peut renvoyer).
    supabase.functions.invoke('contact-email', { body: { id } }).catch(() => {})
    setState('sent')
  }

  const again = () => {
    setForm((f) => ({ ...EMPTY, name: f.name, phone: f.phone, email: f.email }))
    setState('idle')
  }

  const tips = [
    { icon: Mail, title: t('contact.tipEmailT'), body: t('contact.tipEmailD'), href: `mailto:${CONTACT_EMAIL}`, link: CONTACT_EMAIL },
    { icon: Flag, title: t('contact.tipReportT'), body: t('contact.tipReportD') },
    { icon: KeyRound, title: t('contact.tipPasswordT'), body: t('contact.tipPasswordD'), to: '/mot-de-passe-oublie', link: t('contact.tipPasswordLink') },
    { icon: MapPin, title: t('contact.tipWhereT'), body: t('contact.addressV') },
  ]

  return (
    <>
      <PageHeader kicker={t('nav.contact')} title={t('contact.title')} lede={t('contact.lede')} />

      <section className="shell grid gap-8 py-14 md:py-20 lg:grid-cols-12 lg:gap-12">
        <Reveal className="lg:col-span-7">
          <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-card sm:p-9">
            {state === 'sent' ? (
              <div className="animate-fade py-8 text-center">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-vert-50 text-vert-700 ring-8 ring-vert-50/50">
                  <Send className="h-7 w-7" strokeWidth={1.5} />
                </span>
                <h2 className="mt-6 text-[26px] font-semibold leading-tight">{t('contact.sentTitle')}</h2>
                <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-600">{t('contact.sent')}</p>
                <Button variant="ghost" className="mt-6" onClick={again}>{t('contact.sendAnother')}</Button>
              </div>
            ) : (
              <>
                <h2 className="flex items-center gap-2.5 text-[22px] font-semibold">
                  <MessageSquareText className="h-5 w-5 text-vert-700" />
                  {t('contact.formTitle')}
                </h2>

                <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
                  <Input
                    id="contact-name"
                    label={t('contact.yourName')}
                    autoComplete="name"
                    maxLength={80}
                    value={form.name}
                    onChange={(e) => set('name')(e.target.value)}
                    error={errors.name}
                  />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <PhoneInput
                      id="contact-phone"
                      label={t('auth.phone')}
                      placeholder="22 12 34 56"
                      value={form.phone}
                      onChange={set('phone')}
                      error={errors.phone || errors.reach}
                    />
                    <Input
                      id="contact-email"
                      icon={Mail}
                      label={t('auth.email')}
                      type="email"
                      dir="ltr"
                      placeholder="nom@exemple.mr"
                      autoComplete="email"
                      maxLength={254}
                      value={form.email}
                      onChange={(e) => set('email')(e.target.value)}
                      error={errors.email}
                    />
                  </div>
                  <p className="-mt-2 text-[13px] text-ink-400">{t('contact.reachHelp')}</p>

                  <Select
                    id="contact-subject"
                    label={t('contact.subject')}
                    value={form.subject}
                    onChange={(e) => set('subject')(e.target.value)}
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{t(`contact.subjects.${s}`)}</option>
                    ))}
                  </Select>

                  <div>
                    <Textarea
                      id="contact-message"
                      label={t('contact.message')}
                      rows={6}
                      maxLength={2000}
                      placeholder={t('contact.messagePlaceholder')}
                      value={form.message}
                      onChange={(e) => set('message')(e.target.value)}
                      aria-invalid={errors.message ? true : undefined}
                    />
                    <div className="mt-1.5 flex justify-between gap-3 text-[13px]">
                      <span className="text-red-600">{errors.message}</span>
                      <span className="tabular-nums text-ink-400">{form.message.length}/2000</span>
                    </div>
                  </div>

                  {/* Piège à robots : invisible et hors du parcours clavier. */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="sr-only"
                    value={form.website}
                    onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  />

                  {(state === 'error' || state === 'rate') && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
                      {t(state === 'rate' ? 'contact.errRate' : 'contact.errGeneric')}
                    </p>
                  )}

                  <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={state === 'sending'}>
                    <Send className="h-4 w-4" />
                    {state === 'sending' ? '…' : t('contact.send')}
                  </Button>
                </form>
              </>
            )}
          </div>
        </Reveal>

        <aside className="space-y-4 lg:col-span-5">
          {tips.map((tip, i) => (
            <Reveal key={tip.title} delay={100 + i * 80} className="flex gap-4 rounded-2xl border border-sand-200/70 bg-sand-50/60 p-6">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-vert-700 ring-1 ring-sand-200">
                <tip.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <h3 className="text-[16.5px] font-semibold leading-snug">{tip.title}</h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-600">{tip.body}</p>
                {tip.to && (
                  <Link to={tip.to} className="mt-2 inline-block text-[14px] font-medium text-vert-700 hover:underline">
                    {tip.link}
                  </Link>
                )}
                {tip.href && (
                  <a href={tip.href} dir="ltr" className="mt-2 inline-block break-all text-[14px] font-medium text-vert-700 hover:underline">
                    {tip.link}
                  </a>
                )}
              </div>
            </Reveal>
          ))}
        </aside>
      </section>
    </>
  )
}
