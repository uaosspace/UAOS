import ContentEditors from './ContentEditors'
import {useCallback, useEffect, useMemo, useState, type FormEvent} from 'react'

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

export default function AdminApp() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [mfaSetupRequired, setMfaSetupRequired] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaSecret, setMfaSecret] = useState<string | null>(null)
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null)
  const [tab, setTab] = useState<'applications' | 'stats' | 'content'>('applications')
  const [apps, setApps] = useState<ApplicationItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const selected = useMemo(
    () => apps.find((item) => item.id === selectedId) || null,
    [apps, selectedId],
  )

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
    const query = statusFilter === 'all' ? '' : `?status=${encodeURIComponent(statusFilter)}`
    const data = await api<{items: ApplicationItem[]}>(`applications${query}`)
    setApps(data.items)
  }, [statusFilter])

  const loadStats = useCallback(async () => {
    const data = await api<Stats>('applications/stats?period=month')
    setStats(data)
  }, [])

  useEffect(() => {
    if (!user || mfaSetupRequired) return
    if (tab === 'applications') void loadApps().catch((err) => setError(err.message))
    if (tab === 'stats') void loadStats().catch((err) => setError(err.message))
  }, [user, mfaSetupRequired, tab, loadApps, loadStats])

  async function onLogin(event: FormEvent) {
    event.preventDefault()
    setError(null)
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
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  async function onLogout() {
    await api('auth/logout', {method: 'POST'})
    setUser(null)
    setApps([])
    setStats(null)
  }

  async function startMfa() {
    const data = await api<{secret: string; otpauthUrl: string}>('auth/mfa/setup', {method: 'POST'})
    setMfaSecret(data.secret)
    setOtpauthUrl(data.otpauthUrl)
  }

  async function confirmMfa(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await api('auth/mfa/confirm', {method: 'POST', body: JSON.stringify({code: mfaCode})})
      setMfaSetupRequired(false)
      setMfaSecret(null)
      setOtpauthUrl(null)
      setMfaCode('')
      await refreshMe()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MFA confirm failed')
    }
  }

  async function setStatus(status: string) {
    if (!selected) return
    const data = await api<{item: ApplicationItem}>(`applications/${selected.id}/status`, {
      method: 'POST',
      body: JSON.stringify({status}),
    })
    setApps((prev) => prev.map((item) => (item.id === data.item.id ? {...item, ...data.item} : item)))
  }

  if (bootstrapping) {
    return <div className="mx-auto max-w-3xl p-8 text-slate-700 dark:text-slate-200">Loading…</div>
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md p-8">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">UAOS Admin</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Protected console for applications and content.
        </p>
        <form onSubmit={onLogin} className="mt-6 space-y-3">
          <input
            className="w-full rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
          <input
            className="w-full rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <input
            className="w-full rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
            placeholder="MFA code (if enabled)"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            autoComplete="one-time-code"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button className="w-full rounded bg-cyan-700 px-3 py-2 text-white" type="submit">
            Sign in
          </button>
        </form>
      </div>
    )
  }

  if (mfaSetupRequired) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <h1 className="text-2xl font-semibold">Enable MFA</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Roles with PII access require TOTP MFA before application data is available.
        </p>
        {!mfaSecret ? (
          <button className="mt-4 rounded bg-cyan-700 px-3 py-2 text-white" onClick={() => void startMfa()}>
            Generate MFA secret
          </button>
        ) : (
          <form onSubmit={confirmMfa} className="mt-4 space-y-3">
            <p className="break-all text-xs">Secret: {mfaSecret}</p>
            {otpauthUrl ? <p className="break-all text-xs">otpauth: {otpauthUrl}</p> : null}
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="Enter 6-digit code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button className="rounded bg-cyan-700 px-3 py-2 text-white" type="submit">
              Confirm MFA
            </button>
          </form>
        )}
        <button className="mt-6 text-sm underline" onClick={() => void onLogout()}>
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">UAOS Admin</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {user.email} · {user.role}
          </p>
        </div>
        <div className="flex gap-2">
          <a className="rounded border px-3 py-2 text-sm" href="/">
            Site
          </a>
          <button className="rounded border px-3 py-2 text-sm" onClick={() => void onLogout()}>
            Sign out
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {(['applications', 'stats', 'content'] as const).map((name) => (
          <button
            key={name}
            className={`rounded px-3 py-1.5 text-sm ${tab === name ? 'bg-cyan-700 text-white' : 'border'}`}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {tab === 'applications' ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <select
                className="rounded border px-2 py-1 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
              <a className="text-sm underline" href="/api/admin/applications/export">
                Export CSV
              </a>
            </div>
            <ul className="divide-y rounded border dark:divide-slate-700 dark:border-slate-700">
              {apps.map((item) => (
                <li key={item.id}>
                  <button
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className="font-medium">{item.companyName}</div>
                    <div className="text-xs text-slate-500">
                      {item.status} · {item.applicantKind || 'untyped'} · {item.submittedAt.slice(0, 10)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded border p-4 dark:border-slate-700">
            {selected ? (
              <div className="space-y-2 text-sm">
                <h2 className="text-lg font-semibold">{selected.companyName}</h2>
                <p>Contact: {selected.contactPerson}</p>
                <p>Email: {selected.email}</p>
                <p>Phone: {selected.phone}</p>
                <p>Activity: {selected.activityField}</p>
                <p>Sectors: {selected.sectors.join(', ') || '—'}</p>
                <p className="whitespace-pre-wrap">Message: {selected.message || '—'}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {['pending', 'reviewed', 'accepted', 'rejected'].map((status) => (
                    <button
                      key={status}
                      className="rounded border px-2 py-1"
                      onClick={() => void setStatus(status).catch((err) => setError(err.message))}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Select an application</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'stats' && stats ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded border p-4 dark:border-slate-700">
            <div className="text-sm text-slate-500">Applications (period)</div>
            <div className="text-3xl font-semibold">{stats.total}</div>
          </div>
          {[
            ['By status', stats.byStatus],
            ['By kind', stats.byApplicantKind],
            ['By sector', stats.bySector],
          ].map(([title, rows]) => (
            <div key={String(title)} className="rounded border p-4 dark:border-slate-700">
              <h3 className="font-medium">{String(title)}</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {(rows as Array<{key: string; count: number}>).map((row) => (
                  <li key={row.key} className="flex justify-between gap-3">
                    <span>{row.key}</span>
                    <span>{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'content' ? <ContentEditors /> : null}
    </div>
  )
}
