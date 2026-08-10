/**
 * Best-effort Brevo transactional notify for new join applications.
 * Missing env → silent skip. Mail failure must not fail the join response.
 */

import {PARTICIPANT_TYPES, SECTORS} from '../../src/data/referenceLists.js'

export interface JoinNotifyPayload {
  applicationId: string
  companyName: string
  applicantKind: string
  sectors: string[]
  submittedAt: string
}

export interface BrevoNotifyEnv {
  apiKey: string
  to: string
  fromRaw: string
}

export interface ParsedEmailSender {
  name: string
  email: string
}

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'
const NOTIFY_TIMEOUT_MS = 8_000

const STATUS_LABELS_UK: Record<string, string> = {
  pending: 'Очікує розгляду',
  reviewed: 'Опрацьовано',
  accepted: 'Прийнято',
  rejected: 'Відхилено',
}

function readTrimmed(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

function labelFromList(
  items: Array<{id: string; label: {uk: string; en: string}}>,
  id: string,
): string {
  const found = items.find((item) => item.id === id)
  return found?.label.uk || id
}

export function formatApplicantKindUk(kind: string): string {
  const value = kind.trim()
  if (!value) return '—'
  return labelFromList(PARTICIPANT_TYPES, value)
}

export function formatSectorsUk(sectors: string[]): string {
  if (!sectors.length) return '—'
  return sectors.map((id) => labelFromList(SECTORS, id)).join(', ')
}

export function formatApplicationStatusUk(status = 'pending'): string {
  return STATUS_LABELS_UK[status] || status
}

/**
 * Reads Brevo notify env. All three values are required for configuration.
 */
export function readBrevoNotifyEnv(
  env: NodeJS.ProcessEnv = process.env,
): BrevoNotifyEnv | null {
  const apiKey = readTrimmed(env.BREVO_API_KEY)
  const to = readTrimmed(env.NOTIFY_EMAIL_TO)
  const fromRaw = readTrimmed(env.NOTIFY_EMAIL_FROM)
  if (!apiKey || !to || !fromRaw) return null
  return {apiKey, to, fromRaw}
}

export function isBrevoNotifyConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return readBrevoNotifyEnv(env) !== null
}

/**
 * Accepts `Name <email@domain>` or bare email.
 */
