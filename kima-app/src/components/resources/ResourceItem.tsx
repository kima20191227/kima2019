import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import type { AccessLevel, Resource } from '@/types'

// ─── 파일 타입 배지 스타일 ────────────────────────────────────────────────────

interface BadgeStyle {
  bg: string
  text: string
  icon: string
}

const FILE_TYPE_STYLE: Record<string, BadgeStyle> = {
  PDF: { bg: '#FEE2E2', text: '#B91C1C', icon: '📄' },
  PPT: { bg: '#FFEDD5', text: '#C2410C', icon: '📊' },
  DOC: { bg: '#DBEAFE', text: '#1D4ED8', icon: '📝' },
  XLS: { bg: '#DCFCE7', text: '#15803D', icon: '📈' },
  ETC: { bg: '#F3F4F6', text: '#6B7280', icon: '📁' },
}

// ─── 접근 등급 배지 스타일 ────────────────────────────────────────────────────

const ACCESS_STYLE: Record<AccessLevel, { bg: string; text: string; label: string }> = {
  PUBLIC:  { bg: '#F3F4F6', text: '#6B7280', label: '공개' },
  MEMBER:  { bg: '#DBEAFE', text: '#1D4ED8', label: '회원' },
  PREMIUM: { bg: '#FEF9C3', text: '#92400E', label: '정회원' },
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ResourceItemProps {
  resource: Resource
  /** 현재 사용자가 이 자료에 접근 가능한지 여부 (UX용) */
  canAccess: boolean
  onPress: (resource: Resource) => void
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export function ResourceItem({ resource, canAccess, onPress }: ResourceItemProps) {
  const fileStyle =
    FILE_TYPE_STYLE[resource.fileType ?? 'ETC'] ?? FILE_TYPE_STYLE.ETC
  const accessStyle = ACCESS_STYLE[resource.accessLevel]

  return (
    <TouchableOpacity
      onPress={() => onPress(resource)}
      disabled={!canAccess}
      activeOpacity={canAccess ? 0.7 : 1}
      className="bg-white rounded-2xl shadow-sm mb-3 overflow-hidden"
    >
      {/* 접근 불가 오버레이 스트라이프 */}
      {!canAccess && (
        <View className="absolute top-0 right-0 left-0 bottom-0 bg-gray-50/60 z-10 items-end justify-start p-3">
          <View className="flex-row items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
            <Text className="text-xs">🔑</Text>
            <Text className="text-yellow-700 text-xs font-semibold">정회원 전용</Text>
          </View>
        </View>
      )}

      <View className="flex-row items-start p-4 gap-3">
        {/* 파일 타입 아이콘 박스 */}
        <View
          className="w-12 h-12 rounded-xl items-center justify-center"
          style={{ backgroundColor: fileStyle.bg }}
        >
          <Text className="text-xl">{fileStyle.icon}</Text>
          {resource.fileType && (
            <Text
              className="text-xs font-bold leading-none mt-0.5"
              style={{ color: fileStyle.text }}
            >
              {resource.fileType}
            </Text>
          )}
        </View>

        {/* 본문 */}
        <View className="flex-1">
          <Text
            className={`font-semibold text-sm leading-snug ${
              canAccess ? 'text-gray-900' : 'text-gray-400'
            }`}
            numberOfLines={2}
          >
            {resource.title}
          </Text>

          {resource.description && (
            <Text className="text-gray-400 text-xs mt-1 leading-relaxed" numberOfLines={2}>
              {resource.description}
            </Text>
          )}

          {/* 배지 행 */}
          <View className="flex-row items-center gap-2 mt-2 flex-wrap">
            {/* 접근 등급 배지 */}
            <View
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: accessStyle.bg }}
            >
              <Text className="text-xs font-medium" style={{ color: accessStyle.text }}>
                {accessStyle.label}
              </Text>
            </View>

            {/* 카테고리 */}
            {resource.category?.name && (
              <View className="px-2 py-0.5 bg-gray-100 rounded-full">
                <Text className="text-gray-500 text-xs">{resource.category.name}</Text>
              </View>
            )}

            {/* 등록일 */}
            <Text className="text-gray-300 text-xs ml-auto">
              {new Date(resource.createdAt).toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* 우측 화살표 / 자물쇠 */}
        <View className="mt-1">
          {canAccess ? (
            <Text className="text-primary text-base">›</Text>
          ) : (
            <Text className="text-gray-300 text-base">🔒</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}
