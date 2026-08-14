import {describe, expect, it} from 'vitest'
import {draftProtocolFromTranscriptWithGemini} from './geminiMeetingProtocol.js'

const live = Boolean(process.env.GEMINI_API_KEY?.trim()) && process.env.RUN_GEMINI_LIVE === '1'

describe.runIf(live)('live Gemini protocol smoke', () => {
  it(
    'short Zoom demo is not rewritten as a platform roadmap',
    async () => {
      const draft = await draftProtocolFromTranscriptWithGemini({
        meetingTitle: 'Демо Zoom UI',
        transcriptText:
          'Дивіться, кнопка запису внизу. Три точки в меню Zoom. Запис краще вмикати також у налаштуваннях. Я закінчую запис і трансляцію.',
      })
      expect(draft.rawProviderData).toMatchObject({mode: 'single'})
      expect(draft.summary).toMatch(/Zoom|запис|три точки/i)
      expect(draft.summary).not.toMatch(/roadmap|етапи розробки платформи|вартість етапу/i)
      expect(draft.actionItems.length).toBe(0)
    },
    300_000,
  )

  it(
    'map/reduce keeps head and tail action markers (compact live chunks)',
    async () => {
      process.env.UAOS_PROTOCOL_CHUNK_SIZE = '8000'
      process.env.UAOS_PROTOCOL_CHUNK_OVERLAP = '800'
      try {
        const unit = 'WAITING_SMALL_TALK '
        const mid = unit.repeat(Math.ceil(12_000 / unit.length)).slice(0, 12_000)
        const transcript =
          '[ACTION:HEAD] Підготувати демо-матеріали\n' +
          mid +
          '\n[ACTION:TAIL] Надіслати підсумок після зустрічі\n'
        const draft = await draftProtocolFromTranscriptWithGemini({
          meetingTitle: 'Довгий фрагмент',
          transcriptText: transcript,
        })
        expect(draft.rawProviderData).toMatchObject({mode: 'map_reduce'})
        const joined = draft.actionItems.join('\n') + '\n' + draft.summary
        expect(joined).toMatch(/HEAD|демо-матеріал/i)
        expect(joined).toMatch(/TAIL|підсумок/i)
        expect(draft.summary).toContain('Примітки обробки')
      } finally {
        delete process.env.UAOS_PROTOCOL_CHUNK_SIZE
        delete process.env.UAOS_PROTOCOL_CHUNK_OVERLAP
      }
    },
    300_000,
  )
})
