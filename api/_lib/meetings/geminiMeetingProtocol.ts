/**
 * Draft meeting protocol from transcript via Gemini.
 * Long transcripts: map over overlapping chunks, then reduce into one protocol.
 * Server-only: never import from client bundles.
 */

import {
  extractJsonObject,
  isGeminiConfigured,
  readGeminiModel,
} from '../geminiTranslate.js'
import type {NormalizedMeetingReport} from './types.js'

const GEMINI_ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const REQUEST_TIMEOUT_MS = 180_000

/** Soft single-pass threshold; longer text uses map/reduce chunks. */
export const PROTOCOL_CHUNK_SIZE = 55_000
export const PROTOCOL_CHUNK_OVERLAP = 4_000
/** Absolute ceiling to avoid runaway API cost on pathological uploads. */
export const MAX_PROTOCOL_TRANSCRIPT_CHARS = 400_000

function readPositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) return fallback
  return Math.floor(value)
}

export function resolveProtocolChunking(env: NodeJS.ProcessEnv = process.env): {
  chunkSize: number
  overlap: number
} {
  const chunkSize = readPositiveInt(env.UAOS_PROTOCOL_CHUNK_SIZE, PROTOCOL_CHUNK_SIZE)
  const overlap = readPositiveInt(env.UAOS_PROTOCOL_CHUNK_OVERLAP, PROTOCOL_CHUNK_OVERLAP)
  if (overlap >= chunkSize) {
    return {chunkSize, overlap: Math.max(0, Math.floor(chunkSize / 10))}
  }
  return {chunkSize, overlap}
}

export type ProtocolDraftInput = {
  transcriptText: string
  meetingTitle?: string
}

export type TranscriptChunk = {
  index: number
  start: number
  end: number
  text: string
}

export type ChunkPartialExtract = {
  chunkIndex: number
  kind?: string
  notes: string[]
  topics: string[]
  decisions: string[]
  actionItems: string[]
}

export function assertProtocolDraftInput(input: ProtocolDraftInput): {
  text: string
  truncated: boolean
} {
  const text = input.transcriptText.trim()
  if (!text) throw new Error('transcriptText required')
  if (text.length > MAX_PROTOCOL_TRANSCRIPT_CHARS) {
    return {text: text.slice(0, MAX_PROTOCOL_TRANSCRIPT_CHARS), truncated: true}
  }
  return {text, truncated: false}
}

/** Split transcript into overlapping windows for map/reduce. */
export function splitTranscriptIntoChunks(
  text: string,
  chunkSize: number = PROTOCOL_CHUNK_SIZE,
  overlap: number = PROTOCOL_CHUNK_OVERLAP,
): TranscriptChunk[] {
  const source = text.trim()
  if (!source) return []
  if (chunkSize <= 0) throw new Error('chunkSize must be positive')
  if (overlap < 0 || overlap >= chunkSize) throw new Error('overlap must be >= 0 and < chunkSize')

  if (source.length <= chunkSize) {
    return [{index: 0, start: 0, end: source.length, text: source}]
  }

  const step = chunkSize - overlap
  const chunks: TranscriptChunk[] = []
  let start = 0
  let index = 0
  while (start < source.length) {
    const end = Math.min(start + chunkSize, source.length)
    chunks.push({index, start, end, text: source.slice(start, end)})
    if (end >= source.length) break
    start += step
    index += 1
  }
  return chunks
}

function sharedAccuracyRules(): string[] {
  return [
    'Write extracted notes in Ukrainian (uk).',
    'Do not invent attendees, votes, deadlines, costs, roadmaps, or decisions absent from THIS text.',
    'Ignore waiting / small talk / jokes unless they contain a real decision or assignment.',
    'Correct ASR only when highly confident; otherwise mark «нечітко в розшифровці».',
    'Do not include the raw transcript in any JSON field.',
  ]
}

export function buildChunkMapPrompt(input: {
  meetingTitle?: string
  chunk: TranscriptChunk
  totalChunks: number
}): string {
  const title = input.meetingTitle?.trim() || 'UAOS meeting'
  const {chunk, totalChunks} = input
  return [
    'You are an assistant for UAOS. Extract ONLY useful facts from ONE transcript chunk.',
    `Meeting title (context only): ${title}`,
    `Chunk ${chunk.index + 1} of ${totalChunks} (chars ${chunk.start}–${chunk.end}).`,
    '',
    ...sharedAccuracyRules(),
    '',
    'Classify this chunk: formal|work|demo_ui|chatter|noisy_asr (one value in "kind").',
    'Return ONLY valid JSON:',
    '{',
    '  "kind": "formal|work|demo_ui|chatter|noisy_asr",',
    '  "notes": ["short factual notes from this chunk"],',
    '  "topics": ["..."],',
    '  "decisions": ["..."],',
    '  "actionItems": ["Who — what — deadline if present"]',
    '}',
    'Use [] when empty. Prefer precision over completeness. Skip small talk in notes.',
    '',
    'Chunk text:',
    chunk.text,
  ].join('\n')
}

