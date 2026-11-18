import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { forumSurveySchema } from '@/schemas/forumSurvey.schema'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { FORUM_SURVEY_KEY, getForumSurveyState } from '@/lib/forumSurvey'

export async function POST(req: NextRequest) {
  // IP당 10분에 30회 제출 제한 (현장에서 같은 와이파이로 여러 명이 제출할 수 있어 너무 낮추지 말 것)
  const ip = getClientIp(req)
  const { allowed, resetAt } = checkRateLimit(`forum-survey:${ip}`, {
    limit: 30,
    windowMs: 10 * 60 * 1000,
  })
  if (!allowed) {
    return NextResponse.json(
      { message: '너무 많은 요청입니다. 잠시 후 다시 시도해 주세요.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) },
      }
    )
  }

  const state = getForumSurveyState()
  if (state !== 'open') {
    return NextResponse.json(
      { message: state === 'before' ? '아직 설문이 시작되지 않았습니다.' : '설문이 마감되었습니다.' },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const parsed = forumSurveySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: '입력값이 올바르지 않습니다', errors: parsed.error.format() },
        { status: 400 }
      )
    }

    const { answers, respondentName, respondentOrg, respondentContact } = parsed.data

    // 빈 값(''·undefined) 제거 후 저장
    const cleaned = Object.fromEntries(
      Object.entries(answers).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))
    )

    await prisma.forumSurveyResponse.create({
      data: {
        forumKey: FORUM_SURVEY_KEY,
        answers: cleaned as Prisma.InputJsonObject,
        respondentName: respondentName || null,
        respondentOrg: respondentOrg || null,
        respondentContact: respondentContact || null,
      },
    })

    return NextResponse.json({ message: '설문이 제출되었습니다' }, { status: 201 })
  } catch {
    return NextResponse.json({ message: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
