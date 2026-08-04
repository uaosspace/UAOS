import {useCallback, useEffect, useState, type FormEvent} from 'react'

type ContentKind = 'news' | 'members' | 'events' | 'documents' | 'settings'

type NewsDraft = {
  id?: string
  slug: string
  status: 'draft' | 'published'
  publishedAt: string
  titleUk: string
  titleEn: string
  excerptUk: string
  excerptEn: string
  bodyUk: string
  bodyEn: string
  coverUrl: string
}

type MemberDraft = {
  id?: string
  slug: string
  status: 'draft' | 'published'
  nameUk: string
  nameEn: string
  shortNameUk: string
  categoryUk: string
  categoryEn: string
  shortDescriptionUk: string
  shortDescriptionEn: string
  websiteUrl: string
  logoUrl: string
}

type EventDraft = {
  id?: string
  slug: string
  status: 'draft' | 'published'
  titleUk: string
  titleEn: string
  shortDescriptionUk: string
  shortDescriptionEn: string
  type: string
  format: string
  startAt: string
  endAt: string
  locationUk: string
  locationEn: string
}

type DocumentDraft = {
  id?: string
  slug: string
  status: 'draft' | 'published'
  titleUk: string
  titleEn: string
  descriptionUk: string
  descriptionEn: string
  type: string
  language: string
  accessLevel: 'public' | 'members'
  fileUrl: string
}

