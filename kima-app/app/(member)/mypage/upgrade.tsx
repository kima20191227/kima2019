import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Stack } from 'expo-router'
import { useAuth } from '@/auth/AuthContext'
import { RequireRole } from '@/auth/RequireRole'

const ACCOUNT = {
  bank:   '국민은행',
  number: '263101-04-561156',
  holder: '이창호 (한국이주민선교연합회)',
  fee:    '50,000',
}

const BENEFITS = [
  { emoji: '📁', title: '자료실 전체 이용', desc: '비자·법률·의료·보조금 정회원 전용 자료 열람' },
  { emoji: '🌐', title: '리스닝콜 참여', desc: '분기별 온라인 연합 네트워크 모임 참석' },
  { emoji: '🤝', title: '사역자 네트워크', desc: '전국 KIMA 사역자들과 직접 연결' },
  { emoji: '📊', title: '이주민 현황 데이터', desc: '지역·언어권별 이주민 통계 및 백서 열람' },
]

function UpgradeContent() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await Clipboard.setStringAsync(ACCOUNT.number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEmail = () => {
    const subject = encodeURIComponent('[KIMA 정회원 신청] 입금 확인 요청')
    const body = encodeURIComponent(
      `안녕하세요.\n\n정회원 연회비를 입금하였습니다.\n\n성함: ${user?.name ?? ''}\n이메일: ${user?.email ?? ''}\n입금자명:\n입금 날짜:\n\n감사합니다.`,
    )
    Linking.openURL(`mailto:admin@kima2019.org?subject=${subject}&body=${body}`)
  }

  return (
    <>
      <Stack.Screen options={{ title: '정회원 신청', headerShown: true }} />
      <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
        {/* 히어로 */}
        <View className="bg-primary px-6 pt-6 pb-10">
          <Text className="text-secondary font-bold text-xs tracking-widest uppercase mb-2">
            Premium Member
          </Text>
          <Text className="text-white text-2xl font-bold leading-snug">
            정회원 혜택을{'\n'}누려보세요 ⭐
          </Text>
          <Text className="text-blue-200 text-sm mt-2">
            연 5만원으로 KIMA의 모든 서비스를 이용하세요.
          </Text>
        </View>

        {/* 혜택 카드 */}
        <View className="mx-4 -mt-5 bg-white rounded-2xl shadow-sm p-5 mb-4">
          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4">
            정회원 혜택
          </Text>
          {BENEFITS.map((b) => (
            <View key={b.title} className="flex-row items-start gap-3 mb-4 last:mb-0">
              <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                <Text className="text-xl">{b.emoji}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold text-sm">{b.title}</Text>
                <Text className="text-gray-500 text-xs mt-0.5 leading-relaxed">{b.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 납부 안내 */}
        <View className="mx-4 mb-4 bg-white rounded-2xl shadow-sm p-5">
          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4">
            납부 안내
          </Text>

          {/* 금액 */}
          <View className="bg-primary/10 rounded-xl p-4 mb-4 items-center">
            <Text className="text-gray-500 text-xs mb-1">연회비</Text>
            <Text className="text-primary font-bold text-3xl">
              {ACCOUNT.fee}
              <Text className="text-lg">원</Text>
            </Text>
            <Text className="text-gray-400 text-xs mt-1">가입일로부터 1년</Text>
          </View>

          {/* 계좌 */}
          <View className="mb-3">
            <Text className="text-gray-500 text-xs mb-1">은행</Text>
            <Text className="text-gray-900 font-semibold">{ACCOUNT.bank}</Text>
          </View>

          <View className="mb-3">
            <Text className="text-gray-500 text-xs mb-1">예금주</Text>
            <Text className="text-gray-900 font-semibold">{ACCOUNT.holder}</Text>
          </View>

          <View className="mb-1">
            <Text className="text-gray-500 text-xs mb-1">계좌번호</Text>
            <View className="flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <Text className="text-gray-900 font-mono font-semibold">{ACCOUNT.number}</Text>
              <TouchableOpacity
                onPress={handleCopy}
                className={`px-3 py-1.5 rounded-lg ${copied ? 'bg-green-500' : 'bg-primary'}`}
              >
                <Text className="text-white text-xs font-medium">
                  {copied ? '복사됨 ✓' : '복사'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 신청 절차 */}
        <View className="mx-4 mb-4 bg-white rounded-2xl shadow-sm p-5">
          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4">
            신청 절차
          </Text>
          {[
            { step: '1', label: '위 계좌로 연회비 5만원 입금' },
            { step: '2', label: '아래 버튼으로 입금 사실 이메일 발송' },
            { step: '3', label: '관리자 확인 후 정회원 등급 변경 (1~2 영업일)' },
            { step: '4', label: '승인 완료 이메일 수신 후 정회원 기능 이용' },
          ].map((item) => (
            <View key={item.step} className="flex-row items-center gap-3 mb-3 last:mb-0">
              <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                <Text className="text-white text-xs font-bold">{item.step}</Text>
              </View>
              <Text className="flex-1 text-gray-700 text-sm">{item.label}</Text>
            </View>
          ))}
        </View>

        {/* 이메일 발송 버튼 */}
        <View className="mx-4 mb-10">
          <TouchableOpacity
            onPress={handleEmail}
            className="bg-secondary py-4 rounded-2xl items-center"
          >
            <Text className="text-white font-semibold text-base">입금 확인 이메일 보내기</Text>
            <Text className="text-yellow-100 text-xs mt-0.5">admin@kima2019.org</Text>
          </TouchableOpacity>
          <Text className="text-gray-400 text-xs text-center mt-3">
            입금 후 반드시 이메일로 알려주셔야 빠른 처리가 가능합니다.
          </Text>
        </View>
      </ScrollView>
    </>
  )
}

export default function UpgradeScreen() {
  return (
    <RequireRole minRole="MEMBER">
      <UpgradeContent />
    </RequireRole>
  )
}
