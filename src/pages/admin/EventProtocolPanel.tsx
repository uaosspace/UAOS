import {useCallback, useEffect, useRef, useState} from 'react'
import type {Locale} from '../../data/locales'
import {TRANSLATIONS} from '../../data/translations'
import {buildProtocolDocxBlob} from '../../lib/protocolDocx'
import {
  adminInputClass,
  adminLabelClass,
  adminPrimaryBtnClass,
  adminSecondaryBtnClass,
} from './adminUi'

type ProtocolBundle = {
  report: {
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
  } | null
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

type EventProtocolPanelProps = {
  currentLang: Locale
  eventId: string
  eventSlug?: string
  titleUk?: string
  titleEn?: string
  onMessage?: (message: string | null) => void
  onError?: (error: string | null) => void
}

export default function EventProtocolPanel({
  currentLang,
  eventId,
  eventSlug = '',
  titleUk = '',
  titleEn = '',
  onMessage,
  onError,
}: EventProtocolPanelProps) {
  const t = TRANSLATIONS[currentLang]
  const [bundle, setBundle] = useState<ProtocolBundle | null>(null)
  const [editedSummary, setEditedSummary] = useState('')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const onErrorRef = useRef(onError)
  const onMessageRef = useRef(onMessage)
  onErrorRef.current = onError
  onMessageRef.current = onMessage

  const titleOf = (uk: string, en: string) => (currentLang === 'en' ? en || uk : uk || en)

  const loadBundle = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    onErrorRef.current?.(null)
    try {
      const data = await api<{bundle: ProtocolBundle | null}>(`content/events/${eventId}/bundle`)
      setBundle(data.bundle)
      setEditedSummary(data.bundle?.report?.summary ?? '')
    } catch (err) {
      onErrorRef.current?.(err instanceof Error ? err.message : 'Load failed')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    void loadBundle()
  }, [loadBundle])

  async function uploadTranscriptFile(file: File) {
    setUploading(true)
    onErrorRef.current?.(null)
    onMessageRef.current?.(null)
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
        report: {summary?: string} | null
      }>(`content/events/${eventId}/meeting/transcript`, {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          dataBase64,
          generateDraft: true,
        }),
      })
      onMessageRef.current?.(
        result.draftGenerated
          ? t.admin_meetings_upload_transcript_draft_ok
          : t.admin_meetings_upload_transcript_ok,
      )
      if (result.draftError) onErrorRef.current?.(result.draftError)
      await loadBundle()
    } catch (err) {
      onErrorRef.current?.(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function saveReport() {
    onErrorRef.current?.(null)
    onMessageRef.current?.(null)
    try {
      await api(`content/events/${eventId}/report`, {
        method: 'PATCH',
        body: JSON.stringify({editedSummary, status: 'in_review'}),
      })
      onMessageRef.current?.(t.admin_saved)
      await loadBundle()
    } catch (err) {
      onErrorRef.current?.(err instanceof Error ? err.message : 'Save failed')
    }
  }

  async function approveReport() {
    onErrorRef.current?.(null)
    onMessageRef.current?.(null)
    try {
      await api(`content/events/${eventId}/report/approve`, {method: 'POST', body: '{}'})
      onMessageRef.current?.(t.admin_meetings_protocol_approved)
      await loadBundle()
    } catch (err) {
      onErrorRef.current?.(err instanceof Error ? err.message : 'Approve failed')
    }
  }

  function formatListItems(items: unknown[]): string[] {
    return items
      .map((item) => {
        if (typeof item === 'string') return item.trim()
        if (item && typeof item === 'object') return JSON.stringify(item)
        return String(item)
      })
      .filter(Boolean)
  }

  async function downloadProtocol() {
    if (!bundle?.report) return
    const report = bundle.report
    const title =
      titleOf(report.titleUk || titleUk, report.titleEn || titleEn) ||
      report.eventSlug ||
      eventSlug ||
      'protocol'
    onErrorRef.current?.(null)
    try {
      const blob = await buildProtocolDocxBlob({
        title,
        status: report.status,
        body: editedSummary || report.summary || '',
        decisions: formatListItems(report.decisions),
        actionItems: formatListItems(report.actionItems),
        transcriptText: bundle.transcript?.contentText?.slice(0, 50000),
        recordingLines: bundle.recordings.map(
          (rec) => `${rec.recordingType || rec.fileType || rec.id}: ${rec.downloadUrl}`,
        ),
        labels: {
          status: currentLang === 'en' ? 'Status' : 'Статус',
          decisions: currentLang === 'en' ? 'Decisions' : 'Рішення',
          actionItems: currentLang === 'en' ? 'Action items' : 'Поручення',
          transcript: t.admin_meetings_transcript,
          recordings: t.admin_meetings_recordings,
        },
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${report.eventSlug || eventSlug || 'protocol'}-protocol.docx`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      onErrorRef.current?.(err instanceof Error ? err.message : 'Download failed')
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-brand-slate-200 p-3 dark:border-brand-slate-700">
      <p className="text-sm font-medium text-brand-slate-900 dark:text-white">
        {t.admin_report_block}
      </p>
      <p className="text-xs text-brand-slate-500">{t.admin_protocol_panel_hint}</p>

      <label className="block space-y-1.5 text-sm">
        <span className={adminLabelClass}>{t.admin_meetings_upload_transcript}</span>
        <input
          type="file"
          accept=".vtt,.txt,text/vtt,text/plain"
          disabled={uploading || !eventId}
          className="block w-full text-sm text-brand-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white dark:text-brand-slate-300"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void uploadTranscriptFile(file)
          }}
        />
      </label>
      <p className="text-xs text-brand-slate-500">{t.admin_meetings_upload_transcript_hint}</p>
      {uploading ? (
        <p className="text-xs text-brand-slate-500">{t.admin_meetings_uploading_transcript}</p>
      ) : null}
      {loading && !bundle ? (
        <p className="text-xs text-brand-slate-500">{t.admin_loading}</p>
      ) : null}

      <label className="block space-y-1.5 text-sm">
        <span className={adminLabelClass}>{t.admin_meetings_summary}</span>
        <textarea
          className={adminInputClass}
          rows={8}
          value={editedSummary}
          onChange={(e) => setEditedSummary(e.target.value)}
          placeholder={t.admin_report_summary}
        />
      </label>

      {bundle?.transcript?.contentText ? (
        <div>
          <p className={adminLabelClass}>{t.admin_meetings_transcript}</p>
          <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-brand-slate-600 dark:text-brand-slate-300">
            {bundle.transcript.contentText.slice(0, 8000)}
          </pre>
        </div>
      ) : null}

      {bundle?.recordings?.length ? (
        <div>
          <p className={adminLabelClass}>{t.admin_meetings_recordings}</p>
          <ul className="mt-1 space-y-1 text-sm">
            {bundle.recordings.map((rec) => (
              <li key={rec.id}>
                <a
                  className="text-brand-blue-600 underline dark:text-brand-sky-300"
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
        {bundle?.report ? (
          <button
            type="button"
            className={adminSecondaryBtnClass}
            onClick={() => void downloadProtocol()}
          >
            {t.admin_meetings_download_protocol}
          </button>
        ) : null}
      </div>

      {bundle?.report ? (
        <p className="text-xs text-brand-slate-500">status: {bundle.report.status}</p>
      ) : null}
    </div>
  )
}
