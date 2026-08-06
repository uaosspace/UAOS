import {useCallback, useEffect, useState, type FormEvent} from 'react'
import {DateTime} from 'luxon'
import {DEFAULT_LOCALE, LOCALES, LOCALE_META, type Locale} from '../../data/locales'
import {TRANSLATIONS} from '../../data/translations'
import {readLocalizedText} from '../../lib/contentGuards'
import type {LocalizedText} from '../../types'
import {resolveContentSlug} from '../../utils/slugify'
import {localizedFieldLabel} from './adminLabels'
import {
  adminInputClass,
  adminLabelClass,
  adminPanelClass,
  adminPrimaryBtnClass,
  adminSecondaryBtnClass,
  adminTabActiveClass,
  adminTabIdleClass,
} from './adminUi'

const ADMIN_EVENT_ZONE = 'Europe/Kyiv'

function isoToKyivParts(iso: string): {date: string; time: string} {
  if (!iso.trim()) return {date: '', time: ''}
  const dt = DateTime.fromISO(iso, {setZone: true}).setZone(ADMIN_EVENT_ZONE)
  if (!dt.isValid) return {date: '', time: ''}
  return {date: dt.toFormat('yyyy-MM-dd'), time: dt.toFormat('HH:mm')}
}

function kyivPartsToIso(date: string, time: string): string {
  if (!date.trim()) return ''
  const clock = time.trim() || '10:00'
  const dt = DateTime.fromISO(`${date}T${clock}`, {zone: ADMIN_EVENT_ZONE})
  if (!dt.isValid) return ''
  return dt.toUTC().toISO() ?? ''
}

type ContentKind = 'news' | 'members' | 'events' | 'documents' | 'settings'

type NewsDraft = {
  id?: string
  slug: string
  status: 'draft' | 'published'
  publishedAt: string
  title: LocalizedText
  excerpt: LocalizedText
  body: LocalizedText
  coverUrl: string
  kind: 'internal' | 'link'
  externalUrl: string
}

type MemberDraft = {
  id?: string
  slug: string
  status: 'draft' | 'published'
  name: LocalizedText
  /** Brand abbreviation — stays a single value, the public model keeps it a plain string. */
  shortName: string
  category: LocalizedText
  shortDescription: LocalizedText
  websiteUrl: string
  logoUrl: string
  coverUrl: string
  featured: boolean
  order: number
}

type EventDraft = {
  id?: string
  slug: string
  status: 'draft' | 'published'
  title: LocalizedText
  shortDescription: LocalizedText
  type: string
  format: string
  startAt: string
  endAt: string
  coverUrl: string
}

type DocumentDraft = {
  id?: string
  slug: string
  status: 'draft' | 'published'
  title: LocalizedText
  description: LocalizedText
  type: string
  language: string
  accessLevel: 'public' | 'members'
  fileUrl: string
}

