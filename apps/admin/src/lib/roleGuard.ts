import type { AdminRole } from './roles'

export function hasRole(userRole: AdminRole, allowed: AdminRole[]): boolean {
  if (userRole === 'super_admin') return true
  return allowed.includes(userRole)
}
