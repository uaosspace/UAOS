import ContentEditors from './ContentEditors'
import {
  adminInputClass,
  adminLabelClass,
  adminPanelClass,
  adminPrimaryBtnClass,
  adminSecondaryBtnClass,
  adminTabActiveClass,
  adminTabIdleClass,
} from './adminUi'
import {
  applicantKindLabel,
  sectorLabel,
  statsKeyLabel,
  statusLabel,
} from './adminLabels'
import {useCallback, useEffect, useMemo, useState, type FormEvent} from 'react'
import type {Locale} from '../../data/locales'
import {TRANSLATIONS} from '../../data/translations'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import BrandLogo from '../../components/BrandLogo'
import {Loader2, LogOut, ExternalLink} from 'lucide-react'

type AdminUser = {
  id: string
  email: string
  displayName: string
  role: string
  mfaEnabled: boolean
}

type ApplicationItem = {
  id: string
  status: string
  companyName: string
  email: string
  phone: string
  applicantKind: string
  sectors: string[]
  submittedAt: string
  contactPerson: string
  activityField: string
  message: string
}

type Stats = {
  total: number
  byStatus: Array<{key: string; count: number}>
  byApplicantKind: Array<{key: string; count: number}>
  bySector: Array<{key: string; count: number}>
}

type ConfirmDialog =
  | {kind: 'delete-one'; id: string; companyName: string}
  | {kind: 'purge-closed'}