type SettingsDraft = {
  phone: string
  email: string
  addressUk: string
  addressEn: string
  brandTaglineUk: string
  brandTaglineEn: string
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

const emptyNews = (): NewsDraft => ({
  slug: '',
  status: 'draft',
  publishedAt: new Date().toISOString().slice(0, 10),
  titleUk: '',
  titleEn: '',
  excerptUk: '',
  excerptEn: '',
  bodyUk: '',
  bodyEn: '',
  coverUrl: '',
})

const emptyMember = (): MemberDraft => ({
  slug: '',
  status: 'draft',
  nameUk: '',
  nameEn: '',
  shortNameUk: '',
  categoryUk: '',
  categoryEn: '',
  shortDescriptionUk: '',
  shortDescriptionEn: '',
  websiteUrl: '',
  logoUrl: '',
})

const emptyEvent = (): EventDraft => ({
  slug: '',
  status: 'draft',
  titleUk: '',
  titleEn: '',
  shortDescriptionUk: '',
  shortDescriptionEn: '',
  type: 'meeting',
  format: 'offline',
  startAt: '',
  endAt: '',
  locationUk: '',
  locationEn: '',
})

const emptyDocument = (): DocumentDraft => ({
  slug: '',
  status: 'draft',
  titleUk: '',
  titleEn: '',
  descriptionUk: '',
  descriptionEn: '',
  type: 'link',
  language: 'uk',
  accessLevel: 'public',
  fileUrl: '',
})

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
  const className =
    'w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900'
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
      {multiline ? (
        <textarea className={className} rows={4} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={className} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  )
}

export default function ContentEditors() {
  const [kind, setKind] = useState<ContentKind>('news')
  const [items, setItems] = useState<unknown[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [news, setNews] = useState<NewsDraft>(emptyNews())
  const [member, setMember] = useState<MemberDraft>(emptyMember())
  const [eventItem, setEventItem] = useState<EventDraft>(emptyEvent())
  const [documentItem, setDocumentItem] = useState<DocumentDraft>(emptyDocument())
  const [settings, setSettings] = useState<SettingsDraft>({
    phone: '',
    email: '',
    addressUk: '',
    addressEn: '',
    brandTaglineUk: '',
    brandTaglineEn: '',
  })

  const load = useCallback(async () => {
    setError(null)
    if (kind === 'settings') {
      const data = await api<{item: Record<string, unknown>}>('content/settings')
      const item = data.item || {}
      const address = (item.address as {uk?: string; en?: string}) || {}
      const brand = (item.brandTagline as {uk?: string; en?: string}) || {}
      setSettings({
        phone: String(item.phone || ''),
        email: String(item.email || ''),
        addressUk: address.uk || '',
        addressEn: address.en || '',
        brandTaglineUk: brand.uk || '',
        brandTaglineEn: brand.en || '',
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
      await api('content/news', {
        method: 'POST',
        body: JSON.stringify({
          id: news.id,
          slug: news.slug,
          status: news.status,
          publishedAt: news.publishedAt,
          title: {uk: news.titleUk, en: news.titleEn},
          excerpt: {uk: news.excerptUk, en: news.excerptEn},
          body: {uk: news.bodyUk, en: news.bodyEn},
          coverImageUrl: news.coverUrl,
        }),
      })
      setMessage('News saved')
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
      await api('content/members', {
        method: 'POST',
        body: JSON.stringify({
          id: member.id,
          slug: member.slug,
          status: member.status,
          name: {uk: member.nameUk, en: member.nameEn},
          shortName: {uk: member.shortNameUk, en: member.shortNameUk},
          category: {uk: member.categoryUk, en: member.categoryEn},
          shortDescription: {uk: member.shortDescriptionUk, en: member.shortDescriptionEn},
          websiteUrl: member.websiteUrl,
          logoUrl: member.logoUrl,
        }),
      })
      setMessage('Member saved')
      setMember(emptyMember())
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  async function saveEvent(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    try {
      await api('content/events', {
        method: 'POST',
        body: JSON.stringify({
          id: eventItem.id,
          slug: eventItem.slug,
          status: eventItem.status,
          title: {uk: eventItem.titleUk, en: eventItem.titleEn},
          shortDescription: {uk: eventItem.shortDescriptionUk, en: eventItem.shortDescriptionEn},
          type: eventItem.type,
          format: eventItem.format,
          startAt: eventItem.startAt,
          endAt: eventItem.endAt,
          location: eventItem.locationUk || eventItem.locationEn,
        }),
      })
      setMessage('Event saved')
      setEventItem(emptyEvent())
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
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
          title: {uk: documentItem.titleUk, en: documentItem.titleEn},
          description: {uk: documentItem.descriptionUk, en: documentItem.descriptionEn},
          type: documentItem.type,
          language: documentItem.language,
          accessLevel: documentItem.accessLevel,
          fileUrl: documentItem.fileUrl,
        }),
      })
      setMessage('Document saved')
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
          address: {uk: settings.addressUk, en: settings.addressEn},
          brandTagline: {uk: settings.brandTaglineUk, en: settings.brandTaglineEn},
        }),
      })
      setMessage('Settings saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  function pickNews(raw: Record<string, unknown>) {
    const title = (raw.title as {uk?: string; en?: string}) || {}
    const excerpt = (raw.excerpt as {uk?: string; en?: string}) || {}
    const body = (raw.body as {uk?: string; en?: string}) || {}
    setNews({
      id: String(raw.id || ''),
      slug: String(raw.slug || ''),
      status: raw.status === 'published' ? 'published' : 'draft',
      publishedAt: String(raw.publishedAt || '').slice(0, 10),
      titleUk: title.uk || '',
      titleEn: title.en || '',
      excerptUk: excerpt.uk || '',
      excerptEn: excerpt.en || '',
      bodyUk: body.uk || '',
      bodyEn: body.en || '',
      coverUrl: String(raw.coverUrl || raw.coverImageUrl || ''),
    })
  }

  function pickMember(raw: Record<string, unknown>) {
    const name = (raw.name as {uk?: string; en?: string}) || {}
    const category = (raw.category as {uk?: string; en?: string}) || {}
    const shortDescription = (raw.shortDescription as {uk?: string; en?: string}) || {}
    setMember({
      id: String(raw.id || ''),
      slug: String(raw.slug || ''),
      status: raw.status === 'published' ? 'published' : 'draft',
      nameUk: name.uk || '',
      nameEn: name.en || '',
      shortNameUk: String(raw.shortName || ''),
      categoryUk: category.uk || '',
      categoryEn: category.en || '',
      shortDescriptionUk: shortDescription.uk || '',
      shortDescriptionEn: shortDescription.en || '',
      websiteUrl: String(raw.websiteUrl || ''),
      logoUrl: String(raw.logoUrl || ''),
    })
  }

  function pickEvent(raw: Record<string, unknown>) {
    const title = (raw.title as {uk?: string; en?: string}) || {}
    const shortDescription = (raw.shortDescription as {uk?: string; en?: string}) || {}
    setEventItem({
      id: String(raw.id || ''),
      slug: String(raw.slug || ''),
      status: raw.status === 'published' ? 'published' : 'draft',
      titleUk: title.uk || '',
      titleEn: title.en || '',
      shortDescriptionUk: shortDescription.uk || '',
      shortDescriptionEn: shortDescription.en || '',
      type: String(raw.type || 'meeting'),
      format: String(raw.format || 'offline'),
      startAt: String(raw.startAt || ''),
      endAt: String(raw.endAt || ''),
      locationUk: String(raw.location || ''),
      locationEn: '',
    })
  }

  function pickDocument(raw: Record<string, unknown>) {
    const title = (raw.title as {uk?: string; en?: string}) || {}
    const description = (raw.description as {uk?: string; en?: string}) || {}
    setDocumentItem({
      id: String(raw.id || ''),
      slug: String(raw.slug || raw.id || ''),
      status: raw.status === 'published' ? 'published' : 'draft',
      titleUk: title.uk || '',
      titleEn: title.en || '',
      descriptionUk: description.uk || '',
      descriptionEn: description.en || '',
      type: String(raw.type || 'link'),
      language: String(raw.language || 'uk'),
      accessLevel: raw.accessLevel === 'members' ? 'members' : 'public',
      fileUrl: String(raw.fileUrl || ''),
    })
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['news', 'members', 'events', 'documents', 'settings'] as const).map((name) => (
          <button
            key={name}
            className={`rounded px-3 py-1.5 text-sm ${kind === name ? 'bg-cyan-700 text-white' : 'border'}`}
            onClick={() => setKind(name)}
          >
            {name}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      {kind !== 'settings' ? (
        <ul className="max-h-48 overflow-auto divide-y rounded border text-sm dark:divide-slate-700 dark:border-slate-700">
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
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => {
                    if (kind === 'news') pickNews(item)
                    if (kind === 'members') pickMember(item)
                    if (kind === 'events') pickEvent(item)
                    if (kind === 'documents') pickDocument(item)
                    setMessage(`Editing ${label}`)
                  }}
                >
                  <span className="font-medium">{label}</span>
                  <span className="ml-2 text-xs text-slate-500">{String(item.status || '')}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}

      {kind === 'news' ? (
        <form className="grid gap-3 md:grid-cols-2" onSubmit={saveNews}>
          <Field label="Slug" value={news.slug} onChange={(v) => setNews({...news, slug: v})} />
          <label className="block space-y-1 text-sm">
            <span>Status</span>
            <select
              className="w-full rounded border px-3 py-2"
              value={news.status}
              onChange={(e) => setNews({...news, status: e.target.value as 'draft' | 'published'})}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </label>
          <Field label="Title UK *" value={news.titleUk} onChange={(v) => setNews({...news, titleUk: v})} />
          <Field label="Title EN" value={news.titleEn} onChange={(v) => setNews({...news, titleEn: v})} />
          <Field label="Excerpt UK" value={news.excerptUk} onChange={(v) => setNews({...news, excerptUk: v})} multiline />
          <Field label="Excerpt EN" value={news.excerptEn} onChange={(v) => setNews({...news, excerptEn: v})} multiline />
          <Field label="Body UK" value={news.bodyUk} onChange={(v) => setNews({...news, bodyUk: v})} multiline />
          <Field label="Body EN" value={news.bodyEn} onChange={(v) => setNews({...news, bodyEn: v})} multiline />
          <Field label="Cover URL" value={news.coverUrl} onChange={(v) => setNews({...news, coverUrl: v})} />
          <label className="block space-y-1 text-sm">
            <span>Upload cover</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                void uploadFile(file)
                  .then((asset) => {
                    setNews((prev) => ({...prev, coverUrl: asset.url}))
                    setMessage(`Uploaded ${asset.id}`)
                  })
                  .catch((err) => setError(err.message))
              }}
            />
          </label>
          <div className="md:col-span-2">
            <button className="rounded bg-cyan-700 px-3 py-2 text-white" type="submit">
              Save news
            </button>
          </div>
        </form>
      ) : null}

      {kind === 'members' ? (
        <form className="grid gap-3 md:grid-cols-2" onSubmit={saveMember}>
          <Field label="Slug" value={member.slug} onChange={(v) => setMember({...member, slug: v})} />
          <label className="block space-y-1 text-sm">
            <span>Status</span>
            <select
              className="w-full rounded border px-3 py-2"
              value={member.status}
              onChange={(e) => setMember({...member, status: e.target.value as 'draft' | 'published'})}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </label>
          <Field label="Name UK *" value={member.nameUk} onChange={(v) => setMember({...member, nameUk: v})} />
          <Field label="Name EN" value={member.nameEn} onChange={(v) => setMember({...member, nameEn: v})} />
          <Field label="Short name" value={member.shortNameUk} onChange={(v) => setMember({...member, shortNameUk: v})} />
          <Field label="Website" value={member.websiteUrl} onChange={(v) => setMember({...member, websiteUrl: v})} />
          <Field
            label="Short description UK"
            value={member.shortDescriptionUk}
            onChange={(v) => setMember({...member, shortDescriptionUk: v})}
            multiline
          />
          <Field
            label="Short description EN"
            value={member.shortDescriptionEn}
            onChange={(v) => setMember({...member, shortDescriptionEn: v})}
            multiline
          />
          <Field label="Logo URL" value={member.logoUrl} onChange={(v) => setMember({...member, logoUrl: v})} />
          <label className="block space-y-1 text-sm">
            <span>Upload logo</span>
            <input
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
          <div className="md:col-span-2">
            <button className="rounded bg-cyan-700 px-3 py-2 text-white" type="submit">
              Save member
            </button>
          </div>
        </form>
      ) : null}

      {kind === 'events' ? (
        <form className="grid gap-3 md:grid-cols-2" onSubmit={saveEvent}>
          <Field label="Slug" value={eventItem.slug} onChange={(v) => setEventItem({...eventItem, slug: v})} />
          <label className="block space-y-1 text-sm">
            <span>Status</span>
            <select
              className="w-full rounded border px-3 py-2"
              value={eventItem.status}
              onChange={(e) => setEventItem({...eventItem, status: e.target.value as 'draft' | 'published'})}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </label>
          <Field label="Title UK *" value={eventItem.titleUk} onChange={(v) => setEventItem({...eventItem, titleUk: v})} />
          <Field label="Title EN" value={eventItem.titleEn} onChange={(v) => setEventItem({...eventItem, titleEn: v})} />
          <Field label="Start (ISO)" value={eventItem.startAt} onChange={(v) => setEventItem({...eventItem, startAt: v})} />
          <Field label="End (ISO)" value={eventItem.endAt} onChange={(v) => setEventItem({...eventItem, endAt: v})} />
          <Field
            label="Short UK"
            value={eventItem.shortDescriptionUk}
            onChange={(v) => setEventItem({...eventItem, shortDescriptionUk: v})}
            multiline
          />
          <Field
            label="Short EN"
            value={eventItem.shortDescriptionEn}
            onChange={(v) => setEventItem({...eventItem, shortDescriptionEn: v})}
            multiline
          />
          <div className="md:col-span-2">
            <button className="rounded bg-cyan-700 px-3 py-2 text-white" type="submit">
              Save event
            </button>
          </div>
        </form>
      ) : null}

      {kind === 'documents' ? (
        <form className="grid gap-3 md:grid-cols-2" onSubmit={saveDocument}>
          <Field label="Slug" value={documentItem.slug} onChange={(v) => setDocumentItem({...documentItem, slug: v})} />
          <label className="block space-y-1 text-sm">
            <span>Status</span>
            <select
              className="w-full rounded border px-3 py-2"
              value={documentItem.status}
              onChange={(e) => setDocumentItem({...documentItem, status: e.target.value as 'draft' | 'published'})}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </label>
          <Field
            label="Title UK *"
            value={documentItem.titleUk}
            onChange={(v) => setDocumentItem({...documentItem, titleUk: v})}
          />
          <Field
            label="Title EN"
            value={documentItem.titleEn}
            onChange={(v) => setDocumentItem({...documentItem, titleEn: v})}
          />
          <Field
            label="File URL"
            value={documentItem.fileUrl}
            onChange={(v) => setDocumentItem({...documentItem, fileUrl: v})}
          />
          <label className="block space-y-1 text-sm">
            <span>Upload PDF (private for members access)</span>
            <input
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
          <label className="block space-y-1 text-sm">
            <span>Access</span>
            <select
              className="w-full rounded border px-3 py-2"
              value={documentItem.accessLevel}
              onChange={(e) =>
                setDocumentItem({
                  ...documentItem,
                  accessLevel: e.target.value === 'members' ? 'members' : 'public',
                })
              }
            >
              <option value="public">public</option>
              <option value="members">members (private blob)</option>
            </select>
          </label>
          <div className="md:col-span-2">
            <button className="rounded bg-cyan-700 px-3 py-2 text-white" type="submit">
              Save document
            </button>
          </div>
        </form>
      ) : null}

      {kind === 'settings' ? (
        <form className="grid gap-3 md:grid-cols-2" onSubmit={saveSettings}>
          <Field label="Phone" value={settings.phone} onChange={(v) => setSettings({...settings, phone: v})} />
          <Field label="Email" value={settings.email} onChange={(v) => setSettings({...settings, email: v})} />
          <Field
            label="Address UK"
            value={settings.addressUk}
            onChange={(v) => setSettings({...settings, addressUk: v})}
          />
          <Field
            label="Address EN"
            value={settings.addressEn}
            onChange={(v) => setSettings({...settings, addressEn: v})}
          />
          <Field
            label="Tagline UK"
            value={settings.brandTaglineUk}
            onChange={(v) => setSettings({...settings, brandTaglineUk: v})}
          />
          <Field
            label="Tagline EN"
            value={settings.brandTaglineEn}
            onChange={(v) => setSettings({...settings, brandTaglineEn: v})}
          />
          <div className="md:col-span-2">
            <button className="rounded bg-cyan-700 px-3 py-2 text-white" type="submit">
              Save settings
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