export function buildReducePrompt(input: {
  meetingTitle?: string
  partials: ChunkPartialExtract[]
  truncatedInput?: boolean
}): string {
  const title = input.meetingTitle?.trim() || 'UAOS meeting'
  const partialJson = JSON.stringify(input.partials, null, 2)
  return [
    'You are an assistant for the Ukrainian Association of Professional Safety (UAOS).',
    'Merge chunk extracts into ONE faithful protocol draft. Accuracy beats polish.',
    'Write everything in Ukrainian (uk).',
    `Meeting title (context only): ${title}`,
    input.truncatedInput
      ? 'NOTE: source transcript was truncated by an absolute size ceiling before chunking.'
      : '',
    '',
    'Hard requirements:',
    '- PRESERVE every distinct decision and action item from the chunk extracts (dedupe near-duplicates).',
    '- Do NOT drop tail/end items just because early chunks were chatter.',
    '- Do NOT invent new decisions/action items that are not in the extracts.',
    '- Small talk / waiting / jokes from extracts must not inflate the report (1–2 sentences max if needed).',
    '- Report length follows USEFULNESS, not meeting duration. Soft ceiling ~3 Word pages for detailedProtocol;',
    '  short chat/demo → much shorter. Do not pad to fill pages.',
    '',
    'Return ONLY valid JSON:',
    '{',
    '  "detailedProtocol": "markdown string",',
    '  "briefReport": "short plain text",',
    '  "topics": ["..."],',
    '  "decisions": ["..."],',
    '  "actionItems": ["..."]',
    '}',
    '',
    'detailedProtocol headings IN ORDER; OMIT empty ones entirely:',
    '## Мета зустрічі',
    '## Порядок денний / теми',
    '## Хід обговорення',
    '## Рішення',
    '## Поручення',
    'Under Поручення only clear assignments: «Хто — що — строк (якщо є)».',
    'briefReport: 2–8 sentences grounded in extracts.',
    '',
    'Chunk extracts JSON:',
    partialJson,
  ]
    .filter((line) => line !== '')
    .join('\n')
}

export function buildProtocolPrompt(input: ProtocolDraftInput, transcript: string): string {
  const title = input.meetingTitle?.trim() || 'UAOS meeting'
  return [
    'You are an assistant for the Ukrainian Association of Professional Safety (UAOS).',
    'Your job: turn a meeting transcript into a faithful protocol draft. Accuracy beats polish.',
    'Write everything in Ukrainian (uk).',
    `Meeting title (context only — do not invent content from the title alone): ${title}`,
    '',
    'Step 0 — classify the transcript before writing (do this mentally; reflect it in the draft):',
    '- formal meeting / committee discussion with decisions;',
    '- product / work discussion without formal votes;',
    '- demo / UI walkthrough / tech support (e.g. Zoom record button, screen share);',
    '- casual chatter;',
    '- ASR too noisy to reconstruct reliably.',
    'Match the draft type to the class. A Zoom UI demo must be described as a demo/instruction,',
    'never rewritten as a strategic platform roadmap or formal committee decisions.',
    '',
    'ASR / noise rules:',
    '- Transcripts often contain speech-to-text errors (wrong words, broken phrases).',
    '- Correct an ASR error ONLY when the intended meaning is highly confident from context.',
    '- If unsure, paraphrase cautiously or mark «нечітко в розшифровці» — never invent a cleaner story.',
    '- If the transcript is mostly unintelligible: write a short honest draft stating low transcript quality,',
    '  summarize only what is clearly recoverable, and leave decisions/actionItems empty.',
    '  Do NOT produce a polished fake protocol to fill the template.',
    '',
    'Length / usefulness:',
    '- Report length follows useful content, NOT wall-clock duration.',
    '- Waiting / small talk / jokes → at most 1–2 sentences total, never a full page.',
    '- Soft ceiling ~3 Word pages for detailedProtocol; short meetings/demos should be much shorter.',
    '- Do not pad or retell the whole conversation.',
    '',
    'Hard bans:',
    '- Do not invent attendees, votes, deadlines, costs, product roadmaps, or decisions absent from the transcript.',
    '- Do not upgrade vague talk into formal «Рішення» or «Поручення».',
    '- Do not fill gaps with filler like «Не зазначено — … — строк: не зазначено».',
    '- Do not include the raw transcript in any JSON field.',
    '',
    'Return ONLY valid JSON of this exact shape:',
    '{',
    '  "detailedProtocol": "markdown string",',
    '  "briefReport": "short plain text",',
    '  "topics": ["..."],',
    '  "decisions": ["..."],',
    '  "actionItems": ["..."]',
    '}',
    '',
    'Field rules:',
    '1) detailedProtocol — Markdown. Use these headings IN ORDER, but OMIT any heading that has no',
    '   supported content (empty section = skip heading entirely):',
    '   ## Мета зустрічі',
    '   ## Порядок денний / теми',
    '   ## Хід обговорення',
    '   ## Рішення',
    '   ## Поручення',
    '   Under «Поручення» only if someone was clearly assigned a task: «Хто — що — строк (якщо є)».',
    '   If nobody was assigned — omit ## Поручення completely.',
    '2) briefReport — short report for quick reading: 2–8 sentences grounded in the transcript.',
    '   For demos/UI walkthroughs: say what was shown/explained. For noisy ASR: say quality is low.',
    '3) topics / decisions / actionItems — short string arrays mirroring ONLY what appears in the protocol.',
    '   Use [] when there were no clear topics / decisions / assignments.',
    '',
    'Transcript:',
    transcript,
  ].join('\n')
}