type AdminAppProps = {
  currentLang: Locale
  setCurrentLang: (lang: Locale) => void
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin/${path}`, {
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

function canDeleteApplication(status: string): boolean {
  return status === 'accepted' || status === 'rejected'
}

export default function AdminApp({currentLang, setCurrentLang}: AdminAppProps) {
  const t = TRANSLATIONS[currentLang]
  const [user, setUser] = useState<AdminUser | null>(null)
  const [mfaSetupRequired, setMfaSetupRequired] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaSecret, setMfaSecret] = useState<string | null>(null)
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null)
  const [tab, setTab] = useState<'applications' | 'stats' | 'content' | 'account'>('applications')
  const [apps, setApps] = useState<ApplicationItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [listLoading, setListLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const selected = useMemo(
    () => apps.find((item) => item.id === selectedId) || null,
    [apps, selectedId],
  )
  const isBusy = Boolean(busy)

  const refreshMe = useCallback(async () => {
    try {
      const data = await api<{user: AdminUser; mfaSetupRequired?: boolean}>('auth/me')
      setUser(data.user)
      setMfaSetupRequired(Boolean(data.mfaSetupRequired))
    } catch {
      setUser(null)
    } finally {
      setBootstrapping(false)
    }
  }, [])

  useEffect(() => {
    void refreshMe()
  }, [refreshMe])

  const loadApps = useCallback(async () => {
    setListLoading(true)
    try {
      const query = statusFilter === 'all' ? '' : `?status=${encodeURIComponent(statusFilter)}`
      const data = await api<{items: ApplicationItem[]}>(`applications${query}`)
      setApps(data.items)
    } finally {
      setListLoading(false)
    }
  }, [statusFilter])

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const data = await api<Stats>('applications/stats?period=month')
      setStats(data)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user || mfaSetupRequired) return
    if (tab === 'applications') void loadApps().catch((err) => setError(err.message))
    if (tab === 'stats') void loadStats().catch((err) => setError(err.message))
  }, [user, mfaSetupRequired, tab, loadApps, loadStats])

  async function onLogin(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy('login')
    try {
      const data = await api<{user: AdminUser; mfaSetupRequired?: boolean}>('auth/login', {
        method: 'POST',
        body: JSON.stringify({email, password, mfaCode}),
      })
      setUser(data.user)
      setMfaSetupRequired(Boolean(data.mfaSetupRequired))
      setPassword('')
      setMfaCode('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin_invalid_credentials)
    } finally {
      setBusy(null)
    }
  }

  async function onLogout() {
    setBusy('logout')
    try {
      await api('auth/logout', {method: 'POST'})
      setUser(null)
      setApps([])
      setStats(null)
    } finally {
      setBusy(null)
    }
  }

  async function onChangePassword(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setPasswordMessage(null)
    if (newPassword !== confirmPassword) {
      setError(t.admin_password_mismatch)
      return
    }
    setBusy('password')
    try {
      await api('auth/change-password', {
        method: 'POST',
        body: JSON.stringify({currentPassword, newPassword}),
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage(t.admin_password_changed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password change failed')
    } finally {
      setBusy(null)
    }
  }

  async function startMfa() {
    setBusy('mfa-setup')
    try {
      const data = await api<{secret: string; otpauthUrl: string}>('auth/mfa/setup', {
        method: 'POST',
      })
      setMfaSecret(data.secret)
      setOtpauthUrl(data.otpauthUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MFA setup failed')
    } finally {
      setBusy(null)
    }
  }

  async function confirmMfa(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy('mfa-confirm')
    try {
      await api('auth/mfa/confirm', {method: 'POST', body: JSON.stringify({code: mfaCode})})
      setMfaSetupRequired(false)
      setMfaSecret(null)
      setOtpauthUrl(null)
      setMfaCode('')
      await refreshMe()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MFA confirm failed')
    } finally {
      setBusy(null)
    }
  }

  async function setStatus(status: string) {
    if (!selected || isBusy) return
    setBusy(`status:${status}`)
    setError(null)
    try {
      const data = await api<{item: ApplicationItem}>(`applications/${selected.id}/status`, {
        method: 'POST',
        body: JSON.stringify({status}),
      })
      setApps((prev) =>
        prev.map((item) => (item.id === data.item.id ? {...item, ...data.item} : item)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed')
    } finally {
      setBusy(null)
    }
  }

  async function runConfirmedAction() {
    if (!confirmDialog || isBusy) return
    setError(null)
    setFlash(null)
    if (confirmDialog.kind === 'delete-one') {
      setBusy('delete')
      try {
        await api(`applications/${confirmDialog.id}`, {method: 'DELETE'})
        setApps((prev) => prev.filter((item) => item.id !== confirmDialog.id))
        if (selectedId === confirmDialog.id) setSelectedId(null)
        setConfirmDialog(null)
        if (tab === 'stats') await loadStats()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed')
      } finally {
        setBusy(null)
      }
      return
    }

    setBusy('purge')
    try {
      const data = await api<{deleted: number}>('applications/closed', {method: 'DELETE'})
      setFlash(`${t.admin_stats_cleared}: ${data.deleted}`)
      setConfirmDialog(null)
      await loadStats()
      if (tab === 'applications') await loadApps()
      setSelectedId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purge failed')
    } finally {
      setBusy(null)
    }
  }

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <LanguageSwitcher currentLang={currentLang} setCurrentLang={setCurrentLang} />
      <a href="/" className={adminSecondaryBtnClass}>
        <ExternalLink size={16} className="mr-1.5 opacity-70" aria-hidden />
        {t.admin_site_link}
      </a>
      {user ? (
        <button
          type="button"
          className={adminSecondaryBtnClass}
          disabled={isBusy}
          onClick={() => void onLogout()}
        >
          {busy === 'logout' ? (
            <Loader2 size={16} className="mr-1.5 animate-spin opacity-70" aria-hidden />
          ) : (
            <LogOut size={16} className="mr-1.5 opacity-70" aria-hidden />
          )}
          {t.admin_sign_out}
        </button>
      ) : null}
    </div>
  )

  if (bootstrapping) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-brand-slate-600 dark:text-brand-slate-300">
        <Loader2 className="h-5 w-5 animate-spin text-brand-blue-500" aria-hidden />
        <span className="text-sm">{t.admin_loading}</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-center justify-between gap-3">
          <BrandLogo />
          {toolbar}
        </div>
        <div className={`${adminPanelClass} space-y-6`}>
          <div>
            <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-brand-blue-500 dark:text-brand-sky-300">
              UAOS
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-brand-slate-900 dark:text-white">
              {t.admin_login_title}
            </h1>
            <p className="mt-2 text-sm text-brand-slate-600 dark:text-brand-slate-300">
              {t.admin_login_subtitle}
            </p>
          </div>
          <form onSubmit={onLogin} className="space-y-4">
            <label className="block space-y-1.5">
              <span className={adminLabelClass}>{t.admin_email}</span>
              <input
                className={adminInputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                type="email"
                required
              />
            </label>
            <label className="block space-y-1.5">
              <span className={adminLabelClass}>{t.admin_password}</span>
              <input
                className={adminInputClass}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <label className="block space-y-1.5">
              <span className={adminLabelClass}>{t.admin_mfa_code}</span>
              <input
                className={adminInputClass}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                autoComplete="one-time-code"
                inputMode="numeric"
              />
            </label>
            {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
            <button
              className={`${adminPrimaryBtnClass} w-full`}
              type="submit"
              disabled={busy === 'login'}
            >
              {busy === 'login' ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t.admin_busy}
                </span>
              ) : (
                t.admin_btn_login
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (mfaSetupRequired) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-center justify-between gap-3">
          <BrandLogo />
          {toolbar}
        </div>
        <div className={`${adminPanelClass} space-y-5`}>
          <div>
            <h1 className="font-display text-2xl font-semibold text-brand-slate-900 dark:text-white">
              {t.admin_mfa_title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-brand-slate-600 dark:text-brand-slate-300">
              {t.admin_mfa_help}
            </p>
          </div>
          {!mfaSecret ? (
            <button className={adminPrimaryBtnClass} type="button" onClick={() => void startMfa()}>
              {t.admin_mfa_generate}
            </button>
          ) : (
            <form onSubmit={confirmMfa} className="space-y-4">
              <div className="rounded-xl border border-brand-slate-200 bg-brand-slate-50/80 p-3 dark:border-brand-slate-700 dark:bg-brand-slate-900/60">
                <p className={adminLabelClass}>{t.admin_mfa_secret_label}</p>
                <p className="mt-1 break-all font-mono text-xs text-brand-slate-800 dark:text-brand-slate-200">
                  {mfaSecret}
                </p>
                {otpauthUrl ? (
                  <p className="mt-2 break-all font-mono text-[10px] text-brand-slate-500">{otpauthUrl}</p>
                ) : null}
              </div>
              <label className="block space-y-1.5">
                <span className={adminLabelClass}>{t.admin_mfa_code_enter}</span>
                <input
                  className={adminInputClass}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                />
              </label>
              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
              <button className={adminPrimaryBtnClass} type="submit">
                {t.admin_mfa_confirm}
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  const tabs: Array<{id: typeof tab; label: string}> = [
    {id: 'applications', label: t.admin_tab_applications},
    {id: 'stats', label: t.admin_tab_stats},
    {id: 'content', label: t.admin_tab_content},
    {id: 'account', label: t.admin_tab_account},
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <BrandLogo />
          <div>
            <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-brand-blue-500 dark:text-brand-sky-300">
              Admin
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-brand-slate-900 dark:text-white sm:text-3xl">
              {t.admin_title}
            </h1>
            <p className="mt-1 text-sm text-brand-slate-600 dark:text-brand-slate-300">
              {user.email} · {user.role}
            </p>
          </div>
        </div>
        {toolbar}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? adminTabActiveClass : adminTabIdleClass}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {flash ? (
        <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-400" role="status">
          {flash}
        </p>
      ) : null}
      {isBusy ? (
        <p
          className="mt-3 inline-flex items-center gap-2 text-sm text-brand-slate-500 dark:text-brand-slate-400"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin text-brand-blue-500" aria-hidden />
          {t.admin_working}
        </p>
      ) : null}

      {tab === 'applications' ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className={adminPanelClass}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2">
                <span className="sr-only">{t.admin_tab_applications}</span>
                <select
                  className={`${adminInputClass} w-auto min-w-[10rem]`}
                  value={statusFilter}
                  disabled={isBusy || listLoading}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">{t.admin_app_status_all}</option>
                  <option value="pending">{t.admin_app_status_pending}</option>
                  <option value="reviewed">{t.admin_app_status_reviewed}</option>
                  <option value="accepted">{t.admin_app_status_accepted}</option>
                  <option value="rejected">{t.admin_app_status_rejected}</option>
                </select>
              </label>
              <a
                className="text-sm font-medium text-brand-blue-600 underline-offset-2 hover:underline dark:text-brand-sky-300"
                href="/api/admin/applications/export"
              >
                {t.admin_export_csv}
              </a>
            </div>
            {listLoading ? (
              <p className="inline-flex items-center gap-2 text-sm text-brand-slate-500 dark:text-brand-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t.admin_loading}
              </p>
            ) : apps.length === 0 ? (
              <p className="text-sm text-brand-slate-500 dark:text-brand-slate-400">
                {t.admin_empty_applications}
              </p>
            ) : (
              <ul className="divide-y divide-brand-slate-200 dark:divide-brand-slate-700">
                {apps.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`w-full rounded-xl px-3 py-3 text-left transition ${
                        selectedId === item.id
                          ? 'bg-brand-blue-50 dark:bg-brand-blue-950/40'
                          : 'hover:bg-brand-slate-50 dark:hover:bg-brand-slate-800/60'
                      }`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <div className="font-medium text-brand-slate-900 dark:text-white">
                        {item.companyName}
                      </div>
                      <div className="mt-0.5 text-xs text-brand-slate-500 dark:text-brand-slate-400">
                        {statusLabel(t, item.status)} ·{' '}
                        {applicantKindLabel(currentLang, t, item.applicantKind)} ·{' '}
                        {item.submittedAt.slice(0, 10)}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={adminPanelClass}>
            {selected ? (
              <div className="space-y-3 text-sm text-brand-slate-700 dark:text-brand-slate-200">
                <h2 className="font-display text-xl font-semibold text-brand-slate-900 dark:text-white">
                  {selected.companyName}
                </h2>
                <p>
                  <span className={adminLabelClass}>{t.admin_field_contact}</span>
                  <span className="mt-1 block">{selected.contactPerson}</span>
                </p>
                <p>
                  <span className={adminLabelClass}>{t.admin_field_email}</span>
                  <span className="mt-1 block">{selected.email}</span>
                </p>
                <p>
                  <span className={adminLabelClass}>{t.admin_field_phone}</span>
                  <span className="mt-1 block">{selected.phone}</span>
                </p>
                <p>
                  <span className={adminLabelClass}>{t.admin_field_activity}</span>
                  <span className="mt-1 block">{selected.activityField}</span>
                </p>
                <p>
                  <span className={adminLabelClass}>{t.admin_field_sectors}</span>
                  <span className="mt-1 block">
                    {selected.sectors.length
                      ? selected.sectors
                          .map((sector) => sectorLabel(currentLang, t, sector))
                          .join(', ')
                      : '—'}
                  </span>
                </p>
                <p>
                  <span className={adminLabelClass}>{t.admin_field_message}</span>
                  <span className="mt-1 block whitespace-pre-wrap">{selected.message || '—'}</span>
                </p>
                <div className="flex flex-wrap gap-2 border-t border-brand-slate-200 pt-4 dark:border-brand-slate-700">
                  {(['pending', 'reviewed', 'accepted', 'rejected'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={isBusy}
                      className={
                        selected.status === status ? adminPrimaryBtnClass : adminSecondaryBtnClass
                      }
                      onClick={() => void setStatus(status)}
                    >
                      {busy === `status:${status}` ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                          {statusLabel(t, status)}
                        </span>
                      ) : (
                        statusLabel(t, status)
                      )}
                    </button>
                  ))}
                  {canDeleteApplication(selected.status) ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      className={adminSecondaryBtnClass}
                      onClick={() =>
                        setConfirmDialog({
                          kind: 'delete-one',
                          id: selected.id,
                          companyName: selected.companyName,
                        })
                      }
                    >
                      {t.admin_delete_application}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-sm text-brand-slate-500 dark:text-brand-slate-400">
                {t.admin_select_application}
              </p>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'stats' ? (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={adminSecondaryBtnClass}
              disabled={isBusy || statsLoading}
              onClick={() => setConfirmDialog({kind: 'purge-closed'})}
            >
              {t.admin_stats_clear_closed}
            </button>
          </div>
          {statsLoading && !stats ? (
            <p className="inline-flex items-center gap-2 text-sm text-brand-slate-500 dark:text-brand-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t.admin_loading}
            </p>
          ) : stats ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className={adminPanelClass}>
                <div className={adminLabelClass}>{t.admin_stats_total}</div>
                <div className="mt-2 font-display text-3xl font-semibold text-brand-slate-900 dark:text-white">
                  {stats.total}
                </div>
              </div>
              {(
                [
                  ['status', t.admin_stats_by_status, stats.byStatus],
                  ['applicantKind', t.admin_stats_by_kind, stats.byApplicantKind],
                  ['sector', t.admin_stats_by_sector, stats.bySector],
                ] as const
              ).map(([kind, title, rows]) => (
                <div key={kind} className={adminPanelClass}>
                  <h3 className="font-display text-base font-semibold text-brand-slate-900 dark:text-white">
                    {title}
                  </h3>
                  <ul className="mt-3 space-y-1.5 text-sm text-brand-slate-600 dark:text-brand-slate-300">
                    {rows.map((row) => (
                      <li key={row.key} className="flex justify-between gap-3">
                        <span>{statsKeyLabel(kind, row.key, currentLang, t)}</span>
                        <span className="font-medium tabular-nums text-brand-slate-900 dark:text-white">
                          {row.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === 'content' ? <ContentEditors currentLang={currentLang} /> : null}

      {tab === 'account' ? (
        <div className={`${adminPanelClass} max-w-lg`}>
          <h2 className="font-display text-xl font-semibold text-brand-slate-900 dark:text-white">
            {t.admin_change_password_title}
          </h2>
          <p className="mt-1 text-sm text-brand-slate-500 dark:text-brand-slate-400">
            {t.admin_change_password_hint}
          </p>
          <form className="mt-5 space-y-4" onSubmit={(event) => void onChangePassword(event)}>
            <label className="block">
              <span className={adminLabelClass}>{t.admin_current_password}</span>
              <input
                type="password"
                autoComplete="current-password"
                className={`${adminInputClass} mt-1`}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className={adminLabelClass}>{t.admin_new_password}</span>
              <input
                type="password"
                autoComplete="new-password"
                className={`${adminInputClass} mt-1`}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={12}
              />
            </label>
            <label className="block">
              <span className={adminLabelClass}>{t.admin_confirm_password}</span>
              <input
                type="password"
                autoComplete="new-password"
                className={`${adminInputClass} mt-1`}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={12}
              />
            </label>
            {passwordMessage ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-400">{passwordMessage}</p>
            ) : null}
            <button
              type="submit"
              className={adminPrimaryBtnClass}
              disabled={busy === 'password'}
            >
              {busy === 'password' ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t.admin_busy}
                </span>
              ) : (
                t.admin_change_password_submit
              )}
            </button>
          </form>
        </div>
      ) : null}

      {confirmDialog ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-confirm-title"
        >
          <div className={`${adminPanelClass} max-w-md space-y-4 shadow-xl`}>
            <h2
              id="admin-confirm-title"
              className="font-display text-lg font-semibold text-brand-slate-900 dark:text-white"
            >
              {confirmDialog.kind === 'delete-one'
                ? t.admin_delete_application
                : t.admin_stats_clear_closed}
            </h2>
            <p className="text-sm text-brand-slate-600 dark:text-brand-slate-300">
              {confirmDialog.kind === 'delete-one'
                ? `${t.admin_delete_application_confirm} (${confirmDialog.companyName})`
                : t.admin_stats_clear_closed_confirm}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className={adminSecondaryBtnClass}
                disabled={isBusy}
                onClick={() => setConfirmDialog(null)}
              >
                {t.admin_cancel}
              </button>
              <button
                type="button"
                className={adminPrimaryBtnClass}
                disabled={isBusy}
                onClick={() => void runConfirmedAction()}
              >
                {busy === 'delete' || busy === 'purge' ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {t.admin_busy}
                  </span>
                ) : (
                  t.admin_confirm_action
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
