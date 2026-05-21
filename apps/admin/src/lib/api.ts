import axios from 'axios'
import { getSession } from 'next-auth/react'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002',
  withCredentials: true,
})

api.interceptors.request.use(async (config) => {
  const session = await getSession()
  if (session?.user?.token) {
    config.headers.Authorization = `Bearer ${session.user.token}`
  }
  return config
})

export default api

export function authHeader(token: string | undefined | null) {
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
}
