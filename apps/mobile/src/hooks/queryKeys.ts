// ─── Event ──────────────────────────────────────────────
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters: object) => [...eventKeys.lists(), filters] as const,
  detail: (slug: string) => [...eventKeys.all, 'detail', slug] as const,
  comments: (eventId: string) => [...eventKeys.all, 'comments', eventId] as const,
  related: (category: string) => [...eventKeys.all, 'related', category] as const,
  saved: ['events', 'saved'] as const,
  categories: ['categories'] as const,
  marquee: ['marquee'] as const,
}

// ─── Profile ────────────────────────────────────────────
export const profileKeys = {
  me: ['profile', 'me'] as const,
  user: (id: string) => ['profile', 'user', id] as const,
  organizer: (slug: string) => ['profile', 'organizer', slug] as const,
  following: ['profile', 'following'] as const,
  saved: ['profile', 'saved'] as const,
  hyped: ['profile', 'hype-link'] as const,
}

// ─── Ticket ─────────────────────────────────────────────
export const ticketKeys = {
  all: ['tickets'] as const,
  mine: ['tickets', 'mine'] as const,
  detail: (id: string) => ['tickets', 'detail', id] as const,
  ref: (reference: string) => ['tickets', 'ref', reference] as const,
}

// ─── Search ─────────────────────────────────────────────
export const searchKeys = {
  trending: ['search', 'trending'] as const,
  results: (q: string, filters?: object) => ['search', 'results', q, filters] as const,
}

// ─── Notification ───────────────────────────────────────
export const notificationKeys = {
  list: ['notifications'] as const,
}

// ─── Partner (Organizer) ────────────────────────────────
export const partnerKeys = {
  revenue: ['partner', 'revenue'] as const,
  analytics: ['partner', 'analytics'] as const,
  profile: ['partner', 'profile'] as const,
}

export const partnerEventKeys = {
  all: ['partner-events'] as const,
  list: () => [...partnerEventKeys.all, 'list'] as const,
  detail: (id: string) => [...partnerEventKeys.all, 'detail', id] as const,
  analytics: (id: string) => [...partnerEventKeys.all, 'analytics', id] as const,
  checkin: (id: string) => [...partnerEventKeys.all, 'checkin', id] as const,
  promos: (id: string) => [...partnerEventKeys.all, 'promos', id] as const,
  tiers: (id: string) => [...partnerEventKeys.all, 'tiers', id] as const,
  audience: (id: string) => [...partnerEventKeys.all, 'audience', id] as const,
}

// ─── Payouts ────────────────────────────────────────────
export const payoutKeys = {
  wallet: ['payouts', 'wallet'] as const,
  withdrawals: ['payouts', 'withdrawals'] as const,
  bank: ['payouts', 'bank'] as const,
}

// ─── Attendees (organizer view) ─────────────────────────
export const attendeeKeys = {
  list: (eventId: string) => ['attendees', eventId] as const,
}

// ─── KYC ────────────────────────────────────────────────
export const kycKeys = {
  status: ['kyc', 'status'] as const,
}
