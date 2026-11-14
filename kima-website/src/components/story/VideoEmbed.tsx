'use client'

import { parseVideoUrl } from '@/lib/videoUtils'

interface Props {
  url: string
  title?: string
  index?: number
  /** 유튜브 영상을 음소거 자동재생 + 무한 반복으로 표시 (유튜브만 지원) */
  autoPlayLoop?: boolean
}

export function VideoEmbed({ url, title, index, autoPlayLoop }: Props) {
  const info = parseVideoUrl(url)

  if (!info) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-xl text-sm text-gray-700 hover:bg-gray-200 transition-colors"
      >
        <span className="text-red-600 text-lg leading-none">▶</span>
        <span className="truncate">{url}</span>
      </a>
    )
  }

  const label = title ?? (index !== undefined ? `영상 ${index + 1}` : '영상')

  const src =
    autoPlayLoop && info.platform === 'youtube' && info.id
      ? `${info.embedUrl}&autoplay=1&mute=1&loop=1&playlist=${info.id}`
      : info.embedUrl

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black shadow-md" style={{ paddingTop: '56.25%' }}>
      <iframe
        src={src}
        title={label}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  )
}
