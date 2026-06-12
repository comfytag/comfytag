import axios, { type AxiosError } from 'axios'
import { getSession, signOut } from 'next-auth/react'

// Dedicated Axios instance for the /api/admin RBAC router (Phase 1 backend).
// Separate from the general `api` client so interceptor behaviour and base URL
// do not bleed into partner/public requests.
const adminApi = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'}/api/admin`,
  withCredentials: true,
})

// Cache the JWT to avoid a getSession() round-trip on every request.
// Cleared on auth failure so the next call re-fetches from the session.
let cachedAdminToken: string | null = null

adminApi.interceptors.request.use(async (config) => {
  if (!cachedAdminToken) {
    const session = await getSession()
    cachedAdminToken = session?.user?.token ?? null
  }
  if (cachedAdminToken) {
    config.headers.Authorization = `Bearer ${cachedAdminToken}`
  }
  return config
})

adminApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status

    if (status === 401 || status === 403) {
      // 401 — session expired; 403 — role was downgraded server-side.
      // Either way the admin session is no longer valid for this operation.
      cachedAdminToken = null

      if (typeof window !== 'undefined') {
        // Fire-and-forget: redirect happens via NextAuth; we still reject
        // the promise immediately so the calling hook can surface the error.
        signOut({ callbackUrl: '/login' }).catch(() => {
          window.location.href = '/login'
        })
      }
    }

    return Promise.reject(error)
  },
)

export default adminApi
