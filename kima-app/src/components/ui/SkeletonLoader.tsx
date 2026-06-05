import React, { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'

interface SkeletonBoxProps {
  className?: string
  width?: number | `${number}%`
  height?: number
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}

function SkeletonBox({ width, height = 16, rounded = 'md' }: SkeletonBoxProps) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [opacity])

  const borderRadius = { sm: 4, md: 8, lg: 12, full: 999 }[rounded]

  return (
    <Animated.View
      style={{
        width: width ?? '100%',
        height,
        borderRadius,
        backgroundColor: '#E5E7EB',
        opacity,
      }}
    />
  )
}

// ─── 카드 스켈레톤 ────────────────────────────────────────────────────────────

export function CardSkeleton() {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
      <SkeletonBox height={180} rounded="lg" />
      <View className="mt-3 gap-2">
        <SkeletonBox height={16} width="70%" />
        <SkeletonBox height={12} width="40%" />
      </View>
    </View>
  )
}

// ─── 목록 행 스켈레톤 ─────────────────────────────────────────────────────────

export function RowSkeleton() {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row gap-3">
      <SkeletonBox width={56} height={56} rounded="lg" />
      <View className="flex-1 gap-2 justify-center">
        <SkeletonBox height={14} width="80%" />
        <SkeletonBox height={12} width="50%" />
      </View>
    </View>
  )
}

// ─── 리스트 스켈레톤 (n개 반복) ───────────────────────────────────────────────

interface SkeletonListProps {
  count?: number
  variant?: 'card' | 'row'
}

export function SkeletonList({ count = 3, variant = 'card' }: SkeletonListProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) =>
        variant === 'card' ? <CardSkeleton key={i} /> : <RowSkeleton key={i} />
      )}
    </>
  )
}
