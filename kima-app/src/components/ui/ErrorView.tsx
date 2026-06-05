import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

interface ErrorViewProps {
  message?: string
  onRetry?: () => void
}

export function ErrorView({
  message = '데이터를 불러오지 못했습니다.',
  onRetry,
}: ErrorViewProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="text-3xl mb-3">⚠️</Text>
      <Text className="text-gray-700 font-semibold text-base text-center mb-1">
        오류가 발생했습니다
      </Text>
      <Text className="text-gray-500 text-sm text-center mb-6">{message}</Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className="bg-primary px-6 py-2.5 rounded-xl"
        >
          <Text className="text-white font-medium text-sm">다시 시도</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
