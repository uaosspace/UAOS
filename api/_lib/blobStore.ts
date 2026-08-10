import {get, put, del} from '@vercel/blob'

function requirePublicBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not configured')
  return token
}

/** Private docs use a dedicated private store when configured; else fall back to public token. */
function requirePrivateBlobToken() {
  const token =
    process.env.UAOS_PRIVATE_READ_WRITE_TOKEN?.trim() ||
    process.env.BLOB_READ_WRITE_TOKEN?.trim()
  if (!token) throw new Error('Private Blob token is not configured')
  return token
}

export async function putPublicBlob(fileName: string, data: Buffer, contentType: string) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  try {
    return await put(`public/${Date.now()}-${safe}`, data, {
      access: 'public',
      contentType,
      token: requirePublicBlobToken(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // Store-level private mode rejects access:'public' and used to crash vercel dev uncaught.
    if (/private store|public access/i.test(message)) {
      throw new Error(
        'Vercel Blob store is private-only; public media upload is not allowed. Use a public store or change store access in the Vercel dashboard.',
      )
    }
    throw err instanceof Error ? err : new Error(message)
  }
}

export async function putPrivateBlob(fileName: string, data: Buffer, contentType: string) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  try {
    return await put(`private/${Date.now()}-${safe}`, data, {
      access: 'private',
      contentType,
      token: requirePrivateBlobToken(),
      addRandomSuffix: true,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (/public store|private access/i.test(message)) {
      throw new Error(
        'Private media upload requires a private Blob store (UAOS_PRIVATE_READ_WRITE_TOKEN).',
      )
    }
    throw err instanceof Error ? err : new Error(message)
  }
}

export async function getBlobByPathname(pathname: string, access: 'public' | 'private') {
  const token = access === 'private' ? requirePrivateBlobToken() : requirePublicBlobToken()
  return get(pathname, {
    access,
    token,
  })
}

/** Deletes a blob by public URL or storage pathname. */
export async function deleteBlob(urlOrPathname: string): Promise<void> {
  const target = urlOrPathname.trim()
  if (!target) return
  // Try public token first; private docs may need the private store token.
  try {
    await del(target, {token: requirePublicBlobToken()})
  } catch {
    await del(target, {token: requirePrivateBlobToken()})
  }
}
