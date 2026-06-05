import React, { useEffect, useState } from 'react'
import { View, Text, Animated } from 'react-native'
import NetInfo from '@react-native-community/netinfo'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)
  const translateY = React.useRef(new Animated.Value(-40)).current

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !(state.isConnected && state.isInternetReachable !== false)
      setIsOffline(offline)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isOffline ? 0 : -40,
      duration: 250,
      useNativeDriver: true,
    }).start()
  }, [isOffline, translateY])

  return (
    <Animated.View
      style={{ transform: [{ translateY }] }}
      className="absolute top-0 left-0 right-0 z-50 bg-red-500 px-4 py-2 flex-row items-center justify-center"
      pointerEvents="none"
    >
      <Text className="text-white text-xs font-semibold">
        🚫 인터넷 연결 없음 — 일부 기능을 사용할 수 없습니다
      </Text>
    </Animated.View>
  )
}
