import {useCallback, useEffect, useState} from 'react'
import type {Locale} from '../../data/locales'
import {TRANSLATIONS} from '../../data/translations'
import {
  adminInputClass,
  adminLabelClass,
  adminPanelClass,
  adminPrimaryBtnClass,
  adminSecondaryBtnClass,
} from './adminUi'

type MeetingListItem = {
  id: string
  eventId: string
  eventSlug: string
  titleUk: string
  titleEn: string
  status: string
  provider: string
  lastSyncError: string
  scheduledStartAt: string | null
}

type ReportListItem = {
  id: string
  eventId: string
  eventSlug: string
  titleUk: string
  titleEn: string
  status: string
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

type MeetingsManagerProps = {
  currentLang: Locale
  onOpenEvent: (eventId: string) => void
}

/** Dispatcher: overview, ops email, signal inbox. Protocol editing lives on the event card. */
export default function MeetingsManager({currentLang, onOpenEvent}: MeetingsManagerProps) {
  const t = TRANSLATIONS[currentLang]
  const [tab, setTab] = useState<'list' | 'reports' | 'settings' | 'inbox'>('list')
  const [meetings, setMeetings] = useState<MeetingListItem[]>([])
  const [reports, setReports] = useState<ReportListItem[]>([])
  const [inbox, setInbox] = useState<
    Array<{id: string; provider: string; externalEventType: string; status: string}>
  >([])
  const [emailsText, setEmailsText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadList = useCallback(async () => {
    const data = await api<{items: MeetingListItem[]}>('meetings/list')
    setMeetings(data.items)
  }, [])

  const loadReports = useCallback(async () => {
    const data = await api<{items: ReportListItem[]}>('meetings/reports')
    setReports(data.items)
  }, [])

  const loadSettings = useCallback(async () => {
    const data = await api<{settings: {protocolNotifyEmails: string[]}}>('meetings/ops-settings')
    setEmailsText(data.settings.protocolNotifyEmails.join(', '))
  }, [])

  const loadInbox = useCallback(async () => {
    const data = await api<{
      items: Array<{id: string; provider: string; externalEventType: string; status: string}>
    }>('meetings/inbox')
    setInbox(data.items)
  }, [])

  useEffect(() => {
    setError(null)
    const run =
      tab === 'list'
        ? loadList
        : tab === 'reports'
          ? loadReports
          : tab === 'settings'
            ? loadSettings
            : loadInbox
    void run().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [tab, loadList, loadReports, loadSettings, loadInbox])

  async function saveSettings() {
    setError(null)
    setMessage(null)
    try {
      await api('meetings/ops-settings', {
        method: 'PUT',
        body: JSON.stringify({protocolNotifyEmails: emailsText}),
      })
      setMessage(t.admin_saved)
      await loadSettings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  async function processQueues() {
    setError(null)
    setMessage(null)
    try {
      await api('meetings/run-cron', {method: 'POST', body: '{}'})
      setMessage(t.admin_saved)
      await loadInbox()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Process failed')
    }
  }

  const titleOf = (uk: string, en: string) => (currentLang === 'en' ? en || uk : uk || en)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['list', t.admin_meetings_tab_list],
            ['reports', t.admin_meetings_tab_protocols],
            ['settings', t.admin_meetings_tab_settings],
            ['inbox', t.admin_meetings_tab_inbox],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? adminPrimaryBtnClass : adminSecondaryBtnClass}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {message ? <p className="text-sm text-brand-blue-600 dark:text-brand-sky-300">{message}</p> : null}

      {tab === 'list' ? (
        <ul className="space-y-3">
          {meetings.map((item) => (
            <li key={item.id} className={`${adminPanelClass} space-y-2`}>
              <p className="font-medium text-brand-slate-900 dark:text-white">
                {titleOf(item.titleUk, item.titleEn) || item.eventSlug}
              </p>
              <p className="text-sm text-brand-slate-500">
                {item.provider} · {item.status}
                {item.scheduledStartAt ? ` · ${item.scheduledStartAt}` : ''}
              </p>
              {item.lastSyncError ? (
                <p className="text-sm text-red-600 dark:text-red-400">{item.lastSyncError}</p>
              ) : null}
              <button
                type="button"
                className={adminSecondaryBtnClass}
                onClick={() => onOpenEvent(item.eventId)}
              >
                {t.admin_meetings_open_event}
              </button>
            </li>
          ))}
          {meetings.length === 0 ? (
            <p className="text-sm text-brand-slate-500">{t.admin_meetings_empty}</p>
          ) : null}
        </ul>
      ) : null}

      {tab === 'reports' ? (
        <ul className="space-y-2">
          {reports.map((item) => (
            <li key={item.id} className={`${adminPanelClass} space-y-2`}>
              <p className="font-medium text-brand-slate-900 dark:text-white">
                {titleOf(item.titleUk, item.titleEn) || item.eventSlug} · {item.status}
              </p>
              <button
                type="button"
                className={adminSecondaryBtnClass}
                onClick={() => onOpenEvent(item.eventId)}
              >
                {t.admin_meetings_open_event}
              </button>
            </li>
          ))}
          {reports.length === 0 ? (
            <p className="text-sm text-brand-slate-500">{t.admin_meetings_empty}</p>
          ) : null}
        </ul>
      ) : null}

      {tab === 'settings' ? (
        <div className={`${adminPanelClass} space-y-3`}>
          <label className="block space-y-1.5 text-sm">
            <span className={adminLabelClass}>{t.admin_meetings_notify_emails}</span>
            <textarea
              className={adminInputClass}
              rows={4}
              value={emailsText}
              onChange={(e) => setEmailsText(e.target.value)}
              placeholder="director@example.com, secretary@example.com"
            />
          </label>
          <button type="button" className={adminPrimaryBtnClass} onClick={() => void saveSettings()}>
            {t.admin_saved}
          </button>
        </div>
      ) : null}

      {tab === 'inbox' ? (
        <div className="space-y-3">
          <button type="button" className={adminPrimaryBtnClass} onClick={() => void processQueues()}>
            {t.admin_meetings_process_queue}
          </button>
          <ul className="space-y-2">
            {inbox.map((item) => (
              <li key={item.id} className={`${adminPanelClass} text-sm`}>
                {item.provider} · {item.externalEventType} · {item.status}
              </li>
            ))}
            {inbox.length === 0 ? (
              <p className="text-sm text-brand-slate-500">{t.admin_meetings_inbox_empty}</p>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
