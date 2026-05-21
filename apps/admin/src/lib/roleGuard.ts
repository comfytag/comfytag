import type { AdminRole } from './roles'

export function hasRole(userRole: AdminRole, allowed: AdminRole[]): boolean {
  return allowed.includes(userRole)
}
