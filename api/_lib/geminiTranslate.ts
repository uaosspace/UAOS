/**
 * Draft translations via Gemini for admin CMS fields.
 * Server-only: never import from client bundles.
 */

import {LOCALES, type Locale} from '../../src/data/locales.js'

const GEMINI_ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const DEFAULT_MODEL = 'gemini-flash-latest'
const REQUEST_TIMEOUT_MS = 45_000
const MAX_FIELDS = 12
const MAX_FIELD_CHARS = 12_000
const MAX_TOTAL_CHARS = 40_000

export type TranslateFieldsInput = {
  sourceLocale: Locale
  targetLocales: Locale[]
  /** Map of field key → source text (already in sourceLocale). */
  fields: Record<string, string>
}

export type TranslateFieldsResult = {
  translations: Record<string, Partial<Record<Locale, string>>>
  model: string
}

export function isGeminiConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.GEMINI_API_KEY?.trim())
}

export function readGeminiModel(env: NodeJS.ProcessEnv = process.env): string {
  const raw = env.GEMINI_MODEL?.trim()
  return raw || DEFAULT_MODEL
}

export function assertTranslateFieldsInput(input: TranslateFieldsInput): void {
  if (!LOCALES.includes(input.sourceLocale)) {
    throw new Error('Invalid sourceLocale')
  }
  if (!Array.isArray(input.targetLocales) || input.targetLocales.length === 0) {
    throw new Error('targetLocales required')
  }
  for (const locale of input.targetLocales) {
    if (!LOCALES.includes(locale)) throw new Error(`Invalid target locale: ${locale}`)
    if (locale === input.sourceLocale) throw new Error('targetLocales must differ from sourceLocale')
  }
  const keys = Object.keys(input.fields)
  if (keys.length === 0) throw new Error('fields required')
  if (keys.length > MAX_FIELDS) throw new Error(`At most ${MAX_FIELDS} fields`)

  let total = 0
  for (const key of keys) {
    const value = input.fields[key]
    if (typeof value !== 'string') throw new Error(`Field ${key} must be a string`)
    const trimmed = value.trim()
    if (!trimmed) throw new Error(`Field ${key} is empty`)
    if (trimmed.length > MAX_FIELD_CHARS) {
      throw new Error(`Field ${key} exceeds ${MAX_FIELD_CHARS} characters`)
    }
    total += trimmed.length
  }
  if (total > MAX_TOTAL_CHARS) {
    throw new Error(`Total text exceeds ${MAX_TOTAL_CHARS} characters`)
  }
}

/** Builds the model prompt; exported for unit tests. */
export function buildTranslatePrompt(input: TranslateFieldsInput): string {
  const fieldBlock = Object.entries(input.fields)
    .map(([key, text]) => `### ${key}\n${text.trim()}`)
    .join('\n\n')

  return [
    'You are a professional translator for the Ukrainian Association of Professional Safety (UAOS) website.',
    'Translate each field from the source language into every target language.',
    'Keep meaning, tone, and formatting (paragraph breaks). Do not add commentary.',
    'Do not invent facts. If a term is an official name or acronym, keep it when appropriate.',
    `Source language code: ${input.sourceLocale}`,
    `Target language codes: ${input.targetLocales.join(', ')}`,
    'Return ONLY valid JSON of the form:',
    '{"translations":{"fieldKey":{"en":"...","de":"..."}}}',
    'Include every field key and every target locale.',
    '',
    'Fields:',
    fieldBlock,
  ].join('\n')
}

/**
 * Extracts JSON object from model text (raw JSON or fenced ```json block).
 */
export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('Empty model response')

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1]?.trim() || trimmed

  try {
    return JSON.parse(candidate) as unknown
  } catch {
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1)) as unknown
    }
    throw new Error('Model response is not JSON')
  }
}

export function normalizeTranslateResponse(
  raw: unknown,
  input: TranslateFieldsInput,
): Record<string, Partial<Record<Locale, string>>> {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid translation payload')
  const root = raw as Record<string, unknown>
  const translationsNode =
    root.translations && typeof root.translations === 'object'
      ? (root.translations as Record<string, unknown>)
      : root

  const out: Record<string, Partial<Record<Locale, string>>> = {}
  for (const key of Object.keys(input.fields)) {
    const perLocale = translationsNode[key]
    if (!perLocale || typeof perLocale !== 'object') {
      throw new Error(`Missing translations for field ${key}`)
    }
    const map = perLocale as Record<string, unknown>
    const localized: Partial<Record<Locale, string>> = {}
    for (const locale of input.targetLocales) {
      const value = map[locale]
      if (typeof value !== 'string' || !value.trim()) {
        throw new Error(`Missing ${locale} translation for ${key}`)
      }
      localized[locale] = value.trim()
    }
    out[key] = localized
  }
  return out
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

/**
 * Calls Gemini to draft translations. Throws on configuration or API errors.
 * Does not log field contents.
 */
export async function translateFieldsWithGemini(
  input: TranslateFieldsInput,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<TranslateFieldsResult> {
  assertTranslateFieldsInput(input)

  const apiKey = env.GEMINI_API_KEY?.trim()
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured')

  const model = readGeminiModel(env)
  const url = `${GEMINI_ENDPOINT_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
  const prompt = buildTranslatePrompt(input)

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
      console.error('Gemini translate failed:', response.status, body.slice(0, 300))
      throw new Error('Translation service error')
    }

    const payload = (await response.json()) as GeminiGenerateResponse
    const text = readCandidateText(payload)
    const parsed = extractJsonObject(text)
    const translations = normalizeTranslateResponse(parsed, input)
    return {translations, model}
  } finally {
    clearTimeout(timer)
  }
}
