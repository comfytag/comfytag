export const adminUserKeys = {
  all: ['admin-users'] as const,
  list: () => [...adminUserKeys.all, 'list'] as const,
  detail: (id: string) => [...adminUserKeys.all, 'detail', id] as const,
}

export const adminEventKeys = {
  all: ['admin-events'] as const,
  list: () => [...adminEventKeys.all, 'list'] as const,
}

export const adminPayoutKeys = {
  all: ['admin-payouts'] as const,
  list: () => [...adminPayoutKeys.all, 'list'] as const,
  detail: (id: string) => [...adminPayoutKeys.all, 'detail', id] as const,
}

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
}

// Keys for the Phase 1 RBAC endpoints at /api/admin/*
export const adminRbacEventKeys = {
  all: ['api-admin-events'] as const,
  list: (params?: Record<string, unknown>) => [...adminRbacEventKeys.all, 'list', params] as const,
  detail: (id: string) => [...adminRbacEventKeys.all, 'detail', id] as const,
}

export const adminRbacPayoutKeys = {
  all: ['api-admin-payouts'] as const,
  list: (params?: Record<string, unknown>) => [...adminRbacPayoutKeys.all, 'list', params] as const,
  detail: (id: string) => [...adminRbacPayoutKeys.all, 'detail', id] as const,
}

export const kycKeys = {
  all: ['api-admin-kyc'] as const,
  queue: () => [...kycKeys.all, 'queue'] as const,
  detail: (userId: string) => [...kycKeys.all, 'detail', userId] as const,
}

export const adminRbacUserKeys = {
  all: ['api-admin-users'] as const,
  list: (params?: Record<string, unknown>) => [...adminRbacUserKeys.all, 'list', params] as const,
  detail: (id: string) => [...adminRbacUserKeys.all, 'detail', id] as const,
}
