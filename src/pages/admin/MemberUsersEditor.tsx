import {useCallback, useEffect, useState, type FormEvent} from 'react'
import type {Locale} from '../../data/locales'
import {TRANSLATIONS} from '../../data/translations'
import {
  adminInputClass,
  adminLabelClass,
  adminPanelClass,
  adminPrimaryBtnClass,
  adminSecondaryBtnClass,
} from './adminUi'
import {accessLevelLabel} from './adminLabels'

const ACCESS_LEVELS = ['partner', 'member', 'staff', 'board'] as const

type CabinetUser = {
  id: string
  email: string
  displayName: string
  accessLevel: string
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

export default function MemberUsersEditor({currentLang}: {currentLang: Locale}) {
  const t = TRANSLATIONS[currentLang]
  const [items, setItems] = useState<CabinetUser[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [createLevel, setCreateLevel] = useState<string>('member')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [levelDrafts, setLevelDrafts] = useState<Record<string, string>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const data = await api<{items: Array<CabinetUser & {roles?: string[]}>}>('member-users')
    const normalized = data.items.map((item) => ({
      id: item.id,
      email: item.email,
      displayName: item.displayName,
      accessLevel: item.accessLevel || item.roles?.[0] || 'member',
    }))
    setItems(normalized)
    const drafts: Record<string, string> = {}
    for (const item of normalized) drafts[item.id] = item.accessLevel
    setLevelDrafts(drafts)
  }, [])

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [load])

  async function createUser(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    try {
      await api('member-users', {
        method: 'POST',
        body: JSON.stringify({email, password, displayName, accessLevel: createLevel}),
      })
      setEmail('')
      setPassword('')
      setDisplayName('')
      setCreateLevel('member')
      setMessage(t.admin_saved)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    }
  }

  async function saveLevel(userId: string) {
    setError(null)
    setMessage(null)
    try {
      await api(`member-users/${userId}/access-level`, {
        method: 'PUT',
        body: JSON.stringify({accessLevel: levelDrafts[userId] ?? 'member'}),
      })
      setMessage(t.admin_saved)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  async function deleteUser(userId: string, userEmail: string) {
    if (!window.confirm(`${t.admin_cabinet_user_delete_confirm}\n${userEmail}`)) return
    setError(null)
    setMessage(null)
    setDeletingId(userId)
    try {
      await api(`member-users/${userId}`, {method: 'DELETE'})
      setMessage(t.admin_cabinet_user_deleted)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin_cabinet_user_delete_failed)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {message ? <p className="text-sm text-brand-blue-600 dark:text-brand-sky-300">{message}</p> : null}

      <form className={`${adminPanelClass} grid gap-3 md:grid-cols-2`} onSubmit={(e) => void createUser(e)}>
        <label className="block space-y-1.5 text-sm">
          <span className={adminLabelClass}>{t.admin_cabinet_user_email}</span>
          <input className={adminInputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className={adminLabelClass}>{t.admin_cabinet_user_password}</span>
          <input
            className={adminInputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={12}
          />
        </label>
        <label className="block space-y-1.5 text-sm md:col-span-2">
          <span className={adminLabelClass}>{t.admin_cabinet_user_name}</span>
          <input className={adminInputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label className="block space-y-1.5 text-sm md:col-span-2">
          <span className={adminLabelClass}>{t.admin_cabinet_user_access_level}</span>
          <select
            className={adminInputClass}
            value={createLevel}
            onChange={(e) => setCreateLevel(e.target.value)}
          >
            {ACCESS_LEVELS.map((level) => (
              <option key={level} value={level}>
                {accessLevelLabel(t, level)}
              </option>
            ))}
          </select>
        </label>
        <div className="md:col-span-2">
          <button className={adminPrimaryBtnClass} type="submit">
            {t.admin_cabinet_user_create}
          </button>
        </div>
      </form>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className={`${adminPanelClass} space-y-3`}>
            <div className="text-sm">
              <p className="font-medium text-brand-slate-900 dark:text-white">{item.email}</p>
              <p className="text-brand-slate-500">{item.displayName || '—'}</p>
            </div>
            <label className="block space-y-1.5 text-sm max-w-xs">
              <span className={adminLabelClass}>{t.admin_cabinet_user_access_level}</span>
              <select
                className={adminInputClass}
                value={levelDrafts[item.id] ?? 'member'}
                onChange={(e) =>
                  setLevelDrafts((prev) => ({
                    ...prev,
                    [item.id]: e.target.value,
                  }))
                }
              >
                {ACCESS_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {accessLevelLabel(t, level)}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              <button className={adminSecondaryBtnClass} type="button" onClick={() => void saveLevel(item.id)}>
                {t.admin_cabinet_user_save_access}
              </button>
              <button
                className={`${adminSecondaryBtnClass} border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40`}
                type="button"
                disabled={deletingId === item.id}
                onClick={() => void deleteUser(item.id, item.email)}
              >
                {deletingId === item.id ? t.admin_loading : t.admin_cabinet_user_delete}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
