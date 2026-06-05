/**
 * AuthContext — 앱 전역 인증 상태 관리
 *
 * 아키텍처:
 *   Zustand 스토어(store/auth.ts)가 실제 상태를 보유하고,
 *   이 Context는 React 컴포넌트용 표준 인터페이스를 제공한다.
 *   API 클라이언트(api/client.ts)의 401 처리도 Zustand를 통해 이 Context와 동기화된다.
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { getAccessToken } from '@/utils/token'
import { api } from '@/api/client'
import type { User } from '@/types'

// ─── 공개 인터페이스 ──────────────────────────────────────────────────────────

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login(email: string, password: string): Promise<void>
  logout(): Promise<void>
  refreshProfile(): Promise<void>
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const isMounted = useRef(true)

  const storeUser = useAuthStore((s) => s.user)
  const storeIsLoading = useAuthStore((s) => s.isLoading)
  const { login, logout, refreshProfile } = useAuthStore()

  // 앱 시작 시: SecureStore 토큰 → 프로필 복원
  useEffect(() => {
    isMounted.current = true

    async function bootstrap() {
      try {
        const token = await getAccessToken()
        if (!token) return

        const profile = await api.get<User>('/api/mobile/profile')
        if (isMounted.current) {
          useAuthStore.setState({ user: profile, accessToken: token })
        }
      } catch {
        // 토큰 만료/무효 → Zustand 상태 초기화 (토큰 삭제는 인터셉터가 처리)
        if (isMounted.current) {
          useAuthStore.setState({ user: null, accessToken: null })
        }
      } finally {
        if (isMounted.current) setIsBootstrapping(false)
      }
    }

    bootstrap()
    return () => {
      isMounted.current = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const value: AuthContextType = {
    user: storeUser,
    isLoading: isBootstrapping || storeIsLoading,
    isAuthenticated: storeUser !== null,
    login,
    logout,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth()는 <AuthProvider> 내부에서만 사용할 수 있습니다.')
  }
  return ctx
}
