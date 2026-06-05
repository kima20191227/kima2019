import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

interface EmptyStateProps {
  emoji?: string
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  emoji = '📭',
  title = '내용이 없습니다',
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="text-4xl mb-3">{emoji}</Text>
      <Text className="text-gray-700 font-semibold text-base text-center mb-1">{title}</Text>
      {message && (
        <Text className="text-gray-500 text-sm text-center mb-6">{message}</Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} className="bg-primary px-6 py-2.5 rounded-xl">
          <Text className="text-white font-medium text-sm">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
