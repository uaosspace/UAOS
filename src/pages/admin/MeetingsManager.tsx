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
  summary: string
  topics: unknown[]
  decisions: unknown[]
  actionItems: unknown[]
}

type Bundle = {
  meeting: MeetingListItem | null
  report: ReportListItem | null
  recordings: Array<{id: string; recordingType: string; downloadUrl: string; fileType: string}>
  transcript: {contentText: string; downloadUrl: string} | null
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

export default function MeetingsManager({currentLang}: {currentLang: Locale}) {
  const t = TRANSLATIONS[currentLang]
  const [tab, setTab] = useState<'list' | 'reports' | 'settings' | 'inbox'>('list')
  const [meetings, setMeetings] = useState<MeetingListItem[]>([])
  const [reports, setReports] = useState<ReportListItem[]>([])
  const [inbox, setInbox] = useState<Array<{id: string; provider: string; externalEventType: string; status: string}>>([])
  const [emailsText, setEmailsText] = useState('')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [editedSummary, setEditedSummary] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [uploadingTranscript, setUploadingTranscript] = useState(false)

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
    const data = await api<{items: Array<{id: string; provider: string; externalEventType: string; status: string}>}>(
      'meetings/inbox',
    )
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

  async function openBundle(eventId: string) {
    setError(null)
    setSelectedEventId(eventId)
    try {
      const data = await api<{bundle: Bundle | null}>(`content/events/${eventId}/bundle`)
      setBundle(data.bundle)
      setEditedSummary(data.bundle?.report?.summary ?? '')
      setTab('reports')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed')
    }
  }

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

  async function saveReport() {
    if (!selectedEventId) return
    setError(null)
    setMessage(null)
    try {
      await api(`content/events/${selectedEventId}/report`, {
        method: 'PATCH',
        body: JSON.stringify({editedSummary, status: 'in_review'}),
      })
      setMessage(t.admin_saved)
      await openBundle(selectedEventId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  async function approveReport() {
    if (!selectedEventId) return
    setError(null)
    setMessage(null)
    try {
      await api(`content/events/${selectedEventId}/report/approve`, {method: 'POST', body: '{}'})
      setMessage(t.admin_meetings_protocol_approved)
      await openBundle(selectedEventId)
      await loadReports()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed')
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

  async function uploadTranscriptFile(file: File) {
    if (!selectedEventId) return
    setError(null)
    setMessage(null)
    setUploadingTranscript(true)
    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = typeof reader.result === 'string' ? reader.result : ''
          const comma = result.indexOf(',')
          resolve(comma >= 0 ? result.slice(comma + 1) : result)
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })
      const result = await api<{
        draftGenerated: boolean
        draftError: string | null
      }>(`content/events/${selectedEventId}/meeting/transcript`, {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          dataBase64,
          generateDraft: true,
        }),
      })
      setMessage(
        result.draftGenerated
          ? t.admin_meetings_upload_transcript_draft_ok
          : t.admin_meetings_upload_transcript_ok,
      )
      if (result.draftError) {
        setError(result.draftError)
      }
      await openBundle(selectedEventId)
      await loadReports()
      await loadList()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingTranscript(false)
    }
  }

  const titleOf = (uk: string, en: string) => (currentLang === 'en' ? en || uk : uk || en)

  function formatProtocolSection(label: string, items: unknown[]): string {
    if (!items.length) return ''
    const lines = items.map((item) => {
      if (typeof item === 'string') return `- ${item}`
      if (item && typeof item === 'object') return `- ${JSON.stringify(item)}`
      return `- ${String(item)}`
    })
    return `${label}\n${lines.join('\n')}\n\n`
  }

  function downloadProtocol() {
    if (!bundle?.report) return
    const report = bundle.report
    const title = titleOf(report.titleUk, report.titleEn) || report.eventSlug
    const recordingLines = bundle.recordings
      .map((rec) => `- ${rec.recordingType || rec.fileType || rec.id}: ${rec.downloadUrl}`)
      .join('\n')
    const body = [
      `# ${title}`,
      '',
      `Status: ${report.status}`,
      '',
      '## Summary',
      editedSummary || report.summary || '',
      '',
      formatProtocolSection('## Decisions', report.decisions),
      formatProtocolSection('## Action items', report.actionItems),
      bundle.transcript?.contentText
        ? `## Transcript\n${bundle.transcript.contentText.slice(0, 50000)}\n\n`
        : '',
      recordingLines ? `## Recordings\n${recordingLines}\n` : '',
    ].join('\n')
    const blob = new Blob([body], {type: 'text/markdown;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${report.eventSlug || 'protocol'}-protocol.md`
    anchor.click()
    URL.revokeObjectURL(url)
  }

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
                onClick={() => void openBundle(item.eventId)}
              >
                {t.admin_meetings_open_protocol}
              </button>
            </li>
          ))}
          {meetings.length === 0 ? (
            <p className="text-sm text-brand-slate-500">{t.admin_meetings_empty}</p>
          ) : null}
        </ul>
      ) : null}

      {tab === 'reports' ? (
        <div className="space-y-4">
          <ul className="space-y-2">
            {reports.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`${adminSecondaryBtnClass} w-full text-left`}
                  onClick={() => void openBundle(item.eventId)}
                >
                  {titleOf(item.titleUk, item.titleEn) || item.eventSlug} · {item.status}
                </button>
              </li>
            ))}
          </ul>

          {bundle ? (
            <div className={`${adminPanelClass} space-y-3`}>
              <h3 className="font-semibold text-brand-slate-900 dark:text-white">
                {t.admin_meetings_sources_title}
              </h3>
              <div className="space-y-1.5">
                <label className="block space-y-1.5 text-sm">
                  <span className={adminLabelClass}>{t.admin_meetings_upload_transcript}</span>
                  <input
                    type="file"
                    accept=".vtt,.txt,text/vtt,text/plain"
                    disabled={uploadingTranscript || !selectedEventId}
                    className="block w-full text-sm text-brand-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white dark:text-brand-slate-300"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      e.target.value = ''
                      if (file) void uploadTranscriptFile(file)
                    }}
                  />
                </label>
                <p className="text-xs text-brand-slate-500">{t.admin_meetings_upload_transcript_hint}</p>
                {uploadingTranscript ? (
                  <p className="text-xs text-brand-slate-500">{t.admin_meetings_uploading_transcript}</p>
                ) : null}
              </div>
              <label className="block space-y-1.5 text-sm">
                <span className={adminLabelClass}>{t.admin_meetings_summary}</span>
                <textarea
                  className={adminInputClass}
                  rows={8}
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                />
              </label>
              {bundle.transcript?.contentText ? (
                <div>
                  <p className={adminLabelClass}>{t.admin_meetings_transcript}</p>
                  <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-brand-slate-600 dark:text-brand-slate-300">
                    {bundle.transcript.contentText.slice(0, 8000)}
                  </pre>
                </div>
              ) : null}
              {bundle.recordings.length ? (
                <div>
                  <p className={adminLabelClass}>{t.admin_meetings_recordings}</p>
                  <ul className="mt-1 space-y-1 text-sm">
                    {bundle.recordings.map((rec) => (
                      <li key={rec.id}>
                        <a
                          className="text-brand-blue-600 dark:text-brand-sky-300 underline"
                          href={rec.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {rec.recordingType || rec.fileType || rec.id}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button type="button" className={adminSecondaryBtnClass} onClick={() => void saveReport()}>
                  {t.admin_meetings_save_draft}
                </button>
                <button type="button" className={adminPrimaryBtnClass} onClick={() => void approveReport()}>
                  {t.admin_meetings_approve}
                </button>
                {bundle.report ? (
                  <button type="button" className={adminSecondaryBtnClass} onClick={() => downloadProtocol()}>
                    {t.admin_meetings_download_protocol}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
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
