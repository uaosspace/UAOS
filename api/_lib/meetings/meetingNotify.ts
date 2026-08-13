import {
  isBrevoSenderConfigured,
  parseNotifyFrom,
  readBrevoSenderEnv,
  sendBrevoEmail,
} from '../brevoNotify.js'
import {mergeUniqueEmails} from './eventNotifyRecipients.js'
import {tryClaimNotification, type MeetingNotifyKind} from './notificationsRepo.js'
import {getMeetingOpsSettings} from './opsSettingsRepo.js'

function siteOrigin(env: NodeJS.ProcessEnv = process.env): string {
  const raw = (env.SITE_URL || env.VERCEL_URL || 'http://localhost:3000').trim()
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw.replace(/\/$/, '')
  return `https://${raw.replace(/\/$/, '')}`
}

export function buildEventPageUrl(slug: string, env: NodeJS.ProcessEnv = process.env): string {
  const safe = slug.trim().replace(/^\/+/, '')
  return `${siteOrigin(env)}/events/${encodeURIComponent(safe)}`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

async function sendToMany(
  recipients: string[],
  subject: string,
  textContent: string,
  htmlContent: string,
  tags: string[],
  env: NodeJS.ProcessEnv,
  fetchImpl: typeof fetch,
): Promise<{sent: number; failed: number; skipped: number}> {
  if (!isBrevoSenderConfigured(env)) {
    return {sent: 0, failed: 0, skipped: recipients.length}
  }
  const config = readBrevoSenderEnv(env)
  if (!config) return {sent: 0, failed: 0, skipped: recipients.length}
  const sender = parseNotifyFrom(config.fromRaw)
  if (!sender) return {sent: 0, failed: 0, skipped: recipients.length}

  let sent = 0
  let failed = 0
  for (const to of recipients) {
    const result = await sendBrevoEmail(
      {
        apiKey: config.apiKey,
        sender,
        to,
        subject,
        textContent,
        htmlContent,
        tags,
      },
      fetchImpl,
    )
    if (result === 'sent') sent += 1
    else failed += 1
  }
  return {sent, failed, skipped: 0}
}

export async function notifyMeetingAudience(input: {
  meetingId: string
  kind: MeetingNotifyKind
  emails: string[]
  title: string
  startAt: string
  eventSlug: string
  env?: NodeJS.ProcessEnv
  fetchImpl?: typeof fetch
}) {
  const env = input.env ?? process.env
  const fetchImpl = input.fetchImpl ?? fetch
  const emails = mergeUniqueEmails(input.emails)
  const eventUrl = buildEventPageUrl(input.eventSlug, env)
  const title = input.title || 'Подія UAOS'
  const subject =
    input.kind === 'reminder'
      ? `Нагадування: ${title} (завтра)`
      : `Онлайн-зустріч створена: ${title}`
  const textContent = [
    title,
    `Початок: ${input.startAt}`,
    `Сторінка події: ${eventUrl}`,
    '',
    'Посилання на відеозвʼязок доступне на сторінці події після входу.',
  ].join('\n')
  const htmlContent = `<div style="font-family:sans-serif;line-height:1.5">
<p><strong>${escapeHtml(title)}</strong></p>
<p>Початок: ${escapeHtml(input.startAt)}</p>
<p><a href="${escapeHtml(eventUrl)}">Відкрити сторінку події</a></p>
<p style="color:#475569;font-size:13px">Посилання на відеозвʼязок — на сторінці події після перевірки доступу.</p>
</div>`

  const claimed: string[] = []
  for (const email of emails) {
    if (await tryClaimNotification(input.meetingId, input.kind, email)) {
      claimed.push(email)
    }
  }
  if (!claimed.length) return {claimed: 0, sent: 0, failed: 0, skipped: 0}

  const result = await sendToMany(
    claimed,
    subject,
    textContent,
    htmlContent,
    input.kind === 'reminder' ? ['uaos-meeting-reminder'] : ['uaos-meeting-created'],
    env,
    fetchImpl,
  )
  return {claimed: claimed.length, ...result}
}

export async function notifyProtocolApproved(input: {
  title: string
  eventSlug: string
  summary: string
  transcriptPreview?: string
  recordingLinks?: string[]
  extraEmails?: string[]
  env?: NodeJS.ProcessEnv
  fetchImpl?: typeof fetch
}) {
  const env = input.env ?? process.env
  const fetchImpl = input.fetchImpl ?? fetch
  const settings = await getMeetingOpsSettings()
  const recipients = mergeUniqueEmails(settings.protocolNotifyEmails, input.extraEmails ?? [])
  if (!recipients.length) return {sent: 0, failed: 0, skipped: 0}

  const eventUrl = buildEventPageUrl(input.eventSlug, env)
  const subject = `Протокол затверджено: ${input.title || 'Подія UAOS'}`
  const links = (input.recordingLinks ?? []).filter(Boolean)
  const textContent = [
    subject,
    `Подія: ${eventUrl}`,
    '',
    'Підсумок:',
    input.summary || '—',
    '',
    input.transcriptPreview ? `Розшифровка (фрагмент):\n${input.transcriptPreview}` : '',
    links.length ? `Записи:\n${links.join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const linksHtml = links.length
    ? `<ul>${links.map((href) => `<li><a href="${escapeHtml(href)}">${escapeHtml(href)}</a></li>`).join('')}</ul>`
    : ''
  const htmlContent = `<div style="font-family:sans-serif;line-height:1.5">
<p><strong>${escapeHtml(subject)}</strong></p>
<p><a href="${escapeHtml(eventUrl)}">Сторінка події</a></p>
<p><strong>Підсумок</strong></p>
<pre style="white-space:pre-wrap">${escapeHtml(input.summary || '—')}</pre>
${
  input.transcriptPreview
    ? `<p><strong>Розшифровка (фрагмент)</strong></p><pre style="white-space:pre-wrap">${escapeHtml(input.transcriptPreview)}</pre>`
    : ''
}
${linksHtml ? `<p><strong>Записи</strong></p>${linksHtml}` : ''}
</div>`

  return sendToMany(recipients, subject, textContent, htmlContent, ['uaos-meeting-protocol'], env, fetchImpl)
}
