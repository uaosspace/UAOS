import {describe, expect, it, vi} from 'vitest'
import {
  PROTOCOL_CHUNK_OVERLAP,
  PROTOCOL_CHUNK_SIZE,
  assertProtocolDraftInput,
  buildChunkMapPrompt,
  buildProtocolPrompt,
  buildReducePrompt,
  composeProtocolSummary,
  draftProtocolFromTranscriptWithGemini,
  fallbackDraftFromTranscript,
  normalizeChunkPartial,
  normalizeProtocolResponse,
  splitTranscriptIntoChunks,
  withProcessingNotes,
} from './geminiMeetingProtocol.js'

function geminiJsonResponse(payload: unknown) {
  return {
    ok: true,
    async json() {
      return {
        candidates: [{content: {parts: [{text: JSON.stringify(payload)}]}}],
      }
    },
    async text() {
      return ''
    },
  }
}

/** Deterministic stand-in for Gemini: map extracts ACTION markers; reduce keeps all. */
function createSimulatedGeminiFetch() {
  return vi.fn(async (_url: string, init?: RequestInit) => {
    const body = typeof init?.body === 'string' ? init.body : ''
    const parsedBody = JSON.parse(body) as {
      contents?: Array<{parts?: Array<{text?: string}>}>
    }
    const prompt = parsedBody.contents?.[0]?.parts?.[0]?.text || ''

    if (prompt.includes('Chunk extracts JSON:')) {
      const jsonStart = prompt.indexOf('Chunk extracts JSON:')
      const partialsRaw = prompt.slice(jsonStart + 'Chunk extracts JSON:'.length).trim()
      const partials = JSON.parse(partialsRaw) as Array<{
        actionItems?: string[]
        decisions?: string[]
        topics?: string[]
        notes?: string[]
        kind?: string
      }>
      const actionItems = [...new Set(partials.flatMap((item) => item.actionItems || []))]
      const decisions = [...new Set(partials.flatMap((item) => item.decisions || []))]
      const topics = [...new Set(partials.flatMap((item) => item.topics || []))]
      const hasChatter = partials.some((item) => item.kind === 'chatter')
      return geminiJsonResponse({
        detailedProtocol: [
          '## Мета зустрічі',
          'Робоча нарада (з фрагментів розшифровки).',
          '## Хід обговорення',
          hasChatter ? 'Було очікування/неформальне спілкування — стисло.' : 'Обговорення робочих питань.',
          decisions.length ? `## Рішення\n${decisions.map((item) => `- ${item}`).join('\n')}` : '',
          actionItems.length
            ? `## Поручення\n${actionItems.map((item) => `- ${item}`).join('\n')}`
            : '',
        ]
          .filter(Boolean)
          .join('\n\n'),
        briefReport: `Коротко: збережено ${actionItems.length} поручень і ${decisions.length} рішень з фрагментів.`,
        topics,
        decisions,
        actionItems,
      })
    }

    if (prompt.includes('Extract ONLY useful facts from ONE transcript chunk')) {
      const marker = 'Chunk text:'
      const text = prompt.slice(prompt.indexOf(marker) + marker.length).trim()
      const actions = [...text.matchAll(/\[ACTION:([A-Z0-9_]+)\]([^\n\[]*)/g)].map(
        (match) => `${match[1]} — ${match[2].trim() || 'поручення'}`,
      )
      const decisions = [...text.matchAll(/\[DECISION:([A-Z0-9_]+)\]([^\n\[]*)/g)].map(
        (match) => `${match[1]} — ${match[2].trim() || 'рішення'}`,
      )
      const isChatter = /WAITING|JOKES|SMALL_TALK/i.test(text) && actions.length === 0
      return geminiJsonResponse({
        kind: isChatter ? 'chatter' : actions.length || decisions.length ? 'work' : 'chatter',
        notes: isChatter ? ['очікування / small talk'] : ['робочий фрагмент'],
        topics: decisions.length || actions.length ? ['робочі питання'] : [],
        decisions,
        actionItems: actions,
      })
    }

    // Single-pass full protocol
    const marker = 'Transcript:'
    const text = prompt.slice(prompt.indexOf(marker) + marker.length).trim()
    const actions = [...text.matchAll(/\[ACTION:([A-Z0-9_]+)\]([^\n\[]*)/g)].map(
      (match) => `${match[1]} — ${match[2].trim() || 'поручення'}`,
    )
    if (/Zoom|кнопк[аи] запис|три точки/i.test(text) && actions.length === 0) {
      return geminiJsonResponse({
        detailedProtocol:
          '## Мета зустрічі\nДемонстрація інтерфейсу Zoom.\n\n## Хід обговорення\nПоказано, де вмикати запис і меню «три точки».',
        briefReport: 'Коротке демо UI Zoom без формальних рішень.',
        topics: ['Zoom UI'],
        decisions: [],
        actionItems: [],
      })
    }
    return geminiJsonResponse({
      detailedProtocol: `## Хід обговорення\nОброблено short transcript.\n\n## Поручення\n${actions.map((item) => `- ${item}`).join('\n') || '—'}`,
      briefReport: 'Короткий single-pass звіт.',
      topics: actions.length ? ['поручення'] : [],
      decisions: [],
      actionItems: actions,
    })
  })
}

function buildScriptedConference(totalChars: number): string {
  // Place markers at absolute offsets: 20k, 55k, 95k, 140k (when length allows).
  const marks: Array<{at: number; token: string}> = [
    {at: 20_000, token: '[ACTION:A20] Підготувати вступні матеріали'},
    {at: 55_000, token: '[ACTION:D55] Закрити задачу з середини'},
    {at: 95_000, token: '[ACTION:B95] Зафіксувати рішення після паузи'},
    {at: 140_000, token: '[ACTION:C140] Розіслати підсумки'},
  ]

  const parts: string[] = []
  let cursor = 0
  const pushFill = (label: string, until: number) => {
    const need = Math.max(0, until - cursor)
    if (need <= 0) return
    const unit = `${label}. `
    parts.push(unit.repeat(Math.ceil(need / unit.length)).slice(0, need))
    cursor += need
  }

  pushFill('WAITING', 15_000)
  pushFill('INTRO', 20_000)
  parts.push(`${marks[0].token}\n`)
  cursor += marks[0].token.length + 1

  pushFill('WORK', 55_000)
  parts.push(`${marks[1].token}\n`)
  cursor += marks[1].token.length + 1

  pushFill('WORK2', 70_000)
  pushFill('JOKES SMALL_TALK', 90_000)
  pushFill('REGATHER', 95_000)
  parts.push(`${marks[2].token}\n`)
  cursor += marks[2].token.length + 1

  pushFill('WRAPUP', 140_000)
  parts.push(`${marks[3].token}\n`)
  cursor += marks[3].token.length + 1

  pushFill('END', totalChars)
  const text = parts.join('')
  if (text.length < totalChars) {
    return text + 'X'.repeat(totalChars - text.length)
  }
  return text.slice(0, totalChars)
}

describe('splitTranscriptIntoChunks', () => {
  it('returns one chunk for short text', () => {
    const chunks = splitTranscriptIntoChunks('hello', 55_000, 4_000)
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toMatchObject({start: 0, end: 5, text: 'hello'})
  })

  it('covers 150k with overlap so marker offsets stay inside some chunk', () => {
    const text = buildScriptedConference(150_000)
    const chunks = splitTranscriptIntoChunks(text, PROTOCOL_CHUNK_SIZE, PROTOCOL_CHUNK_OVERLAP)
    expect(chunks.length).toBeGreaterThanOrEqual(3)
    const markers = ['[ACTION:A20]', '[ACTION:D55]', '[ACTION:B95]', '[ACTION:C140]']
    for (const marker of markers) {
      expect(chunks.some((chunk) => chunk.text.includes(marker))).toBe(true)
    }
    // Overlap: adjacent chunks share content near the boundary.
    expect(chunks[0].end - chunks[1].start).toBe(PROTOCOL_CHUNK_OVERLAP)
  })
})

describe('assertProtocolDraftInput', () => {
  it('no longer silently drops the useful tail at 80k', () => {
    const text = 'a'.repeat(90_000)
    const result = assertProtocolDraftInput({transcriptText: text})
    expect(result.truncated).toBe(false)
    expect(result.text.length).toBe(90_000)
  })
})

describe('composeProtocolSummary / notes', () => {
  it('puts detailed protocol above brief report', () => {
    expect(composeProtocolSummary('Деталі', 'Коротко')).toContain('## Детальний протокол')
  })

  it('appends processing notes', () => {
    expect(withProcessingNotes('body', ['note-1'])).toContain('## Примітки обробки')
    expect(withProcessingNotes('body', ['note-1'])).toContain('note-1')
  })
})

describe('normalizeProtocolResponse', () => {
  it('composes summary from detailedProtocol and briefReport', () => {
    const result = normalizeProtocolResponse({
      detailedProtocol: '## Рішення\n- A',
      briefReport: 'Узгодили A.',
      topics: ['A', ''],
      decisions: ['Рішення 1'],
      actionItems: ['Зробити X'],
    })
    expect(result.summary).toContain('Узгодили A.')
    expect(result.actionItems).toEqual(['Зробити X'])
  })

  it('accepts legacy summary field', () => {
    expect(normalizeProtocolResponse({summary: 'Короткий підсумок'}).summary).toBe(
      'Короткий підсумок',
    )
  })

  it('rejects missing protocol text', () => {
    expect(() => normalizeProtocolResponse({topics: []})).toThrow(/summary/i)
  })
})

describe('prompts', () => {
  it('single-pass prompt keeps accuracy + usefulness length rules', () => {
    const prompt = buildProtocolPrompt({transcriptText: 'hello', meetingTitle: 'Тест'}, 'hello')
    expect(prompt).toMatch(/usefulness/i)
    expect(prompt).toMatch(/3 Word pages|~3/)
    expect(prompt).toMatch(/нечітко в розшифровці/)
  })

  it('map/reduce prompts require preserving action items and skipping small talk', () => {
    const chunk = {index: 0, start: 0, end: 10, text: 'abc'}
    const mapPrompt = buildChunkMapPrompt({chunk, totalChunks: 3, meetingTitle: 'T'})
    expect(mapPrompt).toContain('Chunk 1 of 3')
    expect(mapPrompt).toMatch(/small talk/i)
    const reducePrompt = buildReducePrompt({
      meetingTitle: 'T',
      partials: [normalizeChunkPartial({actionItems: ['X']}, 0)],
    })
    expect(reducePrompt).toMatch(/PRESERVE every distinct/)
    expect(reducePrompt).toMatch(/USEFULNESS/)
  })
})

describe('draftProtocolFromTranscriptWithGemini simulation', () => {
  it('short Zoom demo stays single-pass without invented roadmap', async () => {
    const fetchImpl = createSimulatedGeminiFetch()
    const draft = await draftProtocolFromTranscriptWithGemini(
      {
        meetingTitle: 'Демо Zoom',
        transcriptText:
          'Ось кнопка запису внизу. Три точки в меню. Запис краще вмикати в налаштуваннях Zoom.',
      },
      {GEMINI_API_KEY: 'test'},
      fetchImpl as unknown as typeof fetch,
    )
    expect(draft.rawProviderData).toMatchObject({mode: 'single', chunks: 1})
    expect(draft.summary).toMatch(/Zoom|запис/i)
    expect(draft.summary).not.toMatch(/roadmap|етап.*платформ/i)
    expect(draft.actionItems).toEqual([])
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('150k scripted conference keeps A20 D55 B95 C140 via map/reduce', async () => {
    const fetchImpl = createSimulatedGeminiFetch()
    const transcript = buildScriptedConference(150_000)
    const draft = await draftProtocolFromTranscriptWithGemini(
      {meetingTitle: 'Довга нарада', transcriptText: transcript},
      {GEMINI_API_KEY: 'test'},
      fetchImpl as unknown as typeof fetch,
    )
    expect(draft.rawProviderData).toMatchObject({mode: 'map_reduce'})
    expect(Number((draft.rawProviderData as {chunks?: number}).chunks)).toBeGreaterThanOrEqual(3)
    expect(draft.summary).toContain('Примітки обробки')
    expect(draft.summary).toMatch(/фрагмент/i)
    const joined = draft.actionItems.join('\n')
    expect(joined).toContain('A20')
    expect(joined).toContain('D55')
    expect(joined).toContain('B95')
    expect(joined).toContain('C140')
    // map per chunk + one reduce
    expect(fetchImpl.mock.calls.length).toBeGreaterThanOrEqual(4)
  })

  it('old 80k truncate risk is avoided: marker at 95k still survives', async () => {
    const fetchImpl = createSimulatedGeminiFetch()
    const transcript = buildScriptedConference(100_000)
    const draft = await draftProtocolFromTranscriptWithGemini(
      {meetingTitle: 'Хвіст важливий', transcriptText: transcript},
      {GEMINI_API_KEY: 'test'},
      fetchImpl as unknown as typeof fetch,
    )
    expect(draft.actionItems.join('\n')).toContain('B95')
  })
})

describe('fallbackDraftFromTranscript', () => {
  it('puts transcript into detailed section without inventing decisions', () => {
    const draft = fallbackDraftFromTranscript('Текст зустрічі', 'Назва')
    expect(draft.sourceProvider).toBe('manual_transcript')
    expect(draft.decisions).toEqual([])
  })
})
