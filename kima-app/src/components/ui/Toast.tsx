import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'

// ─── 타입 ─────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info'

interface ToastEntry {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast는 ToastProvider 내부에서 사용해야 합니다')
  return ctx
}

// ─── 개별 Toast 아이템 ────────────────────────────────────────────────────────

const BG: Record<ToastType, string> = {
  success: '#16a34a',
  error:   '#dc2626',
  info:    '#1B3A6B',
}

const EMOJI: Record<ToastType, string> = {
  success: '✓ ',
  error:   '✕ ',
  info:    'ℹ ',
}

function ToastItem({ entry }: { entry: ToastEntry }) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(16)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,     { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY,  { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start()

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 16, duration: 300, useNativeDriver: true }),
      ]).start()
    }, 2700)

    return () => clearTimeout(timer)
  }, [opacity, translateY])

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: BG[entry.type], opacity, transform: [{ translateY }] },
      ]}
    >
      <Text style={styles.text}>
        {EMOJI[entry.type]}{entry.message}
      </Text>
    </Animated.View>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  const counterRef = useRef(0)

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = String(++counterRef.current)
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]) // 최대 3개 표시

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {toasts.map((entry) => (
          <ToastItem key={entry.id} entry={entry} />
        ))}
      </View>
    </ToastContext.Provider>
  )
}

// ─── 스타일 ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 96,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
})
