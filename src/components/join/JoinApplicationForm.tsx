import {useEffect, useState, type FormEvent} from 'react'
import type {Locale} from '../../data/locales'
import {resolveLocalized} from '../../data/locales'
import {TRANSLATIONS} from '../../data/translations'
import {PARTICIPANT_TYPES, SECTORS, PRODUCT_CATEGORIES, COMPETENCY_AREAS} from '../../data/referenceLists'
import type {ApplicantKind} from '../../types'
import {submitJoinRequest} from '../../lib/joinRequests'
import {Loader2, CheckCircle2, AlertCircle} from 'lucide-react'

interface JoinApplicationFormProps {
  currentLang: Locale
}

interface FormState {
  companyName: string
  website: string
  activityField: string
  edrpou: string
  contactPerson: string
  email: string
  phone: string
  message: string
  applicantKind: ApplicantKind | ''
  sectors: string[]
  productCategories: string[]
  competencies: string[]
  privacyConsent: boolean
  termsConsent: boolean
  hp: string
}

const INITIAL_STATE: FormState = {
  companyName: '',
  website: '',
  activityField: '',
  edrpou: '',
  contactPerson: '',
  email: '',
  phone: '',
  message: '',
  applicantKind: '',
  sectors: [],
  productCategories: [],
  competencies: [],
  privacyConsent: false,
  termsConsent: false,
  hp: '',
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

function toggleListValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export default function JoinApplicationForm({currentLang}: JoinApplicationFormProps) {
  const t = TRANSLATIONS[currentLang]
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() || ''

  useEffect(() => {
    if (!turnstileSiteKey) return
    const existing = document.querySelector('script[data-uaos-turnstile]')
    if (existing) return
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    script.dataset.uaosTurnstile = '1'
    document.head.appendChild(script)
  }, [turnstileSiteKey])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({...prev, [key]: value}))
  }

  /** Клієнтська валідація дзеркалить обов'язкові поля/правила api/_lib/joinApplication.ts. */
  function validate(): string | null {
    if (!form.companyName.trim() || !form.activityField.trim() || !form.contactPerson.trim() || !form.email.trim() || !form.phone.trim()) {
      return t.join_form_error
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return t.join_form_error
    }
    if (form.phone.replace(/[^\d]/g, '').length < 9) {
      return t.join_form_error
    }
    if (!form.privacyConsent || !form.termsConsent) {
      return t.join_form_error
    }
    return null
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (status === 'submitting' || status === 'success') return

    const validationError = validate()
    if (validationError) {
      setStatus('error')
      setErrorMessage(validationError)
      return
    }

    setStatus('submitting')
    setErrorMessage(null)

    try {
      const turnstileApi = (window as unknown as {
        turnstile?: {getResponse?: (id?: string) => string}
      }).turnstile
      const turnstileToken =
        typeof turnstileApi?.getResponse === 'function' ? turnstileApi.getResponse() || '' : ''

      await submitJoinRequest({
        companyName: form.companyName.trim(),
        website: form.website.trim(),
        activityField: form.activityField.trim(),
        contactPerson: form.contactPerson.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
        edrpou: form.edrpou.trim(),
        hp: form.hp,
        turnstileToken,
        applicantKind: form.applicantKind || undefined,
        sectors: form.sectors.length ? form.sectors : undefined,
        productCategories: form.productCategories.length ? form.productCategories : undefined,
        competencies: form.competencies.length ? form.competencies : undefined,
      })
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : t.join_form_error)
    }
  }

  const showSectors = form.applicantKind === 'producer-supplier' || form.applicantKind === 'consumer-enterprise'
  const showProductCategories = form.applicantKind === 'producer-supplier'
  const showCompetencies = form.applicantKind === 'expert-org'

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl glass-pill focus:border-brand-blue-500 dark:focus:border-brand-sky-400 focus:bg-white dark:focus:bg-brand-slate-900 text-sm text-brand-slate-800 dark:text-brand-slate-200 outline-none transition-all'
  const labelClass = 'block text-xs font-semibold text-brand-slate-600 dark:text-brand-slate-300 mb-1.5'

  if (status === 'success') {
    return (
      <div className="glass-card rounded-2xl p-8 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
        <p className="text-sm text-brand-slate-700 dark:text-brand-slate-200 font-medium">{t.join_form_success}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 sm:p-8 space-y-5">
      <input
        type="text"
        name="hp"
        value={form.hp}
        onChange={(event) => update('hp', event.target.value)}
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="join-companyName">{t.join_form_name_lbl}</label>
          <input
            id="join-companyName"
            type="text"
            required
            maxLength={120}
            value={form.companyName}
            onChange={(event) => update('companyName', event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="join-website">{t.join_form_website_lbl}</label>
          <input
            id="join-website"
            type="url"
            placeholder="https://"
            value={form.website}
            onChange={(event) => update('website', event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="join-applicantKind">{t.join_form_applicant_kind_lbl}</label>
        <select
          id="join-applicantKind"
          value={form.applicantKind}
          onChange={(event) => update('applicantKind', event.target.value as ApplicantKind | '')}
          className={inputClass}
        >
          <option value="">—</option>
          {PARTICIPANT_TYPES.map((item) => (
            <option key={item.id} value={item.id}>
              {resolveLocalized(item.label, currentLang)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="join-activityField">{t.join_form_field_lbl}</label>
        <input
          id="join-activityField"
          type="text"
          required
          maxLength={200}
          value={form.activityField}
          onChange={(event) => update('activityField', event.target.value)}
          className={inputClass}
        />
      </div>

      {showSectors && (
        <div>
          <span className={labelClass}>{t.join_form_sector_lbl}</span>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => update('sectors', toggleListValue(form.sectors, item.id))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  form.sectors.includes(item.id)
                    ? 'bg-brand-blue-500 border-brand-blue-500 text-white'
                    : 'border-brand-slate-200 dark:border-brand-slate-800 text-brand-slate-600 dark:text-brand-slate-200 hover:border-brand-blue-400'
                }`}
              >
                {resolveLocalized(item.label, currentLang)}
              </button>
            ))}
          </div>
        </div>
      )}

      {showProductCategories && (
        <div>
          <span className={labelClass}>{t.join_form_category_lbl}</span>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => update('productCategories', toggleListValue(form.productCategories, item.id))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  form.productCategories.includes(item.id)
                    ? 'bg-brand-blue-500 border-brand-blue-500 text-white'
                    : 'border-brand-slate-200 dark:border-brand-slate-800 text-brand-slate-600 dark:text-brand-slate-200 hover:border-brand-blue-400'
                }`}
              >
                {resolveLocalized(item.label, currentLang)}
              </button>
            ))}
          </div>
        </div>
      )}

      {showCompetencies && (
        <div>
          <span className={labelClass}>{t.join_form_competency_lbl}</span>
          <div className="flex flex-wrap gap-2">
            {COMPETENCY_AREAS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => update('competencies', toggleListValue(form.competencies, item.id))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  form.competencies.includes(item.id)
                    ? 'bg-brand-blue-500 border-brand-blue-500 text-white'
                    : 'border-brand-slate-200 dark:border-brand-slate-800 text-brand-slate-600 dark:text-brand-slate-200 hover:border-brand-blue-400'
                }`}
              >
                {resolveLocalized(item.label, currentLang)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="join-edrpou">{t.join_form_edrpou_lbl}</label>
          <input
            id="join-edrpou"
            type="text"
            maxLength={8}
            value={form.edrpou}
            onChange={(event) => update('edrpou', event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="join-contactPerson">{t.join_form_person_lbl}</label>
          <input
            id="join-contactPerson"
            type="text"
            required
            maxLength={120}
            value={form.contactPerson}
            onChange={(event) => update('contactPerson', event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="join-email">{t.join_form_email_lbl}</label>
          <input
            id="join-email"
            type="email"
            required
            maxLength={254}
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="join-phone">{t.join_form_phone_lbl}</label>
          <input
            id="join-phone"
            type="tel"
            required
            maxLength={30}
            value={form.phone}
            onChange={(event) => update('phone', event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="join-message">{t.join_form_msg_lbl}</label>
        <textarea
          id="join-message"
          rows={4}
          maxLength={2000}
          value={form.message}
          onChange={(event) => update('message', event.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-2.5">
        <label className="flex items-start gap-2.5 text-xs text-brand-slate-600 dark:text-brand-slate-300 cursor-pointer">
          <input
            type="checkbox"
            required
            checked={form.privacyConsent}
            onChange={(event) => update('privacyConsent', event.target.checked)}
            className="mt-0.5 shrink-0"
          />
          {t.join_form_consent}
        </label>
        <label className="flex items-start gap-2.5 text-xs text-brand-slate-600 dark:text-brand-slate-300 cursor-pointer">
          <input
            type="checkbox"
            required
            checked={form.termsConsent}
            onChange={(event) => update('termsConsent', event.target.checked)}
            className="mt-0.5 shrink-0"
          />
          {t.join_form_terms_consent}
        </label>
      </div>

      {status === 'error' && errorMessage && (
        <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {errorMessage}
        </div>
      )}

      {turnstileSiteKey ? (
        <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="auto" />
      ) : null}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full sm:w-auto px-6 py-3 bg-brand-slate-900 dark:bg-white text-white dark:text-brand-slate-900 font-medium rounded-lg hover:bg-brand-slate-800 dark:hover:bg-brand-slate-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" />}
        {status === 'submitting' ? t.join_form_submitting : t.join_form_submit_btn}
      </button>
    </form>
  )
}
