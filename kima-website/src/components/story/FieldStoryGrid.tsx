'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { parseVideoUrl } from '@/lib/videoUtils'

export interface FieldStoryItem {
  id: string
  title: string
  excerpt: string | null
  thumbnail: string | null
  images: string[]
  videoUrls: string[]
  tags: string[]
  authorName: string | null
  ministryLocation: string | null
  createdAt: string
}

function PlayIcon() {
  return (
    <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

interface VideoModalProps {
  url: string
  title: string
  onClose: () => void
}

function VideoModal({ url, title, onClose }: VideoModalProps) {
  const info = parseVideoUrl(url)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handler)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/88 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="영상 재생"
    >
      <div
        className="relative w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-11 right-0 w-9 h-9 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white text-lg transition-colors"
          aria-label="닫기"
        >
          ✕
        </button>

        {/* 제목 */}
        <p className="text-white/80 text-sm font-medium mb-3 line-clamp-1 pr-12">{title}</p>

        {/* 영상 임베드 */}
        {info ? (
          <div className="relative w-full rounded-xl overflow-hidden bg-black shadow-2xl" style={{ paddingTop: '56.25%' }}>
            <iframe
              src={info.embedUrl + (info.platform === 'youtube' ? '&autoplay=1' : '')}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl p-6 text-center">
            <p className="text-white/60 text-sm mb-3">직접 재생이 지원되지 않는 링크입니다.</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#C8922A] text-white text-sm font-semibold rounded-lg hover:bg-[#b07d22] transition-colors"
            >
              <PlayIcon />
              외부 링크에서 보기
            </a>
          </div>
        )}

        <p className="text-white/40 text-xs mt-3 text-center">
          배경 클릭 또는 ESC 키로 닫기
        </p>
      </div>
    </div>
  )
}

interface StoryCardProps {
  story: FieldStoryItem
  onPlayVideo: (url: string, title: string) => void
}

function StoryCard({ story, onPlayVideo }: StoryCardProps) {
  const firstVideo = story.videoUrls[0] ?? null
  const videoInfo = firstVideo ? parseVideoUrl(firstVideo) : null
  const hasVideo = !!firstVideo
  const imageCount = story.images.length

  // 썸네일 우선순위: story.thumbnail > YouTube 썸네일 > 첫 번째 이미지
  const thumbSrc =
    story.thumbnail ||
    videoInfo?.thumbnailUrl ||   // Vimeo·GDrive는 '' → 다음으로 fallthrough
    story.images[0] ||
    null

  const dateStr = new Date(story.createdAt).toLocaleDateString('ko-KR')

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">

      {/* 썸네일 영역 */}
      {thumbSrc ? (
        <div className="relative w-full h-44 rounded-t-xl overflow-hidden bg-gray-100 shrink-0">
          <Image
            src={thumbSrc}
            alt={story.title}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
          {/* 영상 재생 버튼 오버레이 */}
          {hasVideo && (
            <button
              type="button"
              onClick={() => onPlayVideo(firstVideo!, story.title)}
              className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/45 transition-colors group"
              aria-label="영상 재생"
            >
              <div className="w-14 h-14 bg-white/90 group-hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors">
                <svg className="w-6 h-6 text-red-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>
          )}
          {/* 사진 장수 배지 */}
          {imageCount > 1 && (
            <span className="absolute top-2 right-2 bg-black/55 text-white text-xs px-2 py-0.5 rounded-full pointer-events-none">
              📷 {imageCount}장
            </span>
          )}
        </div>
      ) : hasVideo ? (
        /* 썸네일 없고 영상만 있을 때 — 어두운 플레이 배너 */
        <button
          type="button"
          onClick={() => onPlayVideo(firstVideo!, story.title)}
          className="w-full h-32 rounded-t-xl bg-gray-900 flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors group shrink-0"
          aria-label="영상 재생"
        >
          <div className="w-12 h-12 bg-red-600 group-hover:bg-red-500 rounded-full flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="text-white text-sm font-medium">영상 보기</span>
        </button>
      ) : null}

      {/* 카드 텍스트 — 상세 페이지 링크 */}
      <Link href={`/story/${story.id}`} className="p-5 flex flex-col flex-1 min-h-0">
        {/* 태그 + 영상 뱃지 */}
        <div className="flex items-center flex-wrap gap-1.5 mb-2">
          {hasVideo && (
            <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-xs font-medium flex items-center gap-1">
              ▶ 영상
            </span>
          )}
          {imageCount > 0 && !hasVideo && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
              📷 사진
            </span>
          )}
          {story.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
              {tag}
            </span>
          ))}
        </div>

        <h3 className="font-semibold text-gray-800 line-clamp-2 leading-snug">{story.title}</h3>
        {story.excerpt && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-3 leading-relaxed">{story.excerpt}</p>
        )}

        <div className="mt-auto pt-3 flex items-center gap-2 text-xs text-gray-400">
          <span>{story.authorName ?? '익명'}</span>
          {story.ministryLocation && <span>· {story.ministryLocation}</span>}
          <span className="ml-auto">{dateStr}</span>
        </div>
      </Link>
    </div>
  )
}

export function FieldStoryGrid({ stories }: { stories: FieldStoryItem[] }) {
  const [popup, setPopup] = useState<{ url: string; title: string } | null>(null)

  const openVideo = (url: string, title: string) => setPopup({ url, title })
  const closeVideo = () => setPopup(null)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} onPlayVideo={openVideo} />
        ))}
      </div>

      {popup && (
        <VideoModal url={popup.url} title={popup.title} onClose={closeVideo} />
      )}
    </>
  )
}
