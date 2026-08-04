export type AdminRole = 'admin' | 'editor' | 'applications'

export type AdminPermission =
  | 'applications.read'
  | 'applications.write'
  | 'applications.export'
  | 'content.read'
  | 'content.write'
  | 'media.upload'
  | 'media.private'
  | 'users.manage'
  | 'audit.read'
  | 'stats.read'

const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  admin: [
    'applications.read',
    'applications.write',
    'applications.export',
    'content.read',
    'content.write',
    'media.upload',
    'media.private',
    'users.manage',
    'audit.read',
    'stats.read',
  ],
  editor: ['content.read', 'content.write', 'media.upload', 'stats.read'],
  applications: [
    'applications.read',
    'applications.write',
    'applications.export',
    'stats.read',
    'audit.read',
  ],
}

/** Deny by default: missing permission means forbidden. */
export function roleHasPermission(role: AdminRole, permission: AdminPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) === true
}

export function roleRequiresMfa(role: AdminRole): boolean {
  return role === 'admin' || role === 'applications'
}
