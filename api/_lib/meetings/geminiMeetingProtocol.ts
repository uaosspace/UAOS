/**
 * Draft meeting protocol from transcript via Gemini.
 * Server-only: never import from client bundles.
 */

import {
  extractJsonObject,
  isGeminiConfigured,
  readGeminiModel,
} from '../geminiTranslate.js'
import type {NormalizedMeetingReport} from './types.js'

const GEMINI_ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const REQUEST_TIMEOUT_MS = 60_000
export const MAX_PROTOCOL_TRANSCRIPT_CHARS = 80_000

export type ProtocolDraftInput = {
  transcriptText: string
  meetingTitle?: string
}

export function assertProtocolDraftInput(input: ProtocolDraftInput): string {
  const text = input.transcriptText.trim()
  if (!text) throw new Error('transcriptText required')
  if (text.length > MAX_PROTOCOL_TRANSCRIPT_CHARS) {
    return text.slice(0, MAX_PROTOCOL_TRANSCRIPT_CHARS)
  }
  return text
}

export function buildProtocolPrompt(input: ProtocolDraftInput, transcript: string): string {
  const title = input.meetingTitle?.trim() || 'UAOS meeting'
  return [
    'You are an assistant for the Ukrainian Association of Professional Safety (UAOS).',
    'Turn the meeting transcript into a structured protocol draft.',
    'Write the summary and list items in Ukrainian (uk).',
    'Do not invent attendees, decisions, or facts that are not supported by the transcript.',
    'If something is unclear, omit it rather than guessing.',
    `Meeting title: ${title}`,
    'Return ONLY valid JSON of the form:',
    '{"summary":"...","topics":["..."],"decisions":["..."],"actionItems":["..."]}',
    'topics / decisions / actionItems must be arrays of short strings (may be empty).',
    '',
    'Transcript:',
    transcript,
  ].join('\n')
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, 40)
}

export function normalizeProtocolResponse(raw: unknown): {
  summary: string
  topics: string[]
  decisions: string[]
  actionItems: string[]
} {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid protocol payload')
  const root = raw as Record<string, unknown>
  const summary = typeof root.summary === 'string' ? root.summary.trim() : ''
  if (!summary) throw new Error('Protocol summary missing')
  return {
    summary,
    topics: asStringList(root.topics),
    decisions: asStringList(root.decisions),
    actionItems: asStringList(root.actionItems),
  }
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

export async function draftProtocolFromTranscriptWithGemini(
  input: ProtocolDraftInput,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<NormalizedMeetingReport> {
  if (!isGeminiConfigured(env)) {
    throw new Error('GEMINI_API_KEY is not configured')
  }
  const transcript = assertProtocolDraftInput(input)
  const apiKey = env.GEMINI_API_KEY!.trim()
  const model = readGeminiModel(env)
  const url = `${GEMINI_ENDPOINT_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
  const prompt = buildProtocolPrompt(input, transcript)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{role: 'user', parts: [{text: prompt}]}],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    })
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error('Gemini protocol draft failed:', response.status, body.slice(0, 300))
      throw new Error('Protocol draft service error')
    }
    const payload = (await response.json()) as GeminiGenerateResponse
    const text = readCandidateText(payload)
    const parsed = normalizeProtocolResponse(extractJsonObject(text))
    return {
      summary: parsed.summary,
      topics: parsed.topics,
      decisions: parsed.decisions,
      actionItems: parsed.actionItems,
      sourceProvider: 'gemini_manual_transcript',
      rawProviderData: {model, source: 'manual_upload'},
    }
  } finally {
    clearTimeout(timer)
  }
}

/** Fallback draft when Gemini is unavailable — raw transcript preview for manual edit. */
export function fallbackDraftFromTranscript(
  transcriptText: string,
  meetingTitle?: string,
): NormalizedMeetingReport {
  const preview = transcriptText.trim().slice(0, 4000)
  const title = meetingTitle?.trim()
  return {
    summary: title ? `${title}\n\n${preview}` : preview,
    topics: [],
    decisions: [],
    actionItems: [],
    sourceProvider: 'manual_transcript',
    rawProviderData: {source: 'manual_upload', gemini: false},
  }
}
