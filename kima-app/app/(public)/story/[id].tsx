import React from 'react'
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, Stack } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Image } from 'expo-image'
import { api } from '@/api/client'
import { ErrorView } from '@/components/ui/ErrorView'
import type { Story } from '@/types'

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&#]+)/,
    /youtube\.com\/watch\?v=([^&#]+)/,
    /youtube\.com\/embed\/([^?&#]+)/,
    /youtube\.com\/shorts\/([^?&#]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data: story, isLoading, isError, refetch } = useQuery({
    queryKey: ['story', id],
    queryFn: () =>
      api.get<{ story: Story }>(`/api/stories/${id}`).then((r) => r.story),
    enabled: !!id,
  })

  const primaryVideo = story?.videoUrls?.[0] ?? null

  const handleWatchVideo = async () => {
    if (!primaryVideo) return
    await WebBrowser.openBrowserAsync(primaryVideo, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    })
  }

  const handleShare = async () => {
    if (!story) return
    await Share.share({
      title: story.title,
      message: `KIMA 스토리: ${story.title}`,
    })
  }

  const ytId = primaryVideo ? extractYouTubeId(primaryVideo) : null
  const thumbnailUrl = ytId
    ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
    : story?.thumbnail

  return (
    <>
      <Stack.Screen
        options={{
          title: '스토리',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} className="pr-1">
              <Text className="text-primary text-sm font-medium">공유</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View className="flex-1 bg-gray-50">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#1B3A6B" />
          </View>
        ) : isError || !story ? (
          <ErrorView onRetry={() => refetch()} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 썸네일 / 비디오 커버 */}
            {thumbnailUrl ? (
              <TouchableOpacity
                activeOpacity={primaryVideo ? 0.8 : 1}
                onPress={primaryVideo ? handleWatchVideo : undefined}
                style={{ position: 'relative' }}
              >
                <Image
                  source={{ uri: thumbnailUrl }}
                  style={{ width: '100%', height: 220 }}
                  contentFit="cover"
                />
                {primaryVideo && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.25)',
                    }}
                  >
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 22, marginLeft: 4 }}>▶</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ) : null}

            {/* 본문 */}
            <View className="bg-white mx-4 -mt-4 rounded-2xl shadow-sm p-5 mb-4">
              <Text className="text-gray-900 font-bold text-lg leading-snug mb-2">
                {story.title}
              </Text>
              <Text className="text-gray-400 text-xs mb-4">
                {story.createdAt
                  ? new Date(story.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : ''}
              </Text>
              {story.content ? (
                <Text className="text-gray-700 text-sm leading-relaxed">{story.content}</Text>
              ) : null}
            </View>

            {/* 유튜브 버튼 */}
            {primaryVideo && (
              <View className="mx-4 mb-10">
                <TouchableOpacity
                  onPress={handleWatchVideo}
                  className="bg-red-500 py-3.5 rounded-xl items-center flex-row justify-center gap-2"
                >
                  <Text className="text-lg">▶</Text>
                  <Text className="text-white font-semibold">YouTube에서 보기</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </>
  )
}
