/**
 * Public content API client (replaces Sanity client).
 */

export class ContentApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ContentApiError'
    this.status = status
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    headers: {Accept: 'application/json'},
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as {error?: string} | null
    throw new ContentApiError(
      typeof body?.error === 'string' ? body.error : `Content request failed (${response.status})`,
      response.status,
    )
  }
  return (await response.json()) as T
}

export async function fetchContentItems<T>(resource: string): Promise<T[]> {
  const data = await fetchJson<{items: T[]}>(`/api/public/${resource}`)
  return Array.isArray(data.items) ? data.items : []
}

export async function fetchContentItem<T>(resource: string): Promise<T> {
  const data = await fetchJson<{item: T}>(`/api/public/${resource}`)
  return data.item
}

export const contentApiConfigured = true
