import {getApplicationById} from './applicationsRepo.js'
import {writeAuditEvent} from './audit.js'
import {
  createMemberUser,
  findMemberUserByEmail,
  type MemberUserRecord,
} from './auth/memberSession.js'
import {generateTempAdminPassword} from './auth/session.js'
import {isAssignableAccessLevel} from './meetings/accessCore.js'
import {getSql} from './db.js'
import {sendCabinetCredentialsEmail} from './brevoNotify.js'

export type ProvisionCabinetResult = {
  user: MemberUserRecord
  emailSent: 'sent' | 'skipped' | 'failed'
  temporaryPasswordIssued: boolean
}

export async function provisionCabinetFromApplication(input: {
  applicationId: string
  accessLevel: string
  displayName?: string
  actorId: string
  ip: string
}): Promise<ProvisionCabinetResult> {
  const application = await getApplicationById(input.applicationId)
  if (!application) throw new Error('Application not found')
  if (application.status !== 'accepted') {
    throw new Error('Cabinet access can only be provisioned for accepted applications')
  }

  const email = application.email.trim().toLowerCase()
  if (!email.includes('@')) throw new Error('Application email is invalid')

  const level = input.accessLevel.trim().toLowerCase()
  if (!isAssignableAccessLevel(level)) throw new Error('Invalid access level')

  const existing = await findMemberUserByEmail(email)
  if (existing) {
    throw new Error('Cabinet user with this email already exists')
  }

  const tempPassword = generateTempAdminPassword()
  const user = await createMemberUser({
    email,
    password: tempPassword,
    displayName: input.displayName?.trim() || application.contactPerson.trim(),
    accessLevel: level,
    applicationId: application.id,
    mustChangePassword: true,
  })

  const emailSent = await sendCabinetCredentialsEmail(email, {
    displayName: user.displayName || application.contactPerson,
    temporaryPassword: tempPassword,
  })

  await writeAuditEvent({
    actorType: 'admin',
    actorId: input.actorId,
    action: 'member_user.provision_from_application',
    entityType: 'member_user',
    entityId: user.id,
    ip: input.ip,
    metadata: {
      applicationId: application.id,
      accessLevel: level,
      emailSent,
    },
  })

  return {user, emailSent, temporaryPasswordIssued: true}
}

export async function getMemberUserIdByApplicationId(applicationId: string): Promise<string | null> {
  const sql = getSql()
  const rows = await sql`
    SELECT id FROM member_users WHERE application_id = ${applicationId}::uuid LIMIT 1
  `
  return rows[0] ? String((rows[0] as {id: string}).id) : null
}
