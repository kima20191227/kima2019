import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FORUM_SURVEY_KEY, FORUM_SURVEY_QUESTIONS } from '@/lib/forumSurvey'
import { answerToCell, type SurveyAnswers } from '@/lib/forumSurveyStats'

// CSV 셀 이스케이프 + 수식 주입(=,+,-,@) 방지
function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}

export async function GET() {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (role !== 'ADMIN' && role !== 'OFFICER') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const rows = await prisma.forumSurveyResponse.findMany({
      where: { forumKey: FORUM_SURVEY_KEY },
      orderBy: { createdAt: 'asc' },
    })

    const header = ['제출일시', ...FORUM_SURVEY_QUESTIONS.map((q) => q.label), '이름', '소속', '연락처']
    const lines = rows.map((r) => {
      const answers = (r.answers ?? {}) as SurveyAnswers
      return [
        r.createdAt.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        ...FORUM_SURVEY_QUESTIONS.map((q) => answerToCell(q, answers)),
        r.respondentName ?? '',
        r.respondentOrg ?? '',
        r.respondentContact ?? '',
      ]
        .map(csvCell)
        .join(',')
    })

    // UTF-8 BOM — Excel에서 한글 깨짐 방지
    const csv = '﻿' + [header.map(csvCell).join(','), ...lines].join('\r\n')
    const filename = encodeURIComponent(`${FORUM_SURVEY_KEY}_KIMA_포럼_설문응답.csv`)

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="forum-survey.csv"; filename*=UTF-8''${filename}`,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'CSV 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
