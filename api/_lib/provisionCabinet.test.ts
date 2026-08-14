import {beforeEach, describe, expect, it, vi} from 'vitest'

const getApplicationById = vi.fn()
const findMemberUserByEmail = vi.fn()
const createMemberUser = vi.fn()
const sendCabinetCredentialsEmail = vi.fn()
const writeAuditEvent = vi.fn()

vi.mock('./applicationsRepo.js', () => ({
  getApplicationById,
}))

vi.mock('./auth/memberSession.js', () => ({
  createMemberUser,
  findMemberUserByEmail,
}))

vi.mock('./brevoNotify.js', () => ({
  sendCabinetCredentialsEmail,
}))

vi.mock('./audit.js', () => ({
  writeAuditEvent,
}))

vi.mock('./auth/session.js', () => ({
  generateTempAdminPassword: () => 'TempPass1234567!',
}))

describe('provisionCabinetFromApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates member user and sends credentials for accepted application', async () => {
    getApplicationById.mockResolvedValue({
      id: 'app-1',
      status: 'accepted',
      email: 'member@example.com',
      contactPerson: 'Jane Doe',
    })
    findMemberUserByEmail.mockResolvedValue(null)
    createMemberUser.mockResolvedValue({
      id: 'user-1',
      email: 'member@example.com',
      displayName: 'Jane Doe',
      memberId: null,
      active: true,
      accessLevel: 'member',
      mustChangePassword: true,
      roles: ['member'],
    })
    sendCabinetCredentialsEmail.mockResolvedValue('sent')

    const {provisionCabinetFromApplication} = await import('./provisionCabinet.js')
    const result = await provisionCabinetFromApplication({
      applicationId: 'app-1',
      accessLevel: 'member',
      displayName: 'Jane Doe',
      actorId: 'admin-1',
      ip: '127.0.0.1',
    })

    expect(createMemberUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'member@example.com',
        applicationId: 'app-1',
        mustChangePassword: true,
        accessLevel: 'member',
      }),
    )
    expect(sendCabinetCredentialsEmail).toHaveBeenCalled()
    expect(result.emailSent).toBe('sent')
    expect(writeAuditEvent).toHaveBeenCalled()
  })

  it('rejects non-accepted applications', async () => {
    getApplicationById.mockResolvedValue({
      id: 'app-1',
      status: 'pending',
      email: 'member@example.com',
      contactPerson: 'Jane Doe',
    })

    const {provisionCabinetFromApplication} = await import('./provisionCabinet.js')
    await expect(
      provisionCabinetFromApplication({
        applicationId: 'app-1',
        accessLevel: 'member',
        actorId: 'admin-1',
        ip: '127.0.0.1',
      }),
    ).rejects.toThrow(/accepted/)
  })

  it('rejects duplicate cabinet email', async () => {
    getApplicationById.mockResolvedValue({
      id: 'app-1',
      status: 'accepted',
      email: 'member@example.com',
      contactPerson: 'Jane Doe',
    })
    findMemberUserByEmail.mockResolvedValue({id: 'existing'})

    const {provisionCabinetFromApplication} = await import('./provisionCabinet.js')
    await expect(
      provisionCabinetFromApplication({
        applicationId: 'app-1',
        accessLevel: 'member',
        actorId: 'admin-1',
        ip: '127.0.0.1',
      }),
    ).rejects.toThrow(/already exists/)
  })
})
