import React from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { router } from 'expo-router'

const BENEFITS = [
  { emoji: '📁', title: '자료실 전체 이용', desc: '비자·법률·의료·선교 정회원 전용 자료' },
  { emoji: '🌐', title: '리스닝콜 참여', desc: '분기별 전국 사역자 온라인 연합 모임' },
  { emoji: '🤝', title: '사역자 네트워크', desc: '담당 위원장과 직접 연결 · QR 연락처 공개' },
  { emoji: '📊', title: '이주민 현황 데이터', desc: '지역·언어권별 통계 및 연간 백서 열람' },
]

interface PremiumGateProps {
  /** 화면 전체를 차지하는 게이트로 표시할지 여부 (기본: true) */
  fullScreen?: boolean
}

export function PremiumGate({ fullScreen = true }: PremiumGateProps) {
  const content = (
    <View className={fullScreen ? 'flex-1 bg-gray-50' : 'bg-gray-50 rounded-2xl'}>
      {/* 상단 그래픽 */}
      <View className="bg-primary items-center px-6 pt-10 pb-12">
        <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center mb-4">
          <Text className="text-3xl">⭐</Text>
        </View>
        <Text className="text-white font-bold text-xl text-center leading-snug">
          정회원 전용 콘텐츠입니다
        </Text>
        <Text className="text-blue-200 text-sm text-center mt-2 leading-relaxed">
          자료실은 연 5만원 정회원만{'\n'}이용할 수 있습니다.
        </Text>
      </View>

      {/* 혜택 카드 */}
      <View className="mx-4 -mt-5 bg-white rounded-2xl shadow-sm p-5 mb-4">
        <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4">
          정회원 혜택
        </Text>
        {BENEFITS.map((b, i) => (
          <View
            key={b.title}
            className={`flex-row items-start gap-3 ${i < BENEFITS.length - 1 ? 'mb-4' : ''}`}
          >
            <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center">
              <Text className="text-base">{b.emoji}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold text-sm">{b.title}</Text>
              <Text className="text-gray-400 text-xs mt-0.5">{b.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 납부 안내 요약 */}
      <View className="mx-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
        <View className="flex-row items-center gap-2 mb-2">
          <Text className="text-lg">💛</Text>
          <Text className="text-yellow-800 font-semibold text-sm">연회비 안내</Text>
        </View>
        <Text className="text-yellow-700 text-sm leading-relaxed">
          국민은행 263101-04-561156{'\n'}
          예금주: 이창호 (한국이주민선교연합회){'\n'}
          입금 후 admin@kima2019.org로 알려주세요.
        </Text>
      </View>

      {/* CTA 버튼 */}
      <View className="mx-4 mb-8 gap-3">
        <TouchableOpacity
          onPress={() => router.push('/(member)/mypage/upgrade')}
          className="bg-primary py-4 rounded-2xl items-center"
        >
          <Text className="text-white font-bold text-base">정회원 신청하기</Text>
          <Text className="text-blue-200 text-xs mt-0.5">연 50,000원 · 승인 후 즉시 이용</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  if (!fullScreen) return content

  return <ScrollView className="flex-1">{content}</ScrollView>
}
