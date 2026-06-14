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

export const adminAnalyticsKeys = {
  all: ['api-admin-analytics'] as const,
  overview: () => [...adminAnalyticsKeys.all, 'overview'] as const,
  users:    () => [...adminAnalyticsKeys.all, 'users']    as const,
  revenue:  () => [...adminAnalyticsKeys.all, 'revenue']  as const,
}

export const siteConfigKeys = {
  all: ['cms-site-config'] as const,
  detail: () => [...siteConfigKeys.all, 'detail'] as const,
}

export const marqueeKeys = {
  all: ['cms-marquee'] as const,
  list: () => [...marqueeKeys.all, 'list'] as const,
}

export const promoBannerKeys = {
  all: ['cms-banners'] as const,
  list: () => [...promoBannerKeys.all, 'list'] as const,
}

export const howItWorksKeys = {
  all: ['cms-how-it-works'] as const,
  list: () => [...howItWorksKeys.all, 'list'] as const,
}

export const curatedSectionKeys = {
  all: ['cms-curated'] as const,
  detail: (key: string) => [...curatedSectionKeys.all, 'detail', key] as const,
}

export const faqKeys = {
  all: ['cms-faqs'] as const,
  list: () => [...faqKeys.all, 'list'] as const,
}

export const legalKeys = {
  all: ['cms-legal'] as const,
  detail: (docType: string) => [...legalKeys.all, 'detail', docType] as const,
}

export const pageContentKeys = {
  all: ['cms-pages'] as const,
  detail: (key: string) => [...pageContentKeys.all, 'detail', key] as const,
}
