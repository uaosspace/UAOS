import {useCallback, useEffect, useState, type FormEvent} from 'react'
import {ExternalLink, Loader2, LogOut} from 'lucide-react'
import type {Locale} from '../../data/locales'
import {TRANSLATIONS} from '../../data/translations'
import BrandLogo from '../../components/BrandLogo'
import LanguageSwitcher from '../../components/LanguageSwitcher'
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
}

type CabinetAppProps = {
  currentLang: Locale
  setCurrentLang: (lang: Locale) => void
  onBackToSite: () => void
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/member/${path}`, {
    credentials: 'include',
    headers: {'Content-Type': 'application/json', ...(init?.headers || {})},
    ...init,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Request failed')
  }
  return data as T
}

export default function CabinetApp({currentLang, setCurrentLang, onBackToSite}: CabinetAppProps) {
  const t = TRANSLATIONS[currentLang]
  const [user, setUser] = useState<MemberUser | null>(null)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [stubMessage, setStubMessage] = useState<string | null>(null)

  const refreshMe = useCallback(async () => {
    const data = await api<{user: MemberUser}>('auth/me')
    setUser(data.user)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        await refreshMe()
        const summary = await api<{stub: {message: string}}>('cabinet/summary')
        if (!cancelled) setStubMessage(summary.stub.message)
      } catch {
        if (!cancelled) {
          setUser(null)
          setStubMessage(null)
        }
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refreshMe])

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const data = await api<{user: MemberUser}>('auth/login', {
        method: 'POST',
        body: JSON.stringify({email, password}),
      })
      setUser(data.user)
      setPassword('')
      const summary = await api<{stub: {message: string}}>('cabinet/summary')
      setStubMessage(summary.stub.message)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(
        message.includes('Invalid credentials') ? t.cabinet_invalid_credentials : message,
      )
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
      setStubMessage(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
    } finally {
      setBusy(false)
    }
  }

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-brand-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {t.cabinet_loading}
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
            <p className="mt-1 text-sm text-brand-slate-500 dark:text-brand-slate-400">
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
          <p className="text-sm leading-relaxed text-brand-slate-600 dark:text-brand-slate-300">
            {t.cabinet_stub_body}
          </p>
          {stubMessage ? (
            <p className="rounded-lg border border-dashed border-brand-slate-300 px-3 py-2 text-xs text-brand-slate-500 dark:border-brand-slate-600">
              {stubMessage}
            </p>
          ) : null}
        </section>
      )}
    </div>
  )
}
