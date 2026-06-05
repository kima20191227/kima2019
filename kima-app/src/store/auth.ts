import { create } from 'zustand'
import type { User, UserRole } from '@/types'
import { isActivePremium, hasRole } from '@/types'
import { saveTokens, removeTokens } from '@/utils/token'
import { api } from '@/api/client'
import type { LoginResponse } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean

  // 액션
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>
  refreshProfile: () => Promise<void>

  // 파생 값
  isLoggedIn: () => boolean
  hasRole: (required: UserRole) => boolean
  isPremium: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: false,

  setAuth: async (user, accessToken, refreshToken) => {
    await saveTokens(accessToken, refreshToken)
    set({ user, accessToken })
  },

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const data = await api.post<LoginResponse>('/api/mobile/login', { email, password })
      await saveTokens(data.accessToken, data.refreshToken)
      // 전체 프로필 조회
      const profile = await api.get<User>('/api/mobile/profile')
      set({ user: profile, accessToken: data.accessToken })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    await removeTokens()
    set({ user: null, accessToken: null })
  },

  refreshProfile: async () => {
    try {
      const profile = await api.get<User>('/api/mobile/profile')
      set({ user: profile })
    } catch {
      // 토큰 만료 등 실패 시 무시 (인터셉터에서 이미 처리)
    }
  },

  isLoggedIn: () => get().user !== null,

  hasRole: (required) => {
    const user = get().user
    if (!user) return false
    return hasRole(user.role, required)
  },

  isPremium: () => {
    const user = get().user
    if (!user) return false
    return isActivePremium(user)
  },
}))
