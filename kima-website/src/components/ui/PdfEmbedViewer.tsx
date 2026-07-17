interface Props {
  url: string
  name?: string
  className?: string
}

/**
 * Google Drive 파일 링크 또는 직접 PDF URL을 인라인 임베드로 표시.
 * - Drive 파일 ID를 추출해 /preview 임베드로 렌더 (Drive 기본 뷰어)
 * - Drive ID가 없고 .pdf로 끝나는 URL이면 원본 URL을 브라우저 기본 PDF 뷰어로 렌더
 * - 둘 다 아니면 다운로드 링크만 표시
 * 순수 표현 컴포넌트 — 서버 컴포넌트에서도 렌더 가능.
 */
function extractDriveId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([^/?#]+)/,
    /[?&]id=([^&#]+)/,
    /thumbnail\?id=([^&#]+)/,
    /open\?id=([^&#]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

export function PdfEmbedViewer({ url, name, className = '' }: Props) {
  const driveId = extractDriveId(url)
  const embedSrc = driveId
    ? `https://drive.google.com/file/d/${driveId}/preview`
    : url.toLowerCase().endsWith('.pdf')
      ? url
      : null

  return (
    <div className={className}>
      {name && <p className="text-sm font-medium text-gray-700 mb-2 truncate">{name}</p>}

      {embedSrc ? (
        <>
          <iframe
            src={embedSrc}
            className="w-full h-[70vh] sm:h-[600px] rounded-lg border border-gray-200"
            title={name ?? 'PDF 문서'}
            allow="autoplay"
          />
          <div className="mt-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[#1B3A6B] hover:underline"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              새 탭에서 열기
            </a>
          </div>
        </>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-[#1B3A6B] hover:underline"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          {name ?? '문서 열기'}
        </a>
      )}
    </div>
  )
}
