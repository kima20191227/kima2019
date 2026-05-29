-- ============================================================
-- KIMA 프로젝트 RLS (Row Level Security) 활성화 스크립트
-- Supabase SQL Editor에서 실행하세요.
--
-- 목적: anon 키를 통한 무단 REST API 접근 차단
-- 영향: 없음 — 앱은 Prisma(service_role)로만 DB 접근
-- 수정: PageView → @@map("page_views") 이므로 실제명 page_views 사용
-- ============================================================

-- ── 1. 모든 테이블에 RLS 활성화 ──────────────────────────────
ALTER TABLE public."User"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Account"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Session"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Organization"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Category"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Post"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Resource"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Event"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EventAttendee"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Story"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ForumArchive"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ForumMaterial"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ForumSchedule"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Question"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Answer"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ColumnPost"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Leader"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Popup"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."News"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."NewsSource"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."NewsSettings"   ENABLE ROW LEVEL SECURITY;

-- ※ PageView 모델은 @@map("page_views") 이므로 실제 테이블명 page_views 사용
ALTER TABLE public.page_views       ENABLE ROW LEVEL SECURITY;

-- ── 2. service_role은 RLS 자동 우회 (Prisma 접근 보장) ────────
-- service_role은 기본적으로 RLS를 우회하므로 별도 정책 불필요.
-- anon 롤은 정책이 없으므로 자동으로 모든 접근 차단됨.

-- ── 3. 확인 쿼리 (실행 후 모두 true인지 확인) ─────────────────
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
