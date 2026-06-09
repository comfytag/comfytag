import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002',
  withCredentials: true,
})

export function setApiToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

const AUTH_SIGNOUT_MESSAGES = ['You are not authenticated!', 'Token not valid!']

export function setupInterceptors(onUnauthorized: () => void): () => void {
  const id = api.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const res = (error as { response?: { status?: number; data?: { message?: string } } }).response
        const is401 = res?.status === 401
        const isAuthMessage = AUTH_SIGNOUT_MESSAGES.includes(res?.data?.message ?? '')
        if (is401 && isAuthMessage) {
          onUnauthorized()
        }
      }
      return Promise.reject(error)
    }
  )
  return () => api.interceptors.response.eject(id)
}