type SettingsDraft = {
  phone: string
  email: string
  address: LocalizedText
  brandTagline: LocalizedText
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

const emptyLocalized = (): LocalizedText => ({uk: '', en: ''})

const emptyNews = (): NewsDraft => ({
  slug: '',
  status: 'draft',
  publishedAt: new Date().toISOString().slice(0, 10),
  title: emptyLocalized(),
  excerpt: emptyLocalized(),
  body: emptyLocalized(),
  coverUrl: '',
  kind: 'internal',
  externalUrl: '',
})

const emptyMember = (): MemberDraft => ({
  slug: '',
  status: 'draft',
  name: emptyLocalized(),
  shortName: '',
  category: emptyLocalized(),
  shortDescription: emptyLocalized(),
  websiteUrl: '',
  logoUrl: '',
  coverUrl: '',
  featured: false,
  order: 0,
})

const emptyEvent = (): EventDraft => ({
  slug: '',
  status: 'draft',
  title: emptyLocalized(),
  shortDescription: emptyLocalized(),
  type: 'meeting',
  format: 'offline',
  startAt: '',
  endAt: '',
  coverUrl: '',
})

const emptyDocument = (): DocumentDraft => ({
  slug: '',
  status: 'draft',
  title: emptyLocalized(),
  description: emptyLocalized(),
  type: 'link',
  language: 'uk',
  accessLevel: 'public',
  fileUrl: '',
})

function withLocale(value: LocalizedText, locale: Locale, text: string): LocalizedText {
  return {...value, [locale]: text}
}

function isFilled(value: LocalizedText, locale: Locale): boolean {
  return Boolean((value[locale] ?? '').trim())
}

/** Locales with at least one empty field in the current form — drives the tab markers. */
function incompleteLocales(fields: LocalizedText[]): Set<Locale> {
  const incomplete = new Set<Locale>()
  for (const locale of LOCALES) {
    if (fields.some((field) => !isFilled(field, locale))) incomplete.add(locale)
  }
  return incomplete
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className={adminLabelClass}>{label}</span>
      {multiline ? (
        <textarea
          className={adminInputClass}
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input className={adminInputClass} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  )
}

/** One locale switcher per form; a hollow marker means that locale still has empty fields. */
function LocaleTabs({
  active,
  incomplete,
  onChange,
}: {
  active: Locale
  incomplete: Set<Locale>
  onChange: (locale: Locale) => void
}) {
  return (
    <div className="md:col-span-2 flex flex-wrap gap-2">
      {LOCALES.map((locale) => {
        const isActive = locale === active
        return (
          <button
            key={locale}
            type="button"
            aria-pressed={isActive}
            title={LOCALE_META[locale].nativeName}
            className={`${isActive ? adminTabActiveClass : adminTabIdleClass} inline-flex items-center gap-2`}
            onClick={() => onChange(locale)}
          >
            {LOCALE_META[locale].label}
            <span
              aria-hidden
              className={
                incomplete.has(locale)
                  ? 'h-2 w-2 rounded-full border border-current opacity-70'
                  : 'h-2 w-2 rounded-full bg-emerald-500'
              }
            />
          </button>
        )
      })}
    </div>
  )
}

/** Text field for the active locale; the code row shows which locales are already translated. */
function LocalizedField({
  label,
  value,
  locale,
  onChange,
  multiline,
}: {
  label: string
  value: LocalizedText
  locale: Locale
  onChange: (next: LocalizedText) => void
  multiline?: boolean
}) {
  const text = value[locale] ?? ''
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className={adminLabelClass}>{localizedFieldLabel(label, locale)}</span>
        <span aria-hidden className="flex gap-1.5 font-mono text-[10px] uppercase tracking-widest">
          {LOCALES.map((item) => (
            <span
              key={item}
              className={
                isFilled(value, item)
                  ? 'text-brand-blue-600 dark:text-brand-sky-300'
                  : 'text-brand-slate-300 line-through dark:text-brand-slate-600'
              }
            >
              {LOCALE_META[item].label}
            </span>
          ))}
        </span>
      </span>
      {multiline ? (
        <textarea
          className={adminInputClass}
          rows={4}
          value={text}
          onChange={(e) => onChange(withLocale(value, locale, e.target.value))}
        />
      ) : (
        <input
          className={adminInputClass}
          value={text}
          onChange={(e) => onChange(withLocale(value, locale, e.target.value))}
        />
      )}
    </label>
  )
}

/** Date + time pickers in Kyiv wall time; value stored as UTC ISO for the API. */
function EventDateTimeFields({
  dateLabel,
  timeLabel,
  isoValue,
  onChange,
  required,
}: {
  dateLabel: string
  timeLabel: string
  isoValue: string
  onChange: (iso: string) => void
  required?: boolean
}) {
  const {date, time} = isoToKyivParts(isoValue)

  function commit(nextDate: string, nextTime: string) {
    onChange(kyivPartsToIso(nextDate, nextTime))
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:col-span-2">
      <label className="block space-y-1.5 text-sm">
        <span className={adminLabelClass}>{dateLabel}</span>
        <input
          className={adminInputClass}
          type="date"
          value={date}
          required={required}
          onChange={(e) => commit(e.target.value, time || '10:00')}
        />
      </label>
      <label className="block space-y-1.5 text-sm">
        <span className={adminLabelClass}>{timeLabel}</span>
        <input
          className={adminInputClass}
          type="time"
          value={time}
          required={required}
          onChange={(e) => commit(date, e.target.value)}
        />
      </label>
    </div>
  )
}

type ContentEditorsProps = {
  currentLang: Locale
}

export default function ContentEditors({currentLang}: ContentEditorsProps) {
  const t = TRANSLATIONS[currentLang]
  const [kind, setKind] = useState<ContentKind>('news')
  const [items, setItems] = useState<unknown[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [news, setNews] = useState<NewsDraft>(emptyNews())
  const [member, setMember] = useState<MemberDraft>(emptyMember())
  const [eventItem, setEventItem] = useState<EventDraft>(emptyEvent())
  const [documentItem, setDocumentItem] = useState<DocumentDraft>(emptyDocument())
  const [fieldLocale, setFieldLocale] = useState<Locale>(DEFAULT_LOCALE)
  const [settings, setSettings] = useState<SettingsDraft>({
    phone: '',
    email: '',
    address: emptyLocalized(),
    brandTagline: emptyLocalized(),
  })

  const load = useCallback(async () => {
    setError(null)
    if (kind === 'settings') {
      const data = await api<{item: Record<string, unknown>}>('content/settings')
      const item = data.item || {}
      setSettings({
        phone: String(item.phone || ''),
        email: String(item.email || ''),
        address: readLocalizedText(item.address),
        brandTagline: readLocalizedText(item.brandTagline),
      })
      setItems([])
      return
    }
    const data = await api<{items: unknown[]}>(`content/${kind}`)
    setItems(data.items || [])
  }, [kind])

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [load])

  async function uploadFile(file: File, visibility: 'public' | 'private' = 'public') {
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    bytes.forEach((b) => {
      binary += String.fromCharCode(b)
    })
    const dataBase64 = btoa(binary)
    const data = await api<{asset: {url: string; id: string}}>('media/upload', {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        visibility,
        dataBase64,
      }),
    })
    return data.asset
  }

  async function saveNews(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    try {
      const externalUrl = news.kind === 'link' ? news.externalUrl.trim() : ''
      if (news.kind === 'link' && !/^https?:\/\//i.test(externalUrl)) {
        throw new Error(t.admin_news_external_url_required)
      }
      const slug = resolveContentSlug(news.slug, news.title.uk, 'news')
      await api('content/news', {
        method: 'POST',
        body: JSON.stringify({
          id: news.id,
          slug,
          status: news.status,
          publishedAt: news.publishedAt,
          title: news.title,
          excerpt: news.excerpt,
          body: news.kind === 'internal' ? news.body : emptyLocalized(),
          coverImageUrl: news.coverUrl,
          externalUrl,
        }),
      })
      setMessage(t.admin_saved)
      setNews(emptyNews())
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  async function saveMember(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    try {
      if (!member.name.uk.trim()) throw new Error(t.admin_member_name_required)
      const slug = resolveContentSlug(member.slug, member.name.uk, 'member')
      await api('content/members', {
        method: 'POST',
        body: JSON.stringify({
          id: member.id,
          slug,
          status: member.status,
          order: member.order,
          featured: member.featured,
          name: member.name,
          shortName: member.shortName,
          category: member.category,
          shortDescription: member.shortDescription,
          websiteUrl: member.websiteUrl.trim(),
          logoUrl: member.logoUrl.trim(),
          coverImageUrl: member.coverUrl.trim(),
        }),
      })
      setMessage(t.admin_saved)
      setMember(emptyMember())
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  async function deleteMember() {
    if (!member.id) return
    if (!window.confirm(t.admin_delete_confirm)) return
    setError(null)
    setMessage(null)
    try {
      await api(`content/members/${member.id}`, {method: 'DELETE'})
      setMessage(t.admin_saved)
      setMember(emptyMember())
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  async function saveEvent(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    try {
      const slug = resolveContentSlug(eventItem.slug, eventItem.title.uk, 'event')
      // location/organizer have no inputs here; omitting them keeps the stored translations.
      await api('content/events', {
        method: 'POST',
        body: JSON.stringify({
          id: eventItem.id,
          slug,
          status: eventItem.status,
          title: eventItem.title,
          shortDescription: eventItem.shortDescription,
          type: eventItem.type,
          format: eventItem.format,
          startAt: eventItem.startAt,
          endAt: eventItem.endAt,
          coverImageUrl: eventItem.coverUrl,
        }),
      })
      setMessage(t.admin_saved)
      setEventItem(emptyEvent())
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  async function deleteEvent() {
    if (!eventItem.id) return
    if (!window.confirm(t.admin_delete_confirm)) return
    setError(null)
    setMessage(null)
    try {
      await api(`content/events/${eventItem.id}`, {method: 'DELETE'})
      setMessage(t.admin_saved)
      setEventItem(emptyEvent())
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  async function saveDocument(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    try {
      await api('content/documents', {
        method: 'POST',
        body: JSON.stringify({
          id: documentItem.id,
          slug: documentItem.slug,
          status: documentItem.status,
          title: documentItem.title,
          description: documentItem.description,
          type: documentItem.type,
          language: documentItem.language,
          accessLevel: documentItem.accessLevel,
          fileUrl: documentItem.fileUrl,
        }),
      })
      setMessage(t.admin_saved)
      setDocumentItem(emptyDocument())
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    try {
      await api('content/settings', {
        method: 'POST',
        body: JSON.stringify({
          phone: settings.phone,
          email: settings.email,
          address: settings.address,
          brandTagline: settings.brandTagline,
        }),
      })
      setMessage(t.admin_saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  function pickNews(raw: Record<string, unknown>) {
    const externalUrl = String(raw.externalUrl || '')
    setNews({
      id: String(raw.id || ''),
      slug: String(raw.slug || ''),
      status: raw.status === 'published' ? 'published' : 'draft',
      publishedAt: String(raw.publishedAt || '').slice(0, 10),
      title: readLocalizedText(raw.title),
      excerpt: readLocalizedText(raw.excerpt),
      body: readLocalizedText(raw.body),
      coverUrl: String(raw.coverUrl || raw.coverImageUrl || ''),
      kind: externalUrl ? 'link' : 'internal',
      externalUrl,
    })
  }

  function pickMember(raw: Record<string, unknown>) {
    setMember({
      id: String(raw.id || ''),
      slug: String(raw.slug || ''),
      status: raw.status === 'published' ? 'published' : 'draft',
      name: readLocalizedText(raw.name),
      shortName: String(raw.shortName || ''),
      category: readLocalizedText(raw.category),
      shortDescription: readLocalizedText(raw.shortDescription),
      websiteUrl: String(raw.websiteUrl || ''),
      logoUrl: String(raw.logoUrl || ''),
      coverUrl: String(raw.coverUrl || raw.coverImageUrl || ''),
      featured: Boolean(raw.featured),
      order: typeof raw.order === 'number' ? raw.order : Number(raw.order || 0) || 0,
    })
  }

  function pickEvent(raw: Record<string, unknown>) {
    setEventItem({
      id: String(raw.id || ''),
      slug: String(raw.slug || ''),
      status: raw.status === 'published' ? 'published' : 'draft',
      title: readLocalizedText(raw.title),
      shortDescription: readLocalizedText(raw.shortDescription),
      type: String(raw.type || 'meeting'),
      format: String(raw.format || 'offline'),
      startAt: String(raw.startAt || ''),
      endAt: String(raw.endAt || ''),
      coverUrl: String(raw.coverUrl || raw.coverImageUrl || ''),
    })
  }

  function pickDocument(raw: Record<string, unknown>) {
    setDocumentItem({
      id: String(raw.id || ''),
      slug: String(raw.slug || raw.id || ''),
      status: raw.status === 'published' ? 'published' : 'draft',
      title: readLocalizedText(raw.title),
      description: readLocalizedText(raw.description),
      type: String(raw.type || 'link'),
      language: String(raw.language || 'uk'),
      accessLevel: raw.accessLevel === 'members' ? 'members' : 'public',
      fileUrl: String(raw.fileUrl || ''),
    })
  }

  const kindTabs: Array<{id: ContentKind; label: string}> = [
    {id: 'news', label: t.admin_tab_news},
    {id: 'members', label: t.admin_tab_members},
    {id: 'events', label: t.admin_tab_events},
    {id: 'documents', label: t.admin_tab_documents},
    {id: 'settings', label: t.admin_tab_settings},
  ]

  const statusSelect = (value: 'draft' | 'published', onChange: (v: 'draft' | 'published') => void) => (
    <label className="block space-y-1.5 text-sm">
      <span className={adminLabelClass}>{t.admin_field_status}</span>
      <select
        className={adminInputClass}
        value={value}
        onChange={(e) => onChange(e.target.value as 'draft' | 'published')}
      >
        <option value="draft">{t.admin_status_draft}</option>
        <option value="published">{t.admin_status_published}</option>
      </select>
    </label>
  )

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        {kindTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={kind === item.id ? adminTabActiveClass : adminTabIdleClass}
            onClick={() => setKind(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p> : null}

      {kind !== 'settings' ? (
        <div className={adminPanelClass}>
          <ul className="max-h-52 overflow-auto divide-y divide-brand-slate-200 dark:divide-brand-slate-700">
            {items.map((raw) => {
              const item = raw as Record<string, unknown>
              const id = String(item.id || item.slug || Math.random())
              const label =
                String((item.title as {uk?: string} | undefined)?.uk || '') ||
                String((item.name as {uk?: string} | undefined)?.uk || '') ||
                String(item.slug || id)
              return (
                <li key={id}>
                  <button
                    type="button"
                    className="w-full rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-brand-slate-50 dark:hover:bg-brand-slate-800/60"
                    onClick={() => {
                      if (kind === 'news') pickNews(item)
                      if (kind === 'members') pickMember(item)
                      if (kind === 'events') pickEvent(item)
                      if (kind === 'documents') pickDocument(item)
                      setMessage(`${t.admin_editing}: ${label}`)
                    }}
                  >
                    <span className="font-medium text-brand-slate-900 dark:text-white">{label}</span>
                    <span className="ml-2 text-xs text-brand-slate-500">
                      {String(item.status || '') === 'published'
                        ? t.admin_status_published
                        : t.admin_status_draft}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      {kind === 'news' ? (
        <form className={`${adminPanelClass} grid gap-3 md:grid-cols-2`} onSubmit={saveNews}>
          <label className="block space-y-1.5 text-sm md:col-span-2">
            <span className={adminLabelClass}>{t.admin_news_kind}</span>
            <select
              className={adminInputClass}
              value={news.kind}
              onChange={(e) =>
                setNews({...news, kind: e.target.value === 'link' ? 'link' : 'internal'})
              }
            >
              <option value="internal">{t.admin_news_kind_internal}</option>
              <option value="link">{t.admin_news_kind_link}</option>
            </select>
          </label>
          <Field label={t.admin_field_slug} value={news.slug} onChange={(v) => setNews({...news, slug: v})} />
          {statusSelect(news.status, (v) => setNews({...news, status: v}))}
          <LocaleTabs
            active={fieldLocale}
            incomplete={incompleteLocales(
              news.kind === 'internal'
                ? [news.title, news.excerpt, news.body]
                : [news.title, news.excerpt],
            )}
            onChange={setFieldLocale}
          />
          <LocalizedField
            label={t.admin_field_title_uk}
            value={news.title}
            locale={fieldLocale}
            onChange={(v) => setNews({...news, title: v})}
          />
          <LocalizedField
            label={t.admin_field_excerpt_uk}
            value={news.excerpt}
            locale={fieldLocale}
            onChange={(v) => setNews({...news, excerpt: v})}
            multiline
          />
          {news.kind === 'link' ? (
            <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
              <Field
                label={t.admin_field_news_external_url}
                value={news.externalUrl}
                onChange={(v) => setNews({...news, externalUrl: v})}
              />
              <div className="flex items-end">
                <button
                  type="button"
                  className={adminSecondaryBtnClass}
                  onClick={() => {
                    setError(null)
                    void api<{imageUrl: string}>('media/fetch-og', {
                      method: 'POST',
                      body: JSON.stringify({url: news.externalUrl}),
                    })
                      .then((data) => {
                        setNews((prev) => ({...prev, coverUrl: data.imageUrl}))
                        setMessage(t.admin_news_cover_fetched)
                      })
                      .catch((err) => setError(err instanceof Error ? err.message : 'Fetch failed'))
                  }}
                >
                  {t.admin_news_fetch_cover}
                </button>
              </div>
              <p className="md:col-span-2 text-xs text-brand-slate-500 dark:text-brand-slate-400">
                {t.admin_news_link_hint}
              </p>
            </div>
          ) : (
            <div className="md:col-span-2">
              <LocalizedField
                label={t.admin_field_body_uk}
                value={news.body}
                locale={fieldLocale}
                onChange={(v) => setNews({...news, body: v})}
                multiline
              />
            </div>
          )}
          <Field label={t.admin_field_cover_url} value={news.coverUrl} onChange={(v) => setNews({...news, coverUrl: v})} />
          <label className="block space-y-1.5 text-sm">
            <span className={adminLabelClass}>{t.admin_upload_cover}</span>
            <input
              className="block w-full text-sm text-brand-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-blue-500 file:px-3 file:py-2 file:text-white dark:text-brand-slate-300"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                void uploadFile(file)
                  .then((asset) => {
                    setNews((prev) => ({...prev, coverUrl: asset.url}))
                    setMessage(t.admin_saved)
                  })
                  .catch((err) => setError(err.message))
              }}
            />
          </label>
          <div className="md:col-span-2">
            <button className={adminPrimaryBtnClass} type="submit">
              {t.admin_save_news}
            </button>
          </div>
        </form>
      ) : null}

      {kind === 'members' ? (
        <form className={`${adminPanelClass} grid gap-3 md:grid-cols-2`} onSubmit={saveMember}>
          <p className="md:col-span-2 text-xs text-brand-slate-500 dark:text-brand-slate-400">
            {t.admin_member_public_hint}
          </p>
          {statusSelect(member.status, (v) => setMember({...member, status: v}))}
          <label className="flex items-center gap-2 text-sm text-brand-slate-700 dark:text-brand-slate-200">
            <input
              type="checkbox"
              checked={member.featured}
              onChange={(e) => setMember({...member, featured: e.target.checked})}
            />
            {t.admin_field_featured}
          </label>
          <Field label={t.admin_field_short_name} value={member.shortName} onChange={(v) => setMember({...member, shortName: v})} />
          <Field
            label={t.admin_field_order}
            value={String(member.order)}
            onChange={(v) => setMember({...member, order: Number(v.replace(/\D/g, '')) || 0})}
          />
          <Field label={t.admin_field_website} value={member.websiteUrl} onChange={(v) => setMember({...member, websiteUrl: v})} />
          <div className="hidden md:block" aria-hidden />
          <LocaleTabs
            active={fieldLocale}
            incomplete={incompleteLocales([member.name, member.category, member.shortDescription])}
            onChange={setFieldLocale}
          />
          <LocalizedField
            label={t.admin_field_name_uk}
            value={member.name}
            locale={fieldLocale}
            onChange={(v) => setMember({...member, name: v})}
          />
          <LocalizedField
            label={t.admin_field_category_uk}
            value={member.category}
            locale={fieldLocale}
            onChange={(v) => setMember({...member, category: v})}
          />
          <div className="md:col-span-2">
            <LocalizedField
              label={t.admin_field_short_desc_uk}
              value={member.shortDescription}
              locale={fieldLocale}
              onChange={(v) => setMember({...member, shortDescription: v})}
              multiline
            />
          </div>
          <Field label={t.admin_field_logo_url} value={member.logoUrl} onChange={(v) => setMember({...member, logoUrl: v})} />
          <label className="block space-y-1.5 text-sm">
            <span className={adminLabelClass}>{t.admin_upload_logo}</span>
            <input
              className="block w-full text-sm text-brand-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-blue-500 file:px-3 file:py-2 file:text-white dark:text-brand-slate-300"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                void uploadFile(file)
                  .then((asset) => setMember((prev) => ({...prev, logoUrl: asset.url})))
                  .catch((err) => setError(err.message))
              }}
            />
          </label>
          <Field label={t.admin_field_cover_url} value={member.coverUrl} onChange={(v) => setMember({...member, coverUrl: v})} />
          <label className="block space-y-1.5 text-sm">
            <span className={adminLabelClass}>{t.admin_upload_cover}</span>
            <input
              className="block w-full text-sm text-brand-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-blue-500 file:px-3 file:py-2 file:text-white dark:text-brand-slate-300"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                void uploadFile(file)
                  .then((asset) => setMember((prev) => ({...prev, coverUrl: asset.url})))
                  .catch((err) => setError(err.message))
              }}
            />
          </label>
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <button className={adminPrimaryBtnClass} type="submit">
              {t.admin_save_member}
            </button>
            {member.id ? (
              <button
                className={`${adminSecondaryBtnClass} border-red-300 text-red-700 hover:border-red-500 hover:text-red-800 dark:border-red-800 dark:text-red-300 dark:hover:border-red-500`}
                type="button"
                onClick={() => void deleteMember()}
              >
                {t.admin_delete}
              </button>
            ) : null}
            {member.id ? (
              <button className={adminSecondaryBtnClass} type="button" onClick={() => setMember(emptyMember())}>
                {t.admin_cancel}
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      {kind === 'events' ? (
        <form className={`${adminPanelClass} grid gap-3 md:grid-cols-2`} onSubmit={saveEvent}>
          {statusSelect(eventItem.status, (v) => setEventItem({...eventItem, status: v}))}
          <div className="hidden md:block" aria-hidden />
          <LocaleTabs
            active={fieldLocale}
            incomplete={incompleteLocales([eventItem.title, eventItem.shortDescription])}
            onChange={setFieldLocale}
          />
          <div className="md:col-span-2">
            <LocalizedField
              label={t.admin_field_title_uk}
              value={eventItem.title}
              locale={fieldLocale}
              onChange={(v) => setEventItem({...eventItem, title: v})}
            />
          </div>
          <p className="md:col-span-2 text-xs text-brand-slate-500 dark:text-brand-slate-400">
            {t.admin_field_event_tz_hint}
          </p>
          <EventDateTimeFields
            dateLabel={t.admin_field_start_date}
            timeLabel={t.admin_field_start_time}
            isoValue={eventItem.startAt}
            required
            onChange={(iso) => setEventItem({...eventItem, startAt: iso})}
          />
          <EventDateTimeFields
            dateLabel={t.admin_field_end_date}
            timeLabel={t.admin_field_end_time}
            isoValue={eventItem.endAt}
            onChange={(iso) => setEventItem({...eventItem, endAt: iso})}
          />
          <div className="md:col-span-2">
            <LocalizedField
              label={t.admin_field_short_uk}
              value={eventItem.shortDescription}
              locale={fieldLocale}
              onChange={(v) => setEventItem({...eventItem, shortDescription: v})}
              multiline
            />
          </div>
          <Field
            label={t.admin_field_cover_url}
            value={eventItem.coverUrl}
            onChange={(v) => setEventItem({...eventItem, coverUrl: v})}
          />
          <label className="block space-y-1.5 text-sm">
            <span className={adminLabelClass}>{t.admin_upload_cover}</span>
            <input
              className="block w-full text-sm text-brand-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-blue-500 file:px-3 file:py-2 file:text-white dark:text-brand-slate-300"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                void uploadFile(file)
                  .then((asset) => {
                    setEventItem((prev) => ({...prev, coverUrl: asset.url}))
                    setMessage(t.admin_saved)
                  })
                  .catch((err) => setError(err.message))
              }}
            />
          </label>
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <button className={adminPrimaryBtnClass} type="submit">
              {t.admin_save_event}
            </button>
            {eventItem.id ? (
              <button
                className={`${adminSecondaryBtnClass} border-red-300 text-red-700 hover:border-red-500 hover:text-red-800 dark:border-red-800 dark:text-red-300 dark:hover:border-red-500`}
                type="button"
                onClick={() => void deleteEvent()}
              >
                {t.admin_delete}
              </button>
            ) : null}
            {eventItem.id ? (
              <button
                className={adminSecondaryBtnClass}
                type="button"
                onClick={() => setEventItem(emptyEvent())}
              >
                {t.admin_cancel}
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      {kind === 'documents' ? (
        <form className={`${adminPanelClass} grid gap-3 md:grid-cols-2`} onSubmit={saveDocument}>
          <Field label={t.admin_field_slug} value={documentItem.slug} onChange={(v) => setDocumentItem({...documentItem, slug: v})} />
          {statusSelect(documentItem.status, (v) => setDocumentItem({...documentItem, status: v}))}
          <LocaleTabs
            active={fieldLocale}
            incomplete={incompleteLocales([documentItem.title, documentItem.description])}
            onChange={setFieldLocale}
          />
          <LocalizedField
            label={t.admin_field_title_uk}
            value={documentItem.title}
            locale={fieldLocale}
            onChange={(v) => setDocumentItem({...documentItem, title: v})}
          />
          <LocalizedField
            label={t.admin_field_short_desc_uk}
            value={documentItem.description}
            locale={fieldLocale}
            onChange={(v) => setDocumentItem({...documentItem, description: v})}
            multiline
          />
          <Field label={t.admin_field_file_url} value={documentItem.fileUrl} onChange={(v) => setDocumentItem({...documentItem, fileUrl: v})} />
          <label className="block space-y-1.5 text-sm">
            <span className={adminLabelClass}>{t.admin_upload_file}</span>
            <input
              className="block w-full text-sm text-brand-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-blue-500 file:px-3 file:py-2 file:text-white dark:text-brand-slate-300"
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const visibility = documentItem.accessLevel === 'members' ? 'private' : 'public'
                void uploadFile(file, visibility)
                  .then((asset) => {
                    if (visibility === 'private') {
                      setDocumentItem((prev) => ({...prev, fileUrl: `/api/admin/files/${asset.id}`}))
                    } else {
                      setDocumentItem((prev) => ({...prev, fileUrl: asset.url}))
                    }
                  })
                  .catch((err) => setError(err.message))
              }}
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className={adminLabelClass}>{t.admin_field_access}</span>
            <select
              className={adminInputClass}
              value={documentItem.accessLevel}
              onChange={(e) =>
                setDocumentItem({
                  ...documentItem,
                  accessLevel: e.target.value === 'members' ? 'members' : 'public',
                })
              }
            >
              <option value="public">{t.admin_access_public}</option>
              <option value="members">{t.admin_access_members}</option>
            </select>
          </label>
          <div className="md:col-span-2">
            <button className={adminPrimaryBtnClass} type="submit">
              {t.admin_save_document}
            </button>
          </div>
        </form>
      ) : null}

      {kind === 'settings' ? (
        <form className={`${adminPanelClass} grid gap-3 md:grid-cols-2`} onSubmit={saveSettings}>
          <Field label={t.admin_field_phone} value={settings.phone} onChange={(v) => setSettings({...settings, phone: v})} />
          <Field label={t.admin_field_email} value={settings.email} onChange={(v) => setSettings({...settings, email: v})} />
          <LocaleTabs
            active={fieldLocale}
            incomplete={incompleteLocales([settings.address, settings.brandTagline])}
            onChange={setFieldLocale}
          />
          <LocalizedField
            label={t.admin_field_address_uk}
            value={settings.address}
            locale={fieldLocale}
            onChange={(v) => setSettings({...settings, address: v})}
          />
          <LocalizedField
            label={t.admin_field_tagline_uk}
            value={settings.brandTagline}
            locale={fieldLocale}
            onChange={(v) => setSettings({...settings, brandTagline: v})}
          />
          <div className="md:col-span-2">
            <button className={adminPrimaryBtnClass} type="submit">
              {t.admin_save_settings}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