export function parseNotifyFrom(fromRaw: string): ParsedEmailSender | null {
  const trimmed = fromRaw.trim()
  if (!trimmed) return null

  const angled = trimmed.match(/^(.+?)\s*<([^>]+)>$/)
  if (angled) {
    const name = angled[1].trim().replace(/^["']|["']$/g, '')
    const email = angled[2].trim()
    if (!email.includes('@')) return null
    return {name: name || email, email}
  }

  if (!trimmed.includes('@') || /\s/.test(trimmed)) return null
  return {name: trimmed, email: trimmed}
}

export function formatApplicationTimeKyiv(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('uk-UA', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

/**
 * Builds a low-PII notify email (no contacts / message body).
 * Applicant kind and sectors are shown as Ukrainian labels from the join form lists.
 */
export function buildJoinNotifyEmail(payload: JoinNotifyPayload): {
  subject: string
  textContent: string
  htmlContent: string
} {
  const when = formatApplicationTimeKyiv(payload.submittedAt)
  const adminBase = (process.env.SITE_URL || process.env.APP_URL || '').replace(/\/$/, '')
  const adminLink = adminBase
    ? `${adminBase}/admin/applications/${payload.applicationId}`
    : '/admin'
  const kindLabel = formatApplicantKindUk(payload.applicantKind || '')
  const sectorsLabel = formatSectorsUk(payload.sectors || [])
  const statusLabel = formatApplicationStatusUk('pending')
  const subject = `UAOS: нова заявка — ${payload.companyName}`

  const lines = [
    'Нова заявка на вступ до UAOS',
    '',
    `Компанія: ${payload.companyName}`,
    `Тип заявника: ${kindLabel}`,
    `Галузі: ${sectorsLabel}`,
    `Подано: ${when} (час Києва)`,
    `Статус: ${statusLabel}`,
    '',
    `Відкрити в адмінці: ${adminLink}`,
    '',
    'Контакти заявника та повний текст доступні лише в захищеній адмінці.',
  ]

  const textContent = lines.join('\n')
  const htmlContent = `<div style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;line-height:1.5;color:#0f172a">
<p style="margin:0 0 12px"><strong>Нова заявка на вступ до UAOS</strong></p>
<p style="margin:0 0 6px"><strong>Компанія:</strong> ${escapeHtml(payload.companyName)}</p>
<p style="margin:0 0 6px"><strong>Тип заявника:</strong> ${escapeHtml(kindLabel)}</p>
<p style="margin:0 0 6px"><strong>Галузі:</strong> ${escapeHtml(sectorsLabel)}</p>
<p style="margin:0 0 6px"><strong>Подано:</strong> ${escapeHtml(when)} (час Києва)</p>
<p style="margin:0 0 12px"><strong>Статус:</strong> ${escapeHtml(statusLabel)}</p>
<p style="margin:0 0 12px"><a href="${escapeHtml(adminLink)}">Відкрити в адмінці</a></p>
<p style="margin:0;color:#475569;font-size:13px">Контакти заявника та повний текст доступні лише в захищеній адмінці.</p>
</div>`

  return {subject, textContent, htmlContent}
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export interface BrevoSenderEnv {
  apiKey: string
  fromRaw: string
}

/** Sender-only config (recovery emails go to the admin account, not NOTIFY_EMAIL_TO). */
export function readBrevoSenderEnv(env: NodeJS.ProcessEnv = process.env): BrevoSenderEnv | null {
  const apiKey = readTrimmed(env.BREVO_API_KEY)
  const fromRaw = readTrimmed(env.NOTIFY_EMAIL_FROM)
  if (!apiKey || !fromRaw) return null
  return {apiKey, fromRaw}
}

export function isBrevoSenderConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return readBrevoSenderEnv(env) !== null
}

export interface AdminRecoveryEmailPayload {
  tempPassword: string
  mfaCode: string | null
  mfaEnabled: boolean
  expiresMinutes: number
}

export function buildAdminRecoveryEmail(payload: AdminRecoveryEmailPayload): {
  subject: string
  textContent: string
  htmlContent: string
} {
  const subject = 'UAOS: відновлення доступу до адмін-панелі'
  const mfaLines =
    payload.mfaEnabled && payload.mfaCode
      ? [
          `Одноразовий код MFA: ${payload.mfaCode}`,
          `(дійсний ${payload.expiresMinutes} хв; після входу можна знову користуватися Authenticator)`,
          '',
        ]
      : ['MFA для цього облікового запису не увімкнено — поле коду можна залишити порожнім.', '']

  const lines = [
    'Відновлення доступу до адмін-панелі UAOS',
    '',
    'Поточний пароль у базі зберігається лише як хеш, тому надіслано новий тимчасовий пароль.',
    '',
    `Тимчасовий пароль: ${payload.tempPassword}`,
    '',
    ...mfaLines,
    'Після входу змініть пароль у вкладці «Обліковий запис».',
    'Якщо ви не запитували відновлення — негайно змініть пароль і зверніться до оператора.',
  ]

  const textContent = lines.join('\n')
  const mfaHtml =
    payload.mfaEnabled && payload.mfaCode
      ? `<p style="margin:0 0 6px"><strong>Одноразовий код MFA:</strong> <code>${escapeHtml(payload.mfaCode)}</code></p>
<p style="margin:0 0 12px;color:#475569;font-size:13px">Дійсний ${payload.expiresMinutes} хв. Після входу можна знову користуватися Authenticator.</p>`
      : `<p style="margin:0 0 12px;color:#475569;font-size:13px">MFA не увімкнено — поле коду можна залишити порожнім.</p>`

  const htmlContent = `<div style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;line-height:1.5;color:#0f172a">
<p style="margin:0 0 12px"><strong>Відновлення доступу до адмін-панелі UAOS</strong></p>
<p style="margin:0 0 12px">Поточний пароль у базі зберігається лише як хеш, тому надіслано новий тимчасовий пароль.</p>
<p style="margin:0 0 6px"><strong>Тимчасовий пароль:</strong> <code>${escapeHtml(payload.tempPassword)}</code></p>
${mfaHtml}
<p style="margin:0 0 12px">Після входу змініть пароль у вкладці «Обліковий запис».</p>
<p style="margin:0;color:#475569;font-size:13px">Якщо ви не запитували відновлення — негайно змініть пароль і зверніться до оператора.</p>
</div>`

  return {subject, textContent, htmlContent}
}

async function sendBrevoEmail(
  input: {
    apiKey: string
    sender: ParsedEmailSender
    to: string
    subject: string
    textContent: string
    htmlContent: string
    tags: string[]
  },
  fetchImpl: typeof fetch,
): Promise<'sent' | 'failed'> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), NOTIFY_TIMEOUT_MS)

  try {
    const response = await fetchImpl(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': input.apiKey,
      },
      body: JSON.stringify({
        sender: {name: input.sender.name, email: input.sender.email},
        to: [{email: input.to}],
        subject: input.subject,
        textContent: input.textContent,
        htmlContent: input.htmlContent,
        tags: input.tags,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error('Brevo send failed:', response.status, body.slice(0, 500))
      return 'failed'
    }

    return 'sent'
  } catch (err) {
    console.error('Brevo send error:', err)
    return 'failed'
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Sends transactional email via Brevo. No-op when env is incomplete.
 * Never throws to the caller — logs and returns.
 */
export async function notifyJoinApplicationByEmail(
  payload: JoinNotifyPayload,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<'sent' | 'skipped' | 'failed'> {
  const config = readBrevoNotifyEnv(env)
  if (!config) return 'skipped'

  const sender = parseNotifyFrom(config.fromRaw)
  if (!sender) {
    console.error('Brevo notify skipped: invalid NOTIFY_EMAIL_FROM')
    return 'failed'
  }

  const {subject, textContent, htmlContent} = buildJoinNotifyEmail(payload)
  return sendBrevoEmail(
    {
      apiKey: config.apiKey,
      sender,
      to: config.to,
      subject,
      textContent,
      htmlContent,
      tags: ['uaos-join-application'],
    },
    fetchImpl,
  )
}

/**
 * Emails temporary admin credentials to the account address.
 * Requires BREVO_API_KEY + NOTIFY_EMAIL_FROM (recipient is the admin email).
 */
export async function sendAdminRecoveryEmail(
  toEmail: string,
  payload: AdminRecoveryEmailPayload,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<'sent' | 'skipped' | 'failed'> {
  const config = readBrevoSenderEnv(env)
  if (!config) return 'skipped'

  const sender = parseNotifyFrom(config.fromRaw)
  if (!sender) {
    console.error('Brevo recovery skipped: invalid NOTIFY_EMAIL_FROM')
    return 'failed'
  }

  const to = toEmail.trim().toLowerCase()
  if (!to.includes('@')) return 'failed'

  const {subject, textContent, htmlContent} = buildAdminRecoveryEmail(payload)
  return sendBrevoEmail(
    {
      apiKey: config.apiKey,
      sender,
      to,
      subject,
      textContent,
      htmlContent,
      tags: ['uaos-admin-recovery'],
    },
    fetchImpl,
  )
}
