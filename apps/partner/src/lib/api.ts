import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002',
  withCredentials: true,
})

let _interceptorId: number | null = null
let _loggingOut = false

export function setApiToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

export function setupInterceptors(onUnauthorized: () => void) {
  if (_interceptorId !== null) return

  _interceptorId = api.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      const axiosError = error as {
        response?: { status?: number }
        config?: { headers?: Record<string, string> }
      }
      const is401 = axiosError?.response?.status === 401
      const hadAuthHeader = !!axiosError?.config?.headers?.['Authorization']

      if (is401 && hadAuthHeader && !_loggingOut) {
        _loggingOut = true
        onUnauthorized()
      }

      return Promise.reject(error)
    }
  )
}
