import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { STORAGE_KEYS } from '@comfytag/utils'

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
})

// Request interceptor: attach auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
    } catch (e) {
      console.error('Failed to read auth token:', e)
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor: normalize errors
api.interceptors.response.use(
  (res) => res,
  (error: unknown) => {
    if (
      error !== null &&
      typeof error === 'object' &&
      'response' in error &&
      (error as { response?: { data?: { message?: string } } }).response?.data?.message
    ) {
      ;(error as unknown as { message: string }).message = (
        error as { response: { data: { message: string } } }
      ).response.data.message
    }
    return Promise.reject(error)
  },
)

// Typed convenience methods
export const get = <T,>(url: string, config?: Parameters<typeof api.get>[1]) =>
  api.get<T>(url, config)

export const post = <T,>(
  url: string,
  data?: unknown,
  config?: Parameters<typeof api.post>[2],
) => api.post<T>(url, data, config)

export const put = <T,>(
  url: string,
  data?: unknown,
  config?: Parameters<typeof api.put>[2],
) => api.put<T>(url, data, config)

export const del = <T,>(url: string, config?: Parameters<typeof api.delete>[1]) =>
  api.delete<T>(url, config)

export default api
