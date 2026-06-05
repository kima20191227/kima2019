import React, { createContext, useContext, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth'
import { getAccessToken } from '@/utils/token'
import { api } from '@/api/client'
import type { User } from '@/types'

interface AuthContextValue {
  isBootstrapping: boolean
}

const AuthContext = createContext<AuthContextValue>({ isBootstrapping: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isBootstrapping, setIsBootstrapping] = React.useState(true)
  const { setAuth, logout } = useAuthStore()
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    async function bootstrap() {
      try {
        const token = await getAccessToken()
        if (token) {
          // 앱 재시작 시 저장된 토큰으로 프로필 복원
          const profile = await api.get<User>('/api/mobile/profile')
          if (isMounted.current) {
            // setAuth 대신 store를 직접 업데이트 (refresh token은 이미 저장됨)
            useAuthStore.setState({ user: profile, accessToken: token })
          }
        }
      } catch {
        // 토큰 만료/무효 → 자동 로그아웃
        await logout()
      } finally {
        if (isMounted.current) setIsBootstrapping(false)
      }
    }
    bootstrap()
    return () => { isMounted.current = false }
  }, [logout])

  return (
    <AuthContext.Provider value={{ isBootstrapping }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useBootstrap() {
  return useContext(AuthContext)
}
