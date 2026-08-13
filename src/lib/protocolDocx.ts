import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'

export type ProtocolDocxInput = {
  title: string
  status: string
  /** Protocol body (detailed + brief), may contain markdown-ish headings. */
  body: string
  decisions: unknown[]
  actionItems: unknown[]
  transcriptText?: string
  recordingLines?: string[]
  labels?: {
    status?: string
    decisions?: string
    actionItems?: string
    transcript?: string
    recordings?: string
  }
}

function asLines(items: unknown[]): string[] {
  return items
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      if (item && typeof item === 'object') return JSON.stringify(item)
      return String(item)
    })
    .filter(Boolean)
}

/** Convert markdown-ish protocol text into docx paragraphs (exported for unit tests). */
export function markdownishToParagraphs(text: string): Paragraph[] {
  const out: Paragraph[] = []
  const lines = text.replace(/\r\n/g, '\n').split('\n')

  for (const raw of lines) {
    const line = raw.trimEnd()
    const trimmed = line.trim()
    if (!trimmed) {
      out.push(new Paragraph({children: []}))
      continue
    }
    if (trimmed.startsWith('### ')) {
      out.push(
        new Paragraph({
          text: trimmed.slice(4),
          heading: HeadingLevel.HEADING_3,
        }),
      )
      continue
    }
    if (trimmed.startsWith('## ')) {
      out.push(
        new Paragraph({
          text: trimmed.slice(3),
          heading: HeadingLevel.HEADING_2,
        }),
      )
      continue
    }
    if (trimmed.startsWith('# ')) {
      out.push(
        new Paragraph({
          text: trimmed.slice(2),
          heading: HeadingLevel.HEADING_1,
        }),
      )
      continue
    }
    if (/^[-*]\s+/.test(trimmed)) {
      out.push(
        new Paragraph({
          text: trimmed.replace(/^[-*]\s+/, ''),
          bullet: {level: 0},
        }),
      )
      continue
    }
    out.push(
      new Paragraph({
        children: [new TextRun(trimmed)],
      }),
    )
  }
  return out
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
  })
}

export function buildProtocolDocument(input: ProtocolDocxInput): Document {
  const labels = {
    status: input.labels?.status ?? 'Статус',
    decisions: input.labels?.decisions ?? 'Рішення',
    actionItems: input.labels?.actionItems ?? 'Поручення',
    transcript: input.labels?.transcript ?? 'Розшифровка',
    recordings: input.labels?.recordings ?? 'Записи',
  }

  const children: Paragraph[] = [
    new Paragraph({
      text: input.title,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [
        new TextRun({text: `${labels.status}: `, bold: true}),
        new TextRun(input.status),
      ],
    }),
    new Paragraph({children: []}),
    ...markdownishToParagraphs(input.body),
  ]

  const decisions = asLines(input.decisions)
  if (decisions.length) {
    children.push(new Paragraph({children: []}))
    children.push(sectionHeading(labels.decisions))
    for (const item of decisions) {
      children.push(new Paragraph({text: item, bullet: {level: 0}}))
    }
  }

  const actionItems = asLines(input.actionItems)
  if (actionItems.length) {
    children.push(new Paragraph({children: []}))
    children.push(sectionHeading(labels.actionItems))
    for (const item of actionItems) {
      children.push(new Paragraph({text: item, bullet: {level: 0}}))
    }
  }

  const transcript = input.transcriptText?.trim()
  if (transcript) {
    children.push(new Paragraph({children: []}))
    children.push(sectionHeading(labels.transcript))
    for (const line of transcript.slice(0, 50000).split(/\n/)) {
      const trimmed = line.trim()
      if (!trimmed) {
        children.push(new Paragraph({children: []}))
        continue
      }
      children.push(new Paragraph({children: [new TextRun(trimmed)]}))
    }
  }

  const recordings = (input.recordingLines ?? []).map((line) => line.trim()).filter(Boolean)
  if (recordings.length) {
    children.push(new Paragraph({children: []}))
    children.push(sectionHeading(labels.recordings))
    for (const line of recordings) {
      children.push(new Paragraph({text: line, bullet: {level: 0}}))
    }
  }

  return new Document({
    sections: [{children}],
  })
}

export async function buildProtocolDocxBlob(input: ProtocolDocxInput): Promise<Blob> {
  return Packer.toBlob(buildProtocolDocument(input))
}
