import { formatLegalDate } from '@/lib/legalCategories'

interface LegalDisclaimerProps {
  updatedAt?: Date | string | null
  sourceUrl?: string | null
}

export function LegalDisclaimer({ updatedAt, sourceUrl }: LegalDisclaimerProps) {
  const formattedUpdatedAt = formatLegalDate(updatedAt)

  return (
    <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="flex items-start gap-2">
        <span aria-hidden="true" className="mt-0.5 text-base leading-none">
          ⚠️
        </span>
        <div>
          <p className="font-semibold">법적 고지사항</p>
          <div className="mt-2 space-y-1 leading-relaxed">
            <p>본 자료는 이주민 사역자를 위한 참고 정보입니다.</p>
            <p>
              법적 효력이 있는 정확한 해석은 반드시 전문가(변호사, 행정사)와 상담하시기 바랍니다.
            </p>
            <p>
              법령 원문은 국가법령정보센터(law.go.kr)를 기준으로 하며, 개별 사례의 적용은 관할
              기관의 판단에 따라 달라질 수 있습니다.
            </p>
          </div>
          <p className="mt-3 text-xs font-medium text-amber-800">
            최종 업데이트: {formattedUpdatedAt ?? '확인 필요'}
          </p>
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-sm font-semibold text-[#1B3A6B] hover:underline"
            >
              국가법령정보센터 원문 보기
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
