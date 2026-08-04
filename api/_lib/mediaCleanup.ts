import {deleteBlob} from './blobStore.js'
import {getSql} from './db.js'

function normalizeMediaUrl(url: string): string {
  return url.trim()
}

/** Pure policy: release only tracked uploads with zero remaining content refs. */
export function shouldReleaseOwnedMedia(hasMediaAsset: boolean, referenceCount: number): boolean {
  return hasMediaAsset && referenceCount <= 0
}

export async function getMediaAssetByUrl(url: string) {
  const normalized = normalizeMediaUrl(url)
  if (!normalized) return null
  const sql = getSql()
  const rows = await sql`
    SELECT id, storage_key, url, visibility
    FROM media_assets
    WHERE url = ${normalized}
    LIMIT 1
  `
  if (!rows[0]) return null
  const row = rows[0] as Record<string, unknown>
  return {
    id: String(row.id),
    storageKey: String(row.storage_key),
    url: String(row.url ?? ''),
    visibility: String(row.visibility) === 'private' ? ('private' as const) : ('public' as const),
  }
}

export async function countContentReferencesToMediaUrl(url: string): Promise<number> {
  const normalized = normalizeMediaUrl(url)
  if (!normalized) return 0
  const sql = getSql()
  const rows = await sql`
    SELECT (
      (SELECT COUNT(*)::int FROM content_events WHERE cover_url = ${normalized})
      + (SELECT COUNT(*)::int FROM content_news WHERE cover_url = ${normalized})
      + (SELECT COUNT(*)::int FROM content_members WHERE cover_url = ${normalized} OR logo_url = ${normalized})
      + (SELECT COUNT(*)::int FROM content_documents WHERE file_url = ${normalized} OR external_url = ${normalized})
    ) AS ref_count
  `
  return Number((rows[0] as {ref_count?: number} | undefined)?.ref_count ?? 0)
}

/**
 * Deletes a Blob object + media_assets row when the URL is an uploaded asset
 * and no remaining content row points at it. External pasted URLs are ignored.
 * Best-effort: Blob failures are logged; media_assets row is still removed when unused.
 */
export async function releaseOwnedMediaIfUnused(url: string): Promise<{released: boolean}> {
  const normalized = normalizeMediaUrl(url)
  if (!normalized) return {released: false}

  const asset = await getMediaAssetByUrl(normalized)
  if (!asset) return {released: false}

  const refs = await countContentReferencesToMediaUrl(normalized)
  if (!shouldReleaseOwnedMedia(true, refs)) return {released: false}

  const sql = getSql()
  try {
    await deleteBlob(asset.url || asset.storageKey)
  } catch (err) {
    console.error('mediaCleanup: blob delete failed', {
      assetId: asset.id,
      url: normalized,
      err: err instanceof Error ? err.message : err,
    })
  }

  await sql`DELETE FROM media_assets WHERE id = ${asset.id}::uuid`
  return {released: true}
}

export {normalizeMediaUrl}
