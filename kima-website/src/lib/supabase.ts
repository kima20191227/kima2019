/**
 * Supabase 클라이언트 팩토리
 *
 * 이 프로젝트의 접근 방식:
 *   - DB 읽기/쓰기  → Prisma ORM (서버 전용, RLS 우회)
 *   - Storage 업로드 → createAdminClient() (서버 전용, service_role)
 *   - 브라우저 직접  → 없음 (anon 키 불필요)
 *
 * createAdminClient() 는 SUPABASE_SERVICE_ROLE_KEY 를 사용하므로
 * 반드시 서버 사이드(Route Handler / Server Action)에서만 호출해야 합니다.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

/**
 * 서버 전용 관리자 클라이언트 (service_role — RLS 우회)
 *
 * 사용 위치:
 *   - /api/upload/*          이미지·파일 Storage 업로드
 *   - /api/upload/forum      포럼 파일 업로드
 *   - /api/admin/popups/upload  팝업 이미지 업로드
 *   - /api/member/gmfsns-orgs/[id]/image  단체 이미지 업로드
 *   - /api/admin/import-gmfsns  gmfsns_org_edits 테이블 읽기
 */
export function createAdminClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL 환경변수가 설정되지 않았습니다.')
  }
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.')
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
