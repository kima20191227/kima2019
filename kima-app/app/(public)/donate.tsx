import React, { useState } from 'react'
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Stack } from 'expo-router'

const ACCOUNT = {
  bank: '국민은행',
  number: '263101-04-561156',
  holder: '이창호 (한국이주민선교연합회)',
}

const DONATE_LEVELS = [
  { amount: '10,000', label: '일반 후원', emoji: '🌱', desc: '이주민 사역 기본 운영 지원' },
  { amount: '30,000', label: '정기 후원', emoji: '🌿', desc: '월 1회 사역 활동 지원' },
  { amount: '50,000', label: '동역 후원', emoji: '🌳', desc: '리스닝콜 1회 운영 지원' },
  { amount: '100,000', label: '파트너 후원', emoji: '✨', desc: '포럼 개최 직접 지원' },
]

function CopiedTag() {
  return (
    <View className="absolute -top-8 left-0 right-0 items-center">
      <View className="bg-gray-800 px-3 py-1 rounded-full">
        <Text className="text-white text-xs font-medium">복사됨!</Text>
      </View>
    </View>
  )
}

export default function DonateScreen() {
  const [copiedField, setCopiedField] = useState<'number' | 'holder' | null>(null)

  const copyToClipboard = async (text: string, field: 'number' | 'holder') => {
    await Clipboard.setStringAsync(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleEmailContact = () => {
    const subject = encodeURIComponent('[KIMA 후원] 입금 안내')
    const body = encodeURIComponent(
      '안녕하세요.\n\n아래 내용으로 후원금을 입금하였습니다.\n\n성함:\n입금 금액:\n입금 날짜:\n용도 (후원/사무국 등):\n\n감사합니다.',
    )
    Linking.openURL(`mailto:admin@kima2019.org?subject=${subject}&body=${body}`)
  }

  return (
    <>
      <Stack.Screen options={{ title: '후원', headerShown: true }} />
      <ScrollView className="flex-1 bg-gray-50">
        {/* 헤더 */}
        <View className="bg-primary px-6 pt-8 pb-10">
          <Text className="text-secondary font-bold text-sm mb-1">함께해주세요</Text>
          <Text className="text-white text-2xl font-bold leading-snug">
            이주민 선교{'\n'}후원하기 💛
          </Text>
          <Text className="text-blue-200 text-sm mt-2">
            여러분의 작은 후원이 큰 사역이 됩니다.
          </Text>
        </View>

        {/* 계좌 정보 */}
        <View className="mx-4 -mt-5 bg-white rounded-2xl shadow-sm p-5 mb-4">
          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
            후원 계좌
          </Text>

          <View className="mb-3">
            <Text className="text-gray-500 text-xs mb-1">은행</Text>
            <Text className="text-gray-900 font-semibold text-base">{ACCOUNT.bank}</Text>
          </View>

          {/* 계좌번호 복사 */}
          <View className="mb-3">
            <Text className="text-gray-500 text-xs mb-1">계좌번호</Text>
            <View className="relative flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              {copiedField === 'number' && <CopiedTag />}
              <Text className="text-gray-900 font-mono text-base font-semibold">
                {ACCOUNT.number}
              </Text>
              <TouchableOpacity
                onPress={() => copyToClipboard(ACCOUNT.number, 'number')}
                className="bg-primary px-3 py-1.5 rounded-lg"
              >
                <Text className="text-white text-xs font-medium">복사</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 예금주 복사 */}
          <View>
            <Text className="text-gray-500 text-xs mb-1">예금주</Text>
            <View className="relative flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              {copiedField === 'holder' && <CopiedTag />}
              <Text className="text-gray-900 font-medium">{ACCOUNT.holder}</Text>
              <TouchableOpacity
                onPress={() => copyToClipboard('이창호', 'holder')}
                className="bg-gray-200 px-3 py-1.5 rounded-lg"
              >
                <Text className="text-gray-600 text-xs font-medium">복사</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 후원 금액 가이드 */}
        <View className="mx-4 mb-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            후원 금액 가이드
          </Text>
          {DONATE_LEVELS.map((level) => (
            <View key={level.amount} className="bg-white rounded-xl p-4 mb-2 shadow-sm">
              <View className="flex-row items-center gap-3">
                <Text className="text-xl">{level.emoji}</Text>
                <View className="flex-1">
                  <View className="flex-row items-baseline gap-2">
                    <Text className="text-gray-900 font-bold text-base">
                      {level.amount}원
                    </Text>
                    <Text className="text-gray-500 text-xs">{level.label}</Text>
                  </View>
                  <Text className="text-gray-500 text-xs mt-0.5">{level.desc}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 입금 후 안내 */}
        <View className="mx-4 mb-4 bg-secondary/10 border border-secondary/30 rounded-xl p-4">
          <Text className="text-gray-900 font-semibold mb-2">입금 후 꼭 알려주세요 ✉️</Text>
          <Text className="text-gray-700 text-sm leading-relaxed mb-3">
            입금 후 아래 정보를 이메일 또는 카카오톡으로 보내주시면 감사드립니다.{'\n\n'}
            • 성함{'\n'}
            • 입금 금액{'\n'}
            • 용도 (일반 후원 / 정기 후원 / 기타)
          </Text>
          <TouchableOpacity
            onPress={handleEmailContact}
            className="bg-secondary py-3 rounded-xl items-center"
          >
            <Text className="text-white font-semibold">이메일로 알리기</Text>
            <Text className="text-yellow-100 text-xs mt-0.5">admin@kima2019.org</Text>
          </TouchableOpacity>
        </View>

        {/* 기부금 영수증 안내 */}
        <View className="mx-4 mb-10 bg-gray-100 rounded-xl p-4">
          <Text className="text-gray-600 text-sm">
            📄 <Text className="font-medium">기부금 영수증</Text>은 비영리단체 등록 완료 후
            발급 예정입니다. 현재 등록 절차를 진행 중에 있습니다.
          </Text>
        </View>
      </ScrollView>
    </>
  )
}
