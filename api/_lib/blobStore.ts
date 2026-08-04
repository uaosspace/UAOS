import {get, put, del} from '@vercel/blob'

function requireBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not configured')
  return token
}

export async function putPublicBlob(fileName: string, data: Buffer, contentType: string) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return put(`public/${Date.now()}-${safe}`, data, {
    access: 'public',
    contentType,
    token: requireBlobToken(),
  })
}

export async function putPrivateBlob(fileName: string, data: Buffer, contentType: string) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return put(`private/${Date.now()}-${safe}`, data, {
    access: 'private',
    contentType,
    token: requireBlobToken(),
    addRandomSuffix: true,
  })
}

export async function getBlobByPathname(pathname: string, access: 'public' | 'private') {
  return get(pathname, {
    access,
    token: requireBlobToken(),
  })
}

/** Deletes a blob by public URL or storage pathname. */
export async function deleteBlob(urlOrPathname: string): Promise<void> {
  const target = urlOrPathname.trim()
  if (!target) return
  await del(target, {token: requireBlobToken()})
}
