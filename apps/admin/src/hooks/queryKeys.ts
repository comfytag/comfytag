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
