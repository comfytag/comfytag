export const ADMIN_ROLES = {
  SUPER_ADMIN:   'super_admin',
  FINANCE:       'finance',
  KYC_REVIEWER:  'kyc_reviewer',
  SUPPORT:       'support',
  MODERATOR:     'moderator',
} as const

export type AdminRole = typeof ADMIN_ROLES[keyof typeof ADMIN_ROLES]
