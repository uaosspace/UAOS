import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import {Check, ChevronDown, ChevronUp, Eye, EyeOff, ExternalLink, Loader2, LogOut, Settings, X} from 'lucide-react'
import type {Locale} from '../../data/locales'
import {TRANSLATIONS} from '../../data/translations'
import BrandLogo from '../../components/BrandLogo'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import {localizeCabinetApiError} from '../../lib/cabinetApiErrors'
import {
  cabinetMeetingStatusKey,
  formatCabinetEventWhen,
  isCabinetMeetingJoinable,
} from '../../lib/cabinetMeetingUi'
import {evaluatePasswordRules, passwordMeetsPolicy} from '../../lib/cabinetPasswordPolicy'
import {adminPanelClass} from '../admin/adminUi'

type MemberUser = {
  id: string
  email: string
  displayName: string
  memberId: string | null
  accessLevel?: string
  roles?: string[]
  mustChangePassword?: boolean
}

type CabinetEvent = {
  id: string
  slug: string
  titleUk: string
  titleEn: string
  startAt: string
  meeting: {id: string; status: string; provider: string} | null
}

type CabinetAppProps = {
  currentLang: Locale
  setCurrentLang: (lang: Locale) => void
  onBackToSite: () => void
}

type CabinetCopy = (typeof TRANSLATIONS)[Locale]

const cabinetInputClass =
  'w-full rounded-xl border border-brand-slate-200 bg-white px-4 py-3.5 text-base text-brand-slate-900 placeholder:text-brand-slate-400 focus:border-brand-blue-500 focus:outline-none dark:border-brand-slate-700 dark:bg-brand-slate-900/80 dark:text-white dark:placeholder:text-brand-slate-500'

const cabinetLabelClass =
  'block text-sm font-semibold text-brand-slate-700 dark:text-brand-slate-200'

const cabinetPrimaryBtnClass =
  'inline-flex w-full items-center justify-center rounded-xl bg-brand-blue-500 px-5 py-3.5 text-base font-semibold text-white shadow-sm shadow-brand-blue-500/25 transition hover:bg-brand-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-500 disabled:opacity-60'

const cabinetSecondaryBtnClass =
  'inline-flex items-center justify-center rounded-xl border border-brand-slate-200 bg-white/70 px-4 py-3 text-base font-medium text-brand-slate-700 transition hover:border-brand-blue-400 hover:text-brand-blue-600 dark:border-brand-slate-700 dark:bg-brand-slate-900/50 dark:text-brand-slate-200 dark:hover:border-brand-sky-400 dark:hover:text-brand-sky-300'

class CabinetApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CabinetApiError'
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/member/${path}`, {
    credentials: 'include',
    headers: {'Content-Type': 'application/json', ...(init?.headers || {})},
    ...init,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new CabinetApiError(typeof data.error === 'string' ? data.error : 'Request failed')
  }
  return data as T
}

function meetingStatusText(t: CabinetCopy, status: string | null | undefined): string {
  switch (cabinetMeetingStatusKey(status)) {
    case 'ready':
      return t.cabinet_meeting_status_ready
    case 'live':
      return t.cabinet_meeting_status_live
    case 'pending':
      return t.cabinet_meeting_status_pending
    case 'ended':
      return t.cabinet_meeting_status_ended
    case 'error':
      return t.cabinet_meeting_status_error
    case 'cancelled':
      return t.cabinet_meeting_status_cancelled
    default:
      return t.cabinet_meeting_status_unavailable
  }
}

function PasswordRevealField({
  label,
  value,
  onChange,
  autoComplete,
  disabled,
  minLength,
  maxLength,
  required,
  showPassword,
  onToggleShow,
  showLabel,
  hideLabel,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
  disabled?: boolean
  minLength?: number
  maxLength?: number
  required?: boolean
  showPassword: boolean
  onToggleShow: () => void
  showLabel: string
  hideLabel: string
}) {
  return (
    <label className="block space-y-2">
      <span className={cabinetLabelClass}>{label}</span>
      <div className="relative">
        <input
          className={`${cabinetInputClass} pr-14`}
          type={showPassword ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          disabled={disabled}
          minLength={minLength}
          maxLength={maxLength}
          required={required}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center px-3 text-brand-slate-500 hover:text-brand-slate-800 dark:hover:text-white"
          onClick={onToggleShow}
          aria-label={showPassword ? hideLabel : showLabel}
        >
          {showPassword ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
        </button>
      </div>
    </label>
  )
}

function PasswordRulesChecklist({password, t}: {password: string; t: CabinetCopy}) {
  const rules = evaluatePasswordRules(password)
  const items: Array<{ok: boolean; label: string}> = [
    {ok: rules.length, label: t.cabinet_password_rule_length},
    {ok: rules.upper, label: t.cabinet_password_rule_upper},
    {ok: rules.digit, label: t.cabinet_password_rule_digit},
    {ok: rules.symbol, label: t.cabinet_password_rule_symbol},
  ]
  return (
    <ul className="space-y-1.5 rounded-xl border border-brand-slate-200 bg-brand-slate-50/80 p-3 text-sm dark:border-brand-slate-700 dark:bg-brand-slate-900/40">
      {items.map((item) => (
        <li
          key={item.label}
          className={`flex items-start gap-2 ${
            item.ok
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-brand-slate-600 dark:text-brand-slate-300'
          }`}
        >
          {item.ok ? (
            <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <X className="mt-0.5 h-4 w-4 shrink-0 opacity-50" aria-hidden />
          )}
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  )
}

function CabinetShell({
  currentLang,
  setCurrentLang,
  onBackToSite,
  t,
  children,
}: {
  currentLang: Locale
  setCurrentLang: (lang: Locale) => void
  onBackToSite: () => void
  t: CabinetCopy
  children: ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <BrandLogo className="h-10 w-auto" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher currentLang={currentLang} setCurrentLang={setCurrentLang} />
          <button type="button" className={cabinetSecondaryBtnClass} onClick={onBackToSite}>
            <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden />
            {t.cabinet_back_site}
          </button>
        </div>
      </header>
      {children}
    </div>
  )
}

export default function CabinetApp({currentLang, setCurrentLang, onBackToSite}: CabinetAppProps) {
  const t = TRANSLATIONS[currentLang]
  const eventsRef = useRef<HTMLDivElement | null>(null)
  const [user, setUser] = useState<MemberUser | null>(null)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [events, setEvents] = useState<CabinetEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsDisplayName, setSettingsDisplayName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null)
  const [settingsBusy, setSettingsBusy] = useState(false)
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null)
  const [forgotBusy, setForgotBusy] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const mapError = useCallback(
    (err: unknown, fallback?: string) => {
      const message = err instanceof Error ? err.message : fallback
      return localizeCabinetApiError(message, t)
    },
    [t],
  )

  const applySession = useCallback((next: MemberUser, items?: CabinetEvent[]) => {
    setUser(next)
    setSettingsDisplayName(next.displayName || '')
    if (items) setEvents(items)
  }, [])

  const bootstrap = useCallback(async () => {
    const data = await api<{user: MemberUser; items?: CabinetEvent[]}>('cabinet/summary')
    applySession(data.user, data.items ?? [])
  }, [applySession])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        await bootstrap()
      } catch {
        if (!cancelled) {
          setUser(null)
          setEvents([])
        }
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [bootstrap])

  function clearPasswordFields() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setRecoveryNotice(null)
    setBusy(true)
    try {
      const data = await api<{user: MemberUser; items?: CabinetEvent[]}>('auth/login', {
        method: 'POST',
        body: JSON.stringify({email, password}),
      })
      applySession(data.user, data.items ?? [])
      setPassword('')
      setSettingsOpen(false)
      setSettingsMessage(null)
      if (!data.items) {
        setEventsLoading(true)
        try {
          const eventsData = await api<{items: CabinetEvent[]}>('events')
          setEvents(eventsData.items ?? [])
        } catch (loadErr) {
          setError(mapError(loadErr, t.cabinet_request_failed))
        } finally {
          setEventsLoading(false)
        }
      }
    } catch (err) {
      setError(mapError(err, t.cabinet_invalid_credentials))
      setUser(null)
    } finally {
      setBusy(false)
    }
  }

  async function handleForgotPassword() {
    setError(null)
    setRecoveryNotice(null)
    const trimmed = email.trim()
    if (!trimmed) {
      setError(t.cabinet_forgot_need_email)
      return
    }
    setForgotBusy(true)
    try {
      await api<{ok: boolean}>('auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({email: trimmed}),
      })
      setRecoveryNotice(t.cabinet_forgot_sent)
      setPassword('')
    } catch (err) {
      setError(mapError(err, t.cabinet_forgot_unavailable))
    } finally {
      setForgotBusy(false)
    }
  }

  async function handleLogout() {
    setBusy(true)
    setError(null)
    try {
      await api('auth/logout', {method: 'POST', body: '{}'})
      setUser(null)
      setEvents([])
      setSettingsOpen(false)
      clearPasswordFields()
      setSettingsMessage(null)
    } catch (err) {
      setError(mapError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleJoin(eventId: string) {
    setJoiningId(eventId)
    setError(null)
    try {
      const data = await api<{meeting: {joinUrl: string}}>(`events/${eventId}/meeting`)
      if (!data.meeting?.joinUrl) throw new CabinetApiError('Meeting not available')
      window.location.assign(data.meeting.joinUrl)
    } catch (err) {
      setError(mapError(err, t.cabinet_meeting_unavailable))
    } finally {
      setJoiningId(null)
    }
  }

  async function handleSaveProfile() {
    setSettingsBusy(true)
    setSettingsMessage(null)
    setError(null)
    try {
      const data = await api<{user: MemberUser}>('cabinet/profile', {
        method: 'PATCH',
        body: JSON.stringify({displayName: settingsDisplayName.trim()}),
      })
      setUser(data.user)
      setSettingsMessage(t.cabinet_profile_saved)
    } catch (err) {
      setError(mapError(err))
    } finally {
      setSettingsBusy(false)
    }
  }

  async function submitPasswordChange(options: {forceFlow: boolean}) {
    if (!currentPassword.trim() || !newPassword.trim()) {
      setError(t.cabinet_password_fields_required)
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t.cabinet_password_mismatch)
      return
    }
    if (!passwordMeetsPolicy(newPassword)) {
      setError(t.cabinet_password_rules)
      return
    }
    setSettingsBusy(true)
    setSettingsMessage(null)
    setError(null)
    try {
      const data = await api<{user: MemberUser}>('auth/change-password', {
        method: 'POST',
        body: JSON.stringify({currentPassword, newPassword}),
      })
      setUser(data.user)
      clearPasswordFields()
      setSettingsOpen(false)
      setSettingsMessage(
        options.forceFlow ? t.cabinet_password_changed_next : t.cabinet_password_changed,
      )
      if (options.forceFlow) {
        window.setTimeout(() => {
          eventsRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'})
        }, 80)
      }
    } catch (err) {
      setError(mapError(err, t.cabinet_password_change_failed))
    } finally {
      setSettingsBusy(false)
    }
  }

  if (bootstrapping) {
    return (
      <CabinetShell
        currentLang={currentLang}
        setCurrentLang={setCurrentLang}
        onBackToSite={onBackToSite}
        t={t}
      >
        <div className="flex items-center justify-center gap-2 py-16 text-base text-brand-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          {t.cabinet_loading}
        </div>
      </CabinetShell>
    )
  }

  const eventTitle = (item: CabinetEvent) =>
    currentLang === 'uk' ? item.titleUk || item.titleEn : item.titleEn || item.titleUk

  return (
    <CabinetShell
      currentLang={currentLang}
      setCurrentLang={setCurrentLang}
      onBackToSite={onBackToSite}
      t={t}
    >
      {!user ? (
        <form className={`${adminPanelClass} space-y-5`} onSubmit={(e) => void handleLogin(e)}>
          <div>
            <h1 className="text-2xl font-semibold text-brand-slate-900 dark:text-white">
              {t.cabinet_login_title}
            </h1>
            <p className="mt-2 text-base text-brand-slate-600 dark:text-brand-slate-300">
              {t.cabinet_login_subtitle}
            </p>
          </div>
          {error ? <p className="text-base text-red-600 dark:text-red-400">{error}</p> : null}
          {recoveryNotice ? (
            <p className="text-base text-brand-blue-600 dark:text-brand-sky-300" role="status">
              {recoveryNotice}
            </p>
          ) : null}
          <label className="block space-y-2">
            <span className={cabinetLabelClass}>{t.cabinet_email}</span>
            <input
              className={cabinetInputClass}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <span className="block text-sm text-brand-slate-500 dark:text-brand-slate-400">
              {t.cabinet_login_email_hint}
            </span>
          </label>
          <PasswordRevealField
            label={t.cabinet_password}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            disabled={busy || forgotBusy}
            required
            showPassword={showLoginPassword}
            onToggleShow={() => setShowLoginPassword((v) => !v)}
            showLabel={t.cabinet_show_password}
            hideLabel={t.cabinet_hide_password}
          />
          <button type="submit" className={cabinetPrimaryBtnClass} disabled={busy || forgotBusy}>
            {busy ? t.cabinet_loading : t.cabinet_sign_in}
          </button>
          <button
            type="button"
            className={`${cabinetSecondaryBtnClass} w-full`}
            disabled={busy || forgotBusy}
            onClick={() => void handleForgotPassword()}
          >
            {forgotBusy ? t.cabinet_loading : t.cabinet_forgot_password}
          </button>
          <p className="text-sm leading-relaxed text-brand-slate-500 dark:text-brand-slate-400">
            {t.cabinet_forgot_password_hint}
          </p>
        </form>
      ) : user.mustChangePassword ? (
        <section className={`${adminPanelClass} space-y-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-brand-slate-900 dark:text-white">
                {t.cabinet_create_password_title}
              </h1>
              <p className="mt-2 text-base text-brand-slate-600 dark:text-brand-slate-300">
                {t.cabinet_create_password_body}
              </p>
              <p className="mt-2 text-sm text-brand-slate-500">{user.email}</p>
            </div>
            <button
              type="button"
              className={cabinetSecondaryBtnClass}
              onClick={() => void handleLogout()}
              disabled={busy || settingsBusy}
            >
              <LogOut className="mr-1.5 h-4 w-4" aria-hidden />
              {t.cabinet_sign_out}
            </button>
          </div>
          {error ? <p className="text-base text-red-600 dark:text-red-400">{error}</p> : null}
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              void submitPasswordChange({forceFlow: true})
            }}
          >
            <PasswordRevealField
              label={t.cabinet_current_password}
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
              disabled={settingsBusy}
              minLength={1}
              showPassword={showCurrentPassword}
              onToggleShow={() => setShowCurrentPassword((v) => !v)}
              showLabel={t.cabinet_show_password}
              hideLabel={t.cabinet_hide_password}
            />
            <PasswordRevealField
              label={t.cabinet_new_password}
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              disabled={settingsBusy}
              minLength={12}
              maxLength={128}
              showPassword={showNewPassword}
              onToggleShow={() => setShowNewPassword((v) => !v)}
              showLabel={t.cabinet_show_password}
              hideLabel={t.cabinet_hide_password}
            />
            <PasswordRulesChecklist password={newPassword} t={t} />
            <PasswordRevealField
              label={t.cabinet_confirm_password}
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              disabled={settingsBusy}
              minLength={12}
              maxLength={128}
              showPassword={showConfirmPassword}
              onToggleShow={() => setShowConfirmPassword((v) => !v)}
              showLabel={t.cabinet_show_password}
              hideLabel={t.cabinet_hide_password}
            />
            <button type="submit" className={cabinetPrimaryBtnClass} disabled={settingsBusy}>
              {settingsBusy ? t.cabinet_loading : t.cabinet_create_password_submit}
            </button>
          </form>
        </section>
      ) : (
        <section className={`${adminPanelClass} space-y-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-brand-slate-900 dark:text-white">
                {t.cabinet_stub_title}
              </h1>
              <p className="mt-2 text-lg text-brand-slate-700 dark:text-brand-slate-200">
                {user.displayName || user.email}
              </p>
              {user.displayName ? (
                <p className="mt-1 text-sm text-brand-slate-500">{user.email}</p>
              ) : null}
            </div>
            <button
              type="button"
              className={cabinetSecondaryBtnClass}
              onClick={() => void handleLogout()}
              disabled={busy}
            >
              <LogOut className="mr-1.5 h-4 w-4" aria-hidden />
              {t.cabinet_sign_out}
            </button>
          </div>
          {error ? <p className="text-base text-red-600 dark:text-red-400">{error}</p> : null}
          {settingsMessage ? (
            <p
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-base text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
              role="status"
            >
              {settingsMessage}
            </p>
          ) : null}

          <div
            ref={eventsRef}
            className="space-y-4 border-t border-brand-slate-200 pt-5 dark:border-brand-slate-700"
          >
            <h2 className="text-xl font-semibold text-brand-slate-900 dark:text-white">
              {events.length === 1 ? t.cabinet_events_one_title : t.cabinet_events_title}
            </h2>
            {eventsLoading ? (
              <p className="flex items-center gap-2 text-base text-brand-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t.cabinet_events_loading}
              </p>
            ) : events.length === 0 ? (
              <p className="text-base text-brand-slate-500">{t.cabinet_events_empty}</p>
            ) : (
              <ul className="space-y-4">
                {events.map((item) => {
                  const joinable = isCabinetMeetingJoinable(item.meeting?.status)
                  const single = events.length === 1
                  return (
                    <li
                      key={item.id}
                      className={`rounded-2xl border border-brand-slate-200 p-4 dark:border-brand-slate-700 ${
                        single ? 'p-5' : ''
                      }`}
                    >
                      <p
                        className={`font-semibold text-brand-slate-900 dark:text-white ${
                          single ? 'text-xl' : 'text-lg'
                        }`}
                      >
                        {eventTitle(item)}
                      </p>
                      <p className="mt-2 text-base text-brand-slate-600 dark:text-brand-slate-300">
                        {formatCabinetEventWhen(item.startAt, currentLang)}
                      </p>
                      <p className="mt-1 text-sm text-brand-slate-500">
                        {meetingStatusText(t, item.meeting?.status)}
                      </p>
                      <button
                        type="button"
                        className={`${cabinetPrimaryBtnClass} mt-4 ${single ? 'py-4 text-lg' : ''}`}
                        disabled={joiningId === item.id || !joinable}
                        onClick={() => void handleJoin(item.id)}
                      >
                        {joiningId === item.id
                          ? t.cabinet_loading
                          : joinable
                            ? t.cabinet_join
                            : t.cabinet_join_unavailable}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="space-y-3 border-t border-brand-slate-200 pt-5 dark:border-brand-slate-700">
            <button
              type="button"
              className={`${cabinetSecondaryBtnClass} w-full justify-between`}
              aria-expanded={settingsOpen}
              onClick={() => {
                setSettingsOpen((open) => !open)
                if (!settingsOpen) setSettingsMessage(null)
              }}
            >
              <span className="inline-flex items-center gap-2">
                <Settings className="h-5 w-5" aria-hidden />
                {t.cabinet_settings_title}
              </span>
              {settingsOpen ? (
                <ChevronUp className="h-5 w-5" aria-hidden />
              ) : (
                <ChevronDown className="h-5 w-5" aria-hidden />
              )}
            </button>
            {settingsOpen ? (
              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className={cabinetLabelClass}>{t.cabinet_display_name}</span>
                  <input
                    className={cabinetInputClass}
                    value={settingsDisplayName}
                    disabled={settingsBusy}
                    onChange={(e) => setSettingsDisplayName(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className={`${cabinetSecondaryBtnClass} w-full`}
                  disabled={settingsBusy}
                  onClick={() => void handleSaveProfile()}
                >
                  {settingsBusy ? t.cabinet_loading : t.cabinet_save_settings}
                </button>
                <div className="space-y-4 border-t border-brand-slate-200 pt-4 dark:border-brand-slate-700">
                  <div>
                    <h3 className="text-lg font-semibold text-brand-slate-900 dark:text-white">
                      {t.cabinet_change_password_title}
                    </h3>
                    <p className="mt-1 text-sm text-brand-slate-500">{t.cabinet_change_password_hint}</p>
                  </div>
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault()
                      void submitPasswordChange({forceFlow: false})
                    }}
                  >
                    <PasswordRevealField
                      label={t.cabinet_current_password}
                      value={currentPassword}
                      onChange={setCurrentPassword}
                      autoComplete="current-password"
                      disabled={settingsBusy}
                      minLength={1}
                      showPassword={showCurrentPassword}
                      onToggleShow={() => setShowCurrentPassword((v) => !v)}
                      showLabel={t.cabinet_show_password}
                      hideLabel={t.cabinet_hide_password}
                    />
                    <PasswordRevealField
                      label={t.cabinet_new_password}
                      value={newPassword}
                      onChange={setNewPassword}
                      autoComplete="new-password"
                      disabled={settingsBusy}
                      minLength={12}
                      maxLength={128}
                      showPassword={showNewPassword}
                      onToggleShow={() => setShowNewPassword((v) => !v)}
                      showLabel={t.cabinet_show_password}
                      hideLabel={t.cabinet_hide_password}
                    />
                    <PasswordRulesChecklist password={newPassword} t={t} />
                    <PasswordRevealField
                      label={t.cabinet_confirm_password}
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      autoComplete="new-password"
                      disabled={settingsBusy}
                      minLength={12}
                      maxLength={128}
                      showPassword={showConfirmPassword}
                      onToggleShow={() => setShowConfirmPassword((v) => !v)}
                      showLabel={t.cabinet_show_password}
                      hideLabel={t.cabinet_hide_password}
                    />
                    <button type="submit" className={cabinetPrimaryBtnClass} disabled={settingsBusy}>
                      {settingsBusy ? t.cabinet_loading : t.cabinet_save_password}
                    </button>
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}
    </CabinetShell>
  )
}
