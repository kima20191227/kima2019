import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { getAccessToken, getRefreshToken, saveTokens, removeTokens } from '@/utils/token'
import type { LoginResponse } from '@/types'
import { router } from 'expo-router'

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── 요청 인터셉터: JWT 자동 첨부 ────────────────────────────────────────────

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── 응답 인터셉터: 네트워크 오류 재시도 + 401 토큰 갱신 ────────────────────────

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

function processQueue(newToken: string) {
  refreshQueue.forEach((resolve) => resolve(newToken))
  refreshQueue = []
}

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
  _retryCount?: number
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig
    const url = config?.url ?? ''

    // ── 재시도: 네트워크 오류 or 5xx (로그인·갱신 엔드포인트 제외) ──────────────
    const isNetworkError = !error.response
    const isServerError  = (error.response?.status ?? 0) >= 500
    const isAuthEndpoint =
      url.includes('/api/mobile/login') || url.includes('/api/mobile/refresh')

    if ((isNetworkError || isServerError) && !isAuthEndpoint && !config._retry) {
      config._retryCount = (config._retryCount ?? 0) + 1
      if (config._retryCount <= 3) {
        // 지수 백오프: 1s → 2s → 4s
        const delayMs = Math.min(1000 * Math.pow(2, config._retryCount - 1), 8_000)
        await new Promise((r) => setTimeout(r, delayMs))
        return apiClient(config)
      }
    }

    // ── 401: 토큰 갱신 후 재시도 ─────────────────────────────────────────────
    if (error.response?.status !== 401 || config._retry) {
      return Promise.reject(error)
    }

    if (isAuthEndpoint) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve) => {
        refreshQueue.push(resolve)
      }).then((newToken) => {
        config.headers.Authorization = `Bearer ${newToken}`
        return apiClient(config)
      })
    }

    config._retry = true
    isRefreshing = true

    try {
      const refreshToken = await getRefreshToken()
      if (!refreshToken) throw new Error('no_refresh_token')

      const { data } = await apiClient.post<LoginResponse>('/api/mobile/refresh', {
        refreshToken,
      })

      await saveTokens(data.accessToken, data.refreshToken)
      processQueue(data.accessToken)

      config.headers.Authorization = `Bearer ${data.accessToken}`
      return apiClient(config)
    } catch {
      await removeTokens()
      const { useAuthStore } = await import('@/store/auth')
      useAuthStore.setState({ user: null, accessToken: null })
      router.replace('/auth/login')
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)

// ─── 편의 함수 ────────────────────────────────────────────────────────────────

export const api = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    apiClient.get<T>(url, { params }).then((r) => r.data),

  post: <T>(url: string, data?: unknown) =>
    apiClient.post<T>(url, data).then((r) => r.data),

  patch: <T>(url: string, data?: unknown) =>
    apiClient.patch<T>(url, data).then((r) => r.data),

  delete: <T>(url: string) =>
    apiClient.delete<T>(url).then((r) => r.data),
}
