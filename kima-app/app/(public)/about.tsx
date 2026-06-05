import React from 'react'
import { ScrollView, View, Text } from 'react-native'
import { Stack } from 'expo-router'

const VISIONS = [
  {
    key: 'CONNECT',
    emoji: '🔗',
    title: '연결',
    desc: '전국 다문화사역 단체를 하나의 플랫폼으로 연결합니다. 지역·언어권·사역대상별 네트워크를 구축하고 협력을 촉진합니다.',
  },
  {
    key: 'DATA',
    emoji: '📊',
    title: '기록',
    desc: '이주민 현황 데이터를 체계적으로 수집하고 공유합니다. 정책 제안과 사역 계획 수립의 근거가 되는 신뢰할 수 있는 데이터를 제공합니다.',
  },
  {
    key: 'STORY',
    emoji: '📸',
    title: '보이게',
    desc: '이주민과 사역자의 생생한 이야기를 세상에 알립니다. 현장의 목소리를 통해 사회적 인식을 변화시킵니다.',
  },
  {
    key: 'FUND',
    emoji: '💛',
    title: '후원으로 이어주는',
    desc: '사역 단체와 후원자를 연결합니다. 재정적 지원을 통해 지속 가능한 사역 생태계를 만들어 갑니다.',
  },
]

const PLANS = [
  '전국 사역 단체 디렉토리 구축 및 지도 서비스 운영',
  '분기별 리스닝콜 (온라인 네트워크 미팅) 진행',
  '연간 전국 포럼 개최',
  '이주민 현황 백서 발간 (연 1회)',
  '사역자 훈련 자료 개발 및 배포',
  '후원 연계 플랫폼 운영',
]

export default function AboutScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'KIMA 소개', headerShown: true }} />
      <ScrollView className="flex-1 bg-gray-50">
        {/* 히어로 */}
        <View className="bg-primary px-6 pt-8 pb-10">
          <Text className="text-secondary font-bold text-xs tracking-widest uppercase mb-2">
            About KIMA
          </Text>
          <Text className="text-white text-2xl font-bold leading-snug">
            한국이주민선교연합회
          </Text>
          <Text className="text-blue-200 text-sm mt-2 leading-relaxed">
            연결하고 · 기록하고 · 보이게 하고 · 후원으로 이어주는
          </Text>
        </View>

        {/* 소개 */}
        <View className="mx-4 -mt-5 bg-white rounded-2xl shadow-sm p-5">
          <Text className="text-gray-700 text-sm leading-relaxed">
            KIMA(Korea Immigrant Mission Alliance)는 전국의 이주민 사역 단체들이 연합하여
            한국 내 이주민들에게 복음을 전하고, 그들의 삶을 돕기 위해 설립된 단체입니다.{'\n\n'}
            국내에 거주하는 이주민은 280만 명을 넘어섰습니다. KIMA는 이 시대의 소명을 따라
            전국 사역 단체들을 연결하고, 효과적인 사역을 위한 정보와 자원을 나눕니다.
          </Text>
        </View>

        {/* 4대 비전 */}
        <View className="mx-4 mt-5">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            4대 비전
          </Text>
          {VISIONS.map((v) => (
            <View key={v.key} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
              <View className="flex-row items-center gap-3 mb-2">
                <Text className="text-2xl">{v.emoji}</Text>
                <View>
                  <Text className="text-primary font-bold text-xs">{v.key}</Text>
                  <Text className="text-gray-900 font-semibold">{v.title}</Text>
                </View>
              </View>
              <Text className="text-gray-600 text-sm leading-relaxed">{v.desc}</Text>
            </View>
          ))}
        </View>

        {/* 6대 실행계획 */}
        <View className="mx-4 mt-2 mb-10">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            6대 실행계획
          </Text>
          <View className="bg-white rounded-xl p-4 shadow-sm">
            {PLANS.map((plan, i) => (
              <View key={i} className="flex-row items-start gap-3 mb-3 last:mb-0">
                <View className="w-5 h-5 rounded-full bg-primary items-center justify-center mt-0.5">
                  <Text className="text-white text-xs font-bold">{i + 1}</Text>
                </View>
                <Text className="flex-1 text-gray-700 text-sm leading-relaxed">{plan}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  )
}
