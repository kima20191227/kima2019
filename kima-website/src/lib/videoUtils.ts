export type VideoInfo = {
  platform: 'youtube' | 'vimeo' | 'gdrive'
  embedUrl: string
  thumbnailUrl: string
} | null

export function parseVideoUrl(url: string): VideoInfo {
  // YouTube (watch, embed, shorts, youtu.be)
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (ytMatch) {
    return {
      platform: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
    }
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return {
      platform: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1`,
      thumbnailUrl: '',
    }
  }

  // Google Drive — file/d/ID/view 또는 open?id=ID / uc?id=ID 형식
  // 조건: 드라이브 파일이 "링크가 있는 모든 사용자" 공유 설정이어야 합니다.
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (driveFileMatch) {
    return {
      platform: 'gdrive',
      embedUrl: `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`,
      thumbnailUrl: '',
    }
  }
  const driveIdMatch = url.match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*[?&])?id=([a-zA-Z0-9_-]+)/)
  if (driveIdMatch) {
    return {
      platform: 'gdrive',
      embedUrl: `https://drive.google.com/file/d/${driveIdMatch[1]}/preview`,
      thumbnailUrl: '',
    }
  }

  return null
}
