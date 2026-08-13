import {describe, expect, it} from 'vitest'
import {
  assertTranscriptUploadInput,
  detectTranscriptFormat,
  parseVttToPlainText,
} from './transcriptFile.js'

describe('parseVttToPlainText', () => {
  it('extracts cue text from Zoom-like VTT', () => {
    const raw = `WEBVTT


00:00:13.659 --> 00:00:16.659
Субтитры, включены.

00:00:24.753 --> 00:00:27.753
Что такое документы?
`
    expect(parseVttToPlainText(raw)).toBe('Субтитры, включены.\nЧто такое документы?')
  })

  it('skips NOTE blocks and cue numbers', () => {
    const raw = `WEBVTT

NOTE some meta

1
00:00:01.000 --> 00:00:02.000
Hello

2
00:00:03.000 --> 00:00:04.000
World
`
    expect(parseVttToPlainText(raw)).toBe('Hello\nWorld')
  })
})

describe('detectTranscriptFormat', () => {
  it('prefers extension then WEBVTT header', () => {
    expect(detectTranscriptFormat('a.vtt', 'plain')).toBe('vtt')
    expect(detectTranscriptFormat('a.txt', 'WEBVTT\n\nx')).toBe('vtt')
    expect(detectTranscriptFormat('a.txt', 'hello')).toBe('txt')
  })
})

describe('assertTranscriptUploadInput', () => {
  it('accepts base64 VTT and returns plain text', () => {
    const raw = 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nПривіт\n'
    const parsed = assertTranscriptUploadInput({
      fileName: 'meeting.vtt',
      dataBase64: Buffer.from(raw, 'utf8').toString('base64'),
    })
    expect(parsed.format).toBe('vtt')
    expect(parsed.contentText).toBe('Привіт')
  })

  it('rejects path traversal and empty content', () => {
    expect(() =>
      assertTranscriptUploadInput({
        fileName: '../secret.vtt',
        dataBase64: Buffer.from('WEBVTT\n\nx', 'utf8').toString('base64'),
      }),
    ).toThrow(/Invalid fileName/)
    expect(() =>
      assertTranscriptUploadInput({
        fileName: 'empty.vtt',
        dataBase64: Buffer.from('WEBVTT\n\n', 'utf8').toString('base64'),
      }),
    ).toThrow(/empty/i)
  })
})