function asStringList(value: unknown, max = 40): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, max)
}

export function normalizeChunkPartial(
  raw: unknown,
  chunkIndex: number,
): ChunkPartialExtract {
  if (!raw || typeof raw !== 'object') {
    return {chunkIndex, notes: [], topics: [], decisions: [], actionItems: []}
  }
  const root = raw as Record<string, unknown>
  const kind = typeof root.kind === 'string' ? root.kind.trim() : undefined
  return {
    chunkIndex,
    kind,
    notes: asStringList(root.notes, 20),
    topics: asStringList(root.topics, 20),
    decisions: asStringList(root.decisions, 20),
    actionItems: asStringList(root.actionItems, 20),
  }
}

/** Compose editable summary: detailed protocol first, brief report below. */
export function composeProtocolSummary(detailedProtocol: string, briefReport: string): string {
  const detailed = detailedProtocol.trim()
  const brief = briefReport.trim()
  if (detailed && brief) {
    return [
      '## Детальний протокол',
      '',
      detailed,
      '',
      '## Короткий звіт',
      '',
      brief,
    ].join('\n')
  }
  return detailed || brief
}

export function normalizeProtocolResponse(raw: unknown): {
  summary: string
  topics: string[]
  decisions: string[]
  actionItems: string[]
} {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid protocol payload')
  const root = raw as Record<string, unknown>

  const detailed =
    typeof root.detailedProtocol === 'string' ? root.detailedProtocol.trim() : ''
  const brief = typeof root.briefReport === 'string' ? root.briefReport.trim() : ''
  const legacySummary = typeof root.summary === 'string' ? root.summary.trim() : ''

  const summary = composeProtocolSummary(detailed, brief) || legacySummary
  if (!summary) throw new Error('Protocol summary missing')

  return {
    summary,
    topics: asStringList(root.topics),
    decisions: asStringList(root.decisions),
    actionItems: asStringList(root.actionItems),
  }
}

export function withProcessingNotes(
  summary: string,
  notes: string[],
): string {
  const unique = [...new Set(notes.map((item) => item.trim()).filter(Boolean))]
  if (!unique.length) return summary
  return `${summary.trim()}\n\n## Примітки обробки\n\n${unique.map((item) => `- ${item}`).join('\n')}`
}

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {parts?: Array<{text?: string}>}
  }>
}

function readCandidateText(payload: GeminiGenerateResponse): string {
  const parts = payload.candidates?.[0]?.content?.parts
  if (!parts?.length) throw new Error('Gemini returned no candidates')
  const text = parts.map((part) => part.text || '').join('\n').trim()
  if (!text) throw new Error('Gemini returned empty text')
  return text
}

