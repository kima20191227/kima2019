import React from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/auth/AuthContext'
import { hasRole } from '@/utils/roleGuard'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

interface TabConfig {
  name: string
  title: string
  icon: IoniconsName
  iconFocused: IoniconsName
  requireRole?: 'MEMBER' | 'PREMIUM'
}

const TABS: TabConfig[] = [
  { name: 'home', title: '홈', icon: 'home-outline', iconFocused: 'home' },
  { name: 'map', title: '지도', icon: 'map-outline', iconFocused: 'map' },
  {
    name: 'community',
    title: '커뮤니티',
    icon: 'people-outline',
    iconFocused: 'people',
    requireRole: 'MEMBER',
  },
  {
    name: 'resources',
    title: '자료실',
    icon: 'folder-outline',
    iconFocused: 'folder',
    requireRole: 'PREMIUM',
  },
  { name: 'mypage', title: '마이', icon: 'person-outline', iconFocused: 'person' },
]

const PRIMARY = '#1B3A6B'
const GRAY = '#9CA3AF'

export default function TabLayout() {
  const { user, isAuthenticated } = useAuth()

  function isTabLocked(tab: TabConfig): boolean {
    if (!tab.requireRole) return false
    if (!isAuthenticated || !user) return true
    return !hasRole(user.role, tab.requireRole)
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: GRAY,
        tabBarStyle: { borderTopColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
        headerShown: false,
      }}
    >
      {TABS.map((tab) => {
        const locked = isTabLocked(tab)
        return (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ focused, color }) => (
                <Ionicons
                  name={focused ? tab.iconFocused : tab.icon}
                  size={24}
                  color={locked ? GRAY : color}
                />
              ),
            }}
          />
        )
      })}
      {/* index는 숨김 처리 — /(tabs)/ 기본 진입점만 역할 */}
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  )
}
