import {useCallback, useEffect, useState, type FormEvent} from 'react'
import {ChevronDown, ChevronUp, ExternalLink, Loader2, LogOut, Settings} from 'lucide-react'
import type {Locale} from '../../data/locales'
import {TRANSLATIONS} from '../../data/translations'
import BrandLogo from '../../components/BrandLogo'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import {localizeCabinetApiError} from '../../lib/cabinetApiErrors'
import {
  adminInputClass,
  adminLabelClass,
  adminPanelClass,
  adminPrimaryBtnClass,
  adminSecondaryBtnClass,
} from '../admin/adminUi'

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

function accessLevelText(
  t: (typeof TRANSLATIONS)[Locale],
  level: string | undefined,
): string {
  switch (level) {
    case 'partner':
      return t.cabinet_access_partner
    case 'member':
      return t.cabinet_access_member
    case 'staff':
      return t.cabinet_access_staff
    case 'board':
      return t.cabinet_access_board
    default:
      return level || '—'
  }
}

export default function CabinetApp({currentLang, setCurrentLang, onBackToSite}: CabinetAppProps) {
  const t = TRANSLATIONS[currentLang]
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
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null)
  const [settingsBusy, setSettingsBusy] = useState(false)

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

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const data = await api<{user: MemberUser; items?: CabinetEvent[]}>('auth/login', {
        method: 'POST',
        body: JSON.stringify({email, password}),
      })
      applySession(data.user, data.items ?? [])
      setPassword('')
      setSettingsOpen(Boolean(data.user.mustChangePassword))
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

  async function handleLogout() {
    setBusy(true)
    setError(null)
    try {
      await api('auth/logout', {method: 'POST', body: '{}'})
      setUser(null)
      setEvents([])
      setSettingsOpen(false)
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

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault()
    if (!currentPassword.trim() || !newPassword.trim()) {
      setError(t.cabinet_password_fields_required)
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
      setCurrentPassword('')
      setNewPassword('')
      setSettingsMessage(t.cabinet_password_changed)
    } catch (err) {
      setError(mapError(err, t.cabinet_password_change_failed))
    } finally {
      setSettingsBusy(false)
    }
  }

  if (bootstrapping) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <BrandLogo className="h-10 w-auto" />
          <div className="flex items-center gap-2">
            <LanguageSwitcher currentLang={currentLang} setCurrentLang={setCurrentLang} />
            <button type="button" className={adminSecondaryBtnClass} onClick={onBackToSite}>
              <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden />
              {t.cabinet_back_site}
            </button>
          </div>
        </header>
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-brand-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {t.cabinet_loading}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <BrandLogo className="h-10 w-auto" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher currentLang={currentLang} setCurrentLang={setCurrentLang} />
          <button type="button" className={adminSecondaryBtnClass} onClick={onBackToSite}>
            <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden />
            {t.cabinet_back_site}
          </button>
        </div>
      </header>

      {!user ? (
        <form className={`${adminPanelClass} space-y-4`} onSubmit={(e) => void handleLogin(e)}>
          <div>
            <h1 className="text-xl font-semibold text-brand-slate-900 dark:text-white">
              {t.cabinet_login_title}
            </h1>
            <p className="mt-1 text-sm text-brand-slate-600 dark:text-brand-slate-300">
              {t.cabinet_login_subtitle}
            </p>
          </div>
          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          <label className="block space-y-1.5">
            <span className={adminLabelClass}>{t.cabinet_email}</span>
            <input
              className={adminInputClass}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block space-y-1.5">
            <span className={adminLabelClass}>{t.cabinet_password}</span>
            <input
              className={adminInputClass}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" className={adminPrimaryBtnClass} disabled={busy}>
            {busy ? t.cabinet_loading : t.cabinet_sign_in}
          </button>
        </form>
      ) : (
        <section className={`${adminPanelClass} space-y-4`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-brand-slate-500">
                {t.cabinet_welcome}
              </p>
              <h1 className="mt-1 text-xl font-semibold text-brand-slate-900 dark:text-white">
                {t.cabinet_stub_title}
              </h1>
              <p className="mt-1 text-sm text-brand-slate-600 dark:text-brand-slate-300">
                {user.displayName || user.email}
              </p>
              <p className="text-xs text-brand-slate-500">{user.email}</p>
              {user.accessLevel || user.roles?.length ? (
                <p className="mt-1 text-xs text-brand-slate-500">
                  {t.cabinet_roles}:{' '}
                  {accessLevelText(t, user.accessLevel || user.roles?.[0])}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className={adminSecondaryBtnClass}
              onClick={() => void handleLogout()}
              disabled={busy}
            >
              <LogOut className="mr-1.5 h-4 w-4" aria-hidden />
              {t.cabinet_sign_out}
            </button>
          </div>
          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          {user.mustChangePassword ? (
            <div
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
              role="status"
            >
              <p>{t.cabinet_must_change_password}</p>
              {!settingsOpen ? (
                <button
                  type="button"
                  className="mt-2 text-sm font-medium underline underline-offset-2"
                  onClick={() => setSettingsOpen(true)}
                >
                  {t.cabinet_must_change_password_cta}
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-3 border-t border-brand-slate-200 pt-4 dark:border-brand-slate-700">
            <h2 className="text-sm font-semibold text-brand-slate-900 dark:text-white">
              {t.cabinet_events_title}
            </h2>
            {eventsLoading ? (
              <p className="flex items-center gap-2 text-sm text-brand-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                {t.cabinet_events_loading}
              </p>
            ) : events.length === 0 ? (
              <p className="text-sm text-brand-slate-500">{t.cabinet_events_empty}</p>
            ) : (
              <ul className="space-y-3">
                {events.map((item) => {
                  const title =
                    currentLang === 'uk' ? item.titleUk || item.titleEn : item.titleEn || item.titleUk
                  return (
                    <li
                      key={item.id}
                      className="rounded-xl border border-brand-slate-200 p-3 dark:border-brand-slate-700"
                    >
                      <p className="font-medium text-brand-slate-900 dark:text-white">{title}</p>
                      <p className="mt-1 text-xs text-brand-slate-500">
                        {new Date(item.startAt).toLocaleString()}
                        {item.meeting ? ` · ${item.meeting.provider} · ${item.meeting.status}` : ''}
                      </p>
                      <button
                        type="button"
                        className={`${adminPrimaryBtnClass} mt-3`}
                        disabled={joiningId === item.id || !item.meeting}
                        onClick={() => void handleJoin(item.id)}
                      >
                        {joiningId === item.id ? t.cabinet_loading : t.cabinet_join}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="space-y-3 border-t border-brand-slate-200 pt-4 dark:border-brand-slate-700">
            <button
              type="button"
              className={`${adminSecondaryBtnClass} w-full justify-between`}
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen((open) => !open)}
            >
              <span className="inline-flex items-center gap-2">
                <Settings className="h-4 w-4" aria-hidden />
                {t.cabinet_settings_title}
              </span>
              {settingsOpen ? (
                <ChevronUp className="h-4 w-4" aria-hidden />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden />
              )}
            </button>
            {settingsOpen ? (
              <div className="space-y-3">
                <p className="sr-only">
                  {settingsOpen ? t.cabinet_settings_close : t.cabinet_settings_open}
                </p>
                {settingsMessage ? (
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">{settingsMessage}</p>
                ) : null}
                <label className="block space-y-1.5 text-sm">
                  <span className={adminLabelClass}>{t.cabinet_display_name}</span>
                  <input
                    className={adminInputClass}
                    value={settingsDisplayName}
                    disabled={settingsBusy}
                    onChange={(e) => setSettingsDisplayName(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className={adminSecondaryBtnClass}
                  disabled={settingsBusy}
                  onClick={() => void handleSaveProfile()}
                >
                  {settingsBusy ? t.cabinet_loading : t.cabinet_save_settings}
                </button>
                <div className="space-y-3 border-t border-brand-slate-200 pt-3 dark:border-brand-slate-700">
                  <div>
                    <h3 className="text-sm font-semibold text-brand-slate-900 dark:text-white">
                      {t.cabinet_change_password_title}
                    </h3>
                    {!user.mustChangePassword ? (
                      <p className="mt-1 text-xs text-brand-slate-500">
                        {t.cabinet_change_password_hint}
                      </p>
                    ) : null}
                  </div>
                  <form
                    className="space-y-3"
                    onSubmit={(e) => void handleChangePassword(e)}
                  >
                    <label className="block space-y-1.5 text-sm">
                      <span className={adminLabelClass}>{t.cabinet_current_password}</span>
                      <input
                        className={adminInputClass}
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        disabled={settingsBusy}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        minLength={1}
                      />
                    </label>
                    <label className="block space-y-1.5 text-sm">
                      <span className={adminLabelClass}>{t.cabinet_new_password}</span>
                      <input
                        className={adminInputClass}
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        disabled={settingsBusy}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={12}
                      />
                    </label>
                    <button type="submit" className={adminPrimaryBtnClass} disabled={settingsBusy}>
                      {settingsBusy ? t.cabinet_loading : t.cabinet_save_password}
                    </button>
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}
    </div>
  )
}
