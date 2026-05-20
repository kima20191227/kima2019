import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 4기 이취임식 사진 (public/images/4th_picture/ 폴더)
const IMAGES_4TH = [
  '/images/4th_picture/KakaoTalk_20260512_212738691.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_01.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_02.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_03.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_04.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_05.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_06.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_07.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_08.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_09.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_10.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_11.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_12.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_13.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_14.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_15.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_16.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_17.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_18.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_19.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_20.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_21.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_22.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_23.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_24.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_25.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_26.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_27.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_28.webp',
  '/images/4th_picture/KakaoTalk_20260512_212738691_29.webp',
]

export async function POST() {
  // 환경변수 SEED_CEREMONY_ENABLED=true 일 때만 활성화 (일회성 데이터 주입 엔드포인트)
  if (process.env.SEED_CEREMONY_ENABLED !== 'true') {
    return NextResponse.json({ error: '비활성화된 엔드포인트입니다.' }, { status: 404 })
  }

  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: '관리자만 실행할 수 있습니다.' }, { status: 403 })
  }

  // 이미 등록된 경우 중복 방지
  const existing = await prisma.story.findFirst({
    where: { type: 'EVENT_MEDIA', title: { contains: '4기 임원단 이취임식' } },
  })
  if (existing) {
    return NextResponse.json({ message: '이미 등록되어 있습니다.', id: existing.id })
  }

  const story = await prisma.story.create({
    data: {
      type:          'EVENT_MEDIA',
      title:         'KIMA 4기 임원단 이취임식',
      content:       '2026년 5월 12일, KIMA 4기 임원단 이취임식이 진행되었습니다. 새로운 임원단이 세워지고, 이주민 선교를 위한 귀한 사역의 바통이 이어졌습니다.',
      excerpt:       '2026년 5월, KIMA 4기 임원단 이취임식 현장',
      images:        IMAGES_4TH,
      videoUrls:     [],
      tags:          ['이취임식', '4기', '임원단', '2026'],
      eventLocation: '서울',
      publishedAt:   new Date('2026-05-12'),
      status:        'APPROVED',
      isPublished:   true,
    },
  })

  return NextResponse.json({ message: '4기 이취임식 갤러리가 등록되었습니다.', id: story.id }, { status: 201 })
}
