/**
 * Parse and validate locally uploaded Zoom/meeting transcripts (.vtt / .txt).
 * Server-only — used by admin upload, not by Zoom cloud sync.
 */

export const MAX_TRANSCRIPT_UPLOAD_BYTES = 2 * 1024 * 1024
export const MAX_TRANSCRIPT_STORE_CHARS = 500_000

const ALLOWED_EXTENSIONS = new Set(['.vtt', '.txt', '.text'])

export type TranscriptFormat = 'vtt' | 'txt'

export type ParsedTranscriptUpload = {
  format: TranscriptFormat
  contentText: string
  fileName: string
  byteLength: number
}

function extensionOf(fileName: string): string {
  const base = fileName.trim().toLowerCase()
  const dot = base.lastIndexOf('.')
  if (dot < 0) return ''
  return base.slice(dot)
}

export function detectTranscriptFormat(fileName: string, rawText: string): TranscriptFormat {
  const ext = extensionOf(fileName)
  if (ext === '.vtt') return 'vtt'
  const head = rawText.trimStart().slice(0, 16).toUpperCase()
  if (head.startsWith('WEBVTT')) return 'vtt'
  return 'txt'
}

/** Strip WEBVTT chrome; keep cue text in order. */
export function parseVttToPlainText(raw: string): string {
  const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/)
  const out: string[] = []
  let i = 0

  if (lines[0]?.trim().toUpperCase().startsWith('WEBVTT')) {
    i = 1
    while (i < lines.length && lines[i]!.trim() !== '') i += 1
    if (i < lines.length && lines[i]!.trim() === '') i += 1
  }

  while (i < lines.length) {
    const line = lines[i]!.trimEnd()
    const trimmed = line.trim()
    i += 1
    if (!trimmed) continue
    if (/^NOTE\b/i.test(trimmed) || /^STYLE\b/i.test(trimmed) || /^REGION\b/i.test(trimmed)) {
      while (i < lines.length && lines[i]!.trim() !== '') i += 1
      continue
    }
    if (/-->/.test(trimmed)) continue
    if (/^\d+$/.test(trimmed)) continue
    out.push(trimmed.replace(/<\/?[^>]+>/g, ''))
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function normalizePlainTranscript(raw: string): string {
  return raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim()
}

export function assertTranscriptUploadInput(input: {
  fileName: string
  dataBase64: string
}): ParsedTranscriptUpload {
  const fileName = input.fileName.trim()
  if (!fileName) throw new Error('fileName required')
  if (fileName.length > 200) throw new Error('fileName too long')
  if (/[\\/]/.test(fileName) || fileName.includes('..')) {
    throw new Error('Invalid fileName')
  }

  const ext = extensionOf(fileName)
  if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error('Unsupported transcript type (use .vtt or .txt)')
  }

  const dataBase64 = input.dataBase64.trim()
  if (!dataBase64) throw new Error('Missing file data')

  let buffer: Buffer
  try {
    buffer = Buffer.from(dataBase64, 'base64')
  } catch {
    throw new Error('Invalid file data')
  }
  if (!buffer.byteLength) throw new Error('Empty file')
  if (buffer.byteLength > MAX_TRANSCRIPT_UPLOAD_BYTES) {
    throw new Error('File too large')
  }

  const rawText = buffer.toString('utf8')
  const format = detectTranscriptFormat(fileName, rawText)
  const contentText =
    format === 'vtt' ? parseVttToPlainText(rawText) : normalizePlainTranscript(rawText)

  if (!contentText) throw new Error('Transcript is empty')
  if (contentText.length > MAX_TRANSCRIPT_STORE_CHARS) {
    throw new Error(`Transcript exceeds ${MAX_TRANSCRIPT_STORE_CHARS} characters`)
  }

  return {
    format,
    contentText,
    fileName,
    byteLength: buffer.byteLength,
  }
}
