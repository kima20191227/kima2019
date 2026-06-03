import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MediaWriteForm } from './MediaWriteForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '행사 사진·영상 등록 | KIMA' }

export default async function MediaWritePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login?callbackUrl=/story/media/write')

  const role = session.user.role
  if (role !== 'OFFICER' && role !== 'ADMIN') redirect('/story/media')

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-10">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#1B3A6B] mb-1">행사 사진·영상 등록</h1>
        <p className="text-sm text-gray-500 mb-8">KIMA가 주관·참여한 행사의 사진과 영상을 갤러리에 등록합니다.</p>

        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-sm leading-relaxed">
          <p className="font-semibold text-blue-800 mb-1">등록 안내</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>사진은 여러 장 업로드할 수 있으며, 대표 사진을 별도로 지정할 수 있습니다.</li>
            <li>유튜브·Vimeo 영상 링크를 추가하면 상세 페이지에서 바로 재생됩니다.</li>
            <li>등록 후 즉시 공개됩니다. 수정이 필요하면 목록 또는 상세 페이지에서 수정하세요.</li>
          </ul>
        </div>

        <MediaWriteForm />
      </div>
    </div>
  )
}
