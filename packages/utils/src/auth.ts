// ─── Auth header ──────────────────────────────────────
export function authHeader(
  token: string | undefined | null,
): { headers: { Authorization: string } } | Record<string, never> {
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
}

// ─── JWT helpers ──────────────────────────────────────
export function decodeJwtPayload<T>(token: string): T {
  const payload = token.split('.')[1]
  return JSON.parse(atob(payload)) as T
}

export function decodeUserId(token: string): string {
  try {
    const p = decodeJwtPayload<Record<string, unknown>>(token)
    const id = p['_id'] ?? p['id'] ?? p['sub']
    return typeof id === 'string' ? id : ''
  } catch {
    return ''
  }
}
