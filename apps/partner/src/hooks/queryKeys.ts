export const partnerEventKeys = {
  all: ['partner-events'] as const,
  list: () => [...partnerEventKeys.all, 'list'] as const,
  detail: (id: string) => [...partnerEventKeys.all, 'detail', id] as const,
  analytics: (id: string) => [...partnerEventKeys.all, 'analytics', id] as const,
  checkin: (id: string) => [...partnerEventKeys.all, 'checkin', id] as const,
  promos: (id: string) => [...partnerEventKeys.all, 'promos', id] as const,
  tiers: (id: string) => [...partnerEventKeys.all, 'tiers', id] as const,
}

export const partnerKeys = {
  revenue: ['partner', 'revenue'] as const,
  analytics: ['partner', 'analytics'] as const,
  profile: ['partner', 'profile'] as const,
}

export const payoutKeys = {
  wallet: ['payouts', 'wallet'] as const,
  withdrawals: ['payouts', 'withdrawals'] as const,
  bank: ['payouts', 'bank'] as const,
}

export const attendeeKeys = {
  list: (eventId: string) => ['attendees', eventId] as const,
}

export const kycKeys = {
  status: ['kyc', 'status'] as const,
}
