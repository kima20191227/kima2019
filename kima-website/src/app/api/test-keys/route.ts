/**
 * GET /api/test-keys
 * 환경변수 설정 확인 엔드포인트 (ADMIN 전용)
 * - 변수 존재 여부만 반환 (실제 값 비노출)
 * - 로컬 개발 / 배포 후 설정 검증용
 */
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

/** Cloudflare 바인딩 우선 → process.env fallback */
function cfEnv(key: string): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require('@opennextjs/cloudflare')
    const ctx = getCloudflareContext() as { env?: Record<string, string | undefined> }
    const val = ctx?.env?.[key]
    if (val) return val
  } catch { /* 로컬 환경 — 무시 */ }
  return process.env[key]
}

function check(value: string | undefined): '✅ 설정됨' | '❌ 미설정' {
  return value && value.trim().length > 0 ? '✅ 설정됨' : '❌ 미설정'
}

/** 민감한 값을 마스킹 (앞 4자만 표시) */
function mask(value: string | undefined): string {
  if (!value || value.trim().length === 0) return '(없음)'
  const v = value.trim()
  return v.slice(0, 4) + '****'
}

export async function GET() {
  // ADMIN만 접근 허용
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  const result = {
    timestamp: new Date().toISOString(),

    // ── 데이터베이스 ─────────────────────────────────────────────
    database: {
      DATABASE_URL:         check(cfEnv('DATABASE_URL')),
    },

    // ── 인증 ─────────────────────────────────────────────────────
    auth: {
      NEXTAUTH_SECRET:      check(cfEnv('NEXTAUTH_SECRET')),
      NEXTAUTH_URL:         cfEnv('NEXTAUTH_URL') ?? '(없음)',
    },

    // ── Supabase ─────────────────────────────────────────────────
    supabase: {
      NEXT_PUBLIC_SUPABASE_URL:      check(cfEnv('NEXT_PUBLIC_SUPABASE_URL')),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: check(cfEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')),
      SUPABASE_SERVICE_ROLE_KEY:     check(cfEnv('SUPABASE_SERVICE_ROLE_KEY')),
    },

    // ── 이메일 ───────────────────────────────────────────────────
    email: {
      SMTP_HOST:     cfEnv('SMTP_HOST')    ?? '(없음)',
      SMTP_PORT:     cfEnv('SMTP_PORT')    ?? '(없음)',
      SMTP_USER:     cfEnv('SMTP_USER')    ?? '(없음)',
      SMTP_PASSWORD: check(cfEnv('SMTP_PASSWORD')),
      ADMIN_EMAIL:   cfEnv('ADMIN_EMAIL')  ?? '(없음)',
    },

    // ── Google Drive ──────────────────────────────────────────────
    googleDrive: {
      GOOGLE_CLIENT_EMAIL:             check(cfEnv('GOOGLE_CLIENT_EMAIL')),
      GOOGLE_PRIVATE_KEY:              check(cfEnv('GOOGLE_PRIVATE_KEY')),
      GOOGLE_SERVICE_ACCOUNT_KEY:      check(cfEnv('GOOGLE_SERVICE_ACCOUNT_KEY')),
      GOOGLE_DRIVE_RESOURCE_FOLDER_ID: cfEnv('GOOGLE_DRIVE_RESOURCE_FOLDER_ID') ?? '(없음)',
    },

    // ── 크론 ─────────────────────────────────────────────────────
    cron: {
      CRON_SECRET:       check(cfEnv('CRON_SECRET')),
      CRON_SECRET_TOKEN: check(cfEnv('CRON_SECRET_TOKEN')),
      CRON_SECRET_preview:       mask(cfEnv('CRON_SECRET')),
      CRON_SECRET_TOKEN_preview: mask(cfEnv('CRON_SECRET_TOKEN')),
    },

    // ── 뉴스 자동화 AI ────────────────────────────────────────────
    newsAI: {
      GEMINI_API_KEY:  check(cfEnv('GEMINI_API_KEY')),
      OPENAI_API_KEY:  check(cfEnv('OPENAI_API_KEY')),
      activeProvider:
        cfEnv('GEMINI_API_KEY')  ? 'gemini'
        : cfEnv('OPENAI_API_KEY') ? 'openai'
        : 'none',
    },

    // ── 네이버 뉴스 API ───────────────────────────────────────────
    naverNews: {
      NAVER_NEWS_CLIENT_ID:     check(cfEnv('NAVER_NEWS_CLIENT_ID')),
      NAVER_NEWS_CLIENT_SECRET: check(cfEnv('NAVER_NEWS_CLIENT_SECRET')),
      clientId_preview: mask(cfEnv('NAVER_NEWS_CLIENT_ID')),
    },

    // ── 소셜 로그인 ───────────────────────────────────────────────
    oauth: {
      GOOGLE_CLIENT_ID:     check(cfEnv('GOOGLE_CLIENT_ID')),
      GOOGLE_CLIENT_SECRET: check(cfEnv('GOOGLE_CLIENT_SECRET')),
      KAKAO_CLIENT_ID:      check(cfEnv('KAKAO_CLIENT_ID')),
      KAKAO_CLIENT_SECRET:  check(cfEnv('KAKAO_CLIENT_SECRET')),
      NAVER_CLIENT_ID:      check(cfEnv('NAVER_CLIENT_ID')),
      NAVER_CLIENT_SECRET:  check(cfEnv('NAVER_CLIENT_SECRET')),
    },

    // ── 지도 ─────────────────────────────────────────────────────
    maps: {
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: check(cfEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')),
    },
  }

  // 전체 요약
  const allValues = Object.values(result).flatMap((group) =>
    typeof group === 'object' && group !== null
      ? Object.values(group as Record<string, string>)
      : [group],
  )
  const missing = allValues.filter((v) => v === '❌ 미설정').length
  const set     = allValues.filter((v) => v === '✅ 설정됨').length

  return NextResponse.json({
    summary: { set, missing, total: set + missing },
    ...result,
  })
}