async function callGeminiJson(input: {
  prompt: string
  apiKey: string
  model: string
  url: string
  fetchImpl: typeof fetch
}): Promise<unknown> {
  const maxAttempts = 5
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      const response = await input.fetchImpl(input.url, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{role: 'user', parts: [{text: input.prompt}]}],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      })
      if (!response.ok) {
        const body = await response.text().catch(() => '')
        const retryable = response.status === 429 || response.status === 503
        console.error(
          'Gemini protocol draft failed:',
          response.status,
          body.slice(0, 300),
          retryable && attempt < maxAttempts ? `(retry ${attempt}/${maxAttempts})` : '',
        )
        lastError = new Error('Protocol draft service error')
        if (retryable && attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2500 * attempt))
          continue
        }
        throw lastError
      }
      const payload = (await response.json()) as GeminiGenerateResponse
      const text = readCandidateText(payload)
      return extractJsonObject(text)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (lastError.message === 'Protocol draft service error') throw lastError
      const retryable =
        lastError.name === 'AbortError' || /fetch|network|timeout/i.test(lastError.message)
      if (retryable && attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2500 * attempt))
        continue
      }
      throw lastError
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError || new Error('Protocol draft service error')
}


export async function draftProtocolFromTranscriptWithGemini(
  input: ProtocolDraftInput,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<NormalizedMeetingReport> {
  if (!isGeminiConfigured(env)) {
    throw new Error('GEMINI_API_KEY is not configured')
  }
  const {text: transcript, truncated} = assertProtocolDraftInput(input)
  const apiKey = env.GEMINI_API_KEY!.trim()
  const model = readGeminiModel(env)
  const chunking = resolveProtocolChunking(env)
  const url = `${GEMINI_ENDPOINT_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
  const processingNotes: string[] = []
  if (truncated) {
    processingNotes.push(
      `Вхідну розшифровку обрізано до ${MAX_PROTOCOL_TRANSCRIPT_CHARS} символів (абсолютна стеля).`,
    )
  }

  const chunks = splitTranscriptIntoChunks(
    transcript,
    chunking.chunkSize,
    chunking.overlap,
  )
  let parsed: ReturnType<typeof normalizeProtocolResponse>
  let mode: 'single' | 'map_reduce' = 'single'

  if (chunks.length === 1) {
    const raw = await callGeminiJson({
      prompt: buildProtocolPrompt(input, chunks[0].text),
      apiKey,
      model,
      url,
      fetchImpl,
    })
    parsed = normalizeProtocolResponse(raw)
  } else {
    mode = 'map_reduce'
    processingNotes.push(
      `Довгу розшифровку оброблено частинами: ${chunks.length} фрагментів (~${chunking.chunkSize} символів, overlap ${chunking.overlap}).`,
    )
    const partials: ChunkPartialExtract[] = []
    for (const chunk of chunks) {
      const raw = await callGeminiJson({
        prompt: buildChunkMapPrompt({
          meetingTitle: input.meetingTitle,
          chunk,
          totalChunks: chunks.length,
        }),
        apiKey,
        model,
        url,
        fetchImpl,
      })
      partials.push(normalizeChunkPartial(raw, chunk.index))
    }
    const reduced = await callGeminiJson({
      prompt: buildReducePrompt({
        meetingTitle: input.meetingTitle,
        partials,
        truncatedInput: truncated,
      }),
      apiKey,
      model,
      url,
      fetchImpl,
    })
    parsed = normalizeProtocolResponse(reduced)
  }

  return {
    summary: withProcessingNotes(parsed.summary, processingNotes),
    topics: parsed.topics,
    decisions: parsed.decisions,
    actionItems: parsed.actionItems,
    sourceProvider: 'gemini_manual_transcript',
    rawProviderData: {
      model,
      source: 'manual_upload',
      mode,
      chunks: chunks.length,
      truncated,
      transcriptChars: transcript.length,
    },
  }
}

/** Fallback draft when Gemini is unavailable — raw transcript preview for manual edit. */
export function fallbackDraftFromTranscript(
  transcriptText: string,
  meetingTitle?: string,
): NormalizedMeetingReport {
  const preview = transcriptText.trim().slice(0, 4000)
  const title = meetingTitle?.trim()
  const detailed = [
    title ? `## Мета зустрічі\n${title}` : '## Мета зустрічі\nне зазначено',
    '## Хід обговорення',
    preview || 'не зазначено',
  ].join('\n\n')
  return {
    summary: composeProtocolSummary(
      detailed,
      'Короткий звіт недоступний без Gemini — відредагуйте вручну за розшифровкою.',
    ),
    topics: [],
    decisions: [],
    actionItems: [],
    sourceProvider: 'manual_transcript',
    rawProviderData: {source: 'manual_upload', gemini: false},
  }
}
