export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters: object) => [...eventKeys.lists(), filters] as const,
  detail: (slug: string) => [...eventKeys.all, 'detail', slug] as const,
  comments: (id: string) => [...eventKeys.all, 'comments', id] as const,
  likeStatus: (id: string) => [...eventKeys.all, 'likeStatus', id] as const,
}

export const ticketKeys = {
  all: ['tickets'] as const,
  list: () => [...ticketKeys.all, 'list'] as const,
  detail: (id: string) => [...ticketKeys.all, 'detail', id] as const,
}

export const profileKeys = {
  me: ['profile', 'me'] as const,
  organizer: (slug: string) => ['profile', 'organizer', slug] as const,
  following: ['profile', 'following'] as const,
  saved: ['profile', 'saved'] as const,
}

export const notificationKeys = {
  list: ['notifications'] as const,
}
