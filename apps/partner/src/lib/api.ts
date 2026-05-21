import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002',
  withCredentials: true,
})

export default api

export function authHeader(token: string | undefined | null) {
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
}
