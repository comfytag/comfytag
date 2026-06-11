import axios, { type AxiosError } from 'axios'
import { getSession } from 'next-auth/react'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002',
  withCredentials: true,
})

// AD-1: Cache the JWT so getSession() (a network round-trip to /api/auth/session)
// only fires once per session lifetime, not on every Axios request.
// Cleared on 401 so an expired token forces a fresh session fetch.
let cachedToken: string | null = null

api.interceptors.request.use(async (config) => {
  if (!cachedToken) {
    const session = await getSession()
    cachedToken = session?.user?.token ?? null
  }
  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      cachedToken = null
    }
    return Promise.reject(error)
  },
)

export default api

export function authHeader(token: string | undefined | null) {
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
}
