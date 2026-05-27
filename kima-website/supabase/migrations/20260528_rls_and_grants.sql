-- ============================================================
-- KIMA 2019 — Supabase RLS 정책 및 권한 설정
-- 작성: 2026-05-28
-- ============================================================
--
-- [접근 방식 요약]
--   • 데이터베이스 CRUD  → Prisma ORM (서버 전용, postgres 역할 → RLS 우회)
--   • 파일 Storage       → supabase-js + SUPABASE_SERVICE_ROLE_KEY (서버 전용)
--   • gmfsns_org_edits   → supabase-js REST API + SUPABASE_SERVICE_ROLE_KEY (서버 전용)
--   • 브라우저 직접 접근 → 없음 (anon/authenticated 역할 불필요)
--
-- [보안 원칙]
--   1. 모든 테이블 RLS 활성화 → REST API /rest/v1 직접 접근 차단
--   2. anon/authenticated → REVOKE (Data API 노출 완전 차단)
--   3. service_role → GRANT (Storage API, gmfsns import 가 사용)
--   4. Prisma (postgres 슈퍼유저) → RLS 우회, 별도 GRANT 불필요
-- ============================================================


-- ──────────────────────────────────────────────────────────
-- SECTION 1. RLS 활성화 — 모든 Prisma 테이블
-- ──────────────────────────────────────────────────────────
-- 참고: FORCE ROW LEVEL SECURITY 는 사용하지 않습니다.
--   → Prisma 가 postgres 슈퍼유저로 연결하여 RLS 를 우회해야 하기 때문입니다.

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
ALTER TABLE public."Popup"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Leader"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Question"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Answer"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ColumnPost"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views       ENABLE ROW LEVEL SECURITY;


-- ──────────────────────────────────────────────────────────
-- SECTION 2. gmfsns_org_edits — Supabase 네이티브 테이블
--   import-gmfsns API 가 service_role 키로 REST 접근합니다.
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gmfsns_org_edits (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id        INT          NOT NULL,
  type          TEXT,
  targets       TEXT[],
  languages     TEXT[],
  address       TEXT,
  phone         TEXT,
  email         TEXT,
  website       TEXT,
  image_url     TEXT,
  intro_lines   TEXT[],
  contact_items TEXT[],
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE public.gmfsns_org_edits ENABLE ROW LEVEL SECURITY;


-- ──────────────────────────────────────────────────────────
-- SECTION 3. anon 역할 — 모든 테이블 권한 REVOKE
--   비로그인 REST API 접근 완전 차단
-- ──────────────────────────────────────────────────────────
REVOKE ALL PRIVILEGES ON public."User"           FROM anon;
REVOKE ALL PRIVILEGES ON public."Account"        FROM anon;
REVOKE ALL PRIVILEGES ON public."Session"        FROM anon;
REVOKE ALL PRIVILEGES ON public."Organization"   FROM anon;
REVOKE ALL PRIVILEGES ON public."Category"       FROM anon;
REVOKE ALL PRIVILEGES ON public."Post"           FROM anon;
REVOKE ALL PRIVILEGES ON public."Resource"       FROM anon;
REVOKE ALL PRIVILEGES ON public."Event"          FROM anon;
REVOKE ALL PRIVILEGES ON public."EventAttendee"  FROM anon;
REVOKE ALL PRIVILEGES ON public."Story"          FROM anon;
REVOKE ALL PRIVILEGES ON public."ForumArchive"   FROM anon;
REVOKE ALL PRIVILEGES ON public."ForumMaterial"  FROM anon;
REVOKE ALL PRIVILEGES ON public."ForumSchedule"  FROM anon;
REVOKE ALL PRIVILEGES ON public."Popup"          FROM anon;
REVOKE ALL PRIVILEGES ON public."Leader"         FROM anon;
REVOKE ALL PRIVILEGES ON public."Question"       FROM anon;
REVOKE ALL PRIVILEGES ON public."Answer"         FROM anon;
REVOKE ALL PRIVILEGES ON public."ColumnPost"     FROM anon;
REVOKE ALL PRIVILEGES ON public.page_views       FROM anon;
REVOKE ALL PRIVILEGES ON public.gmfsns_org_edits FROM anon;


-- ──────────────────────────────────────────────────────────
-- SECTION 4. authenticated 역할 — 모든 테이블 권한 REVOKE
--   로그인 사용자도 REST API 직접 접근 차단
--   (모든 접근은 Next.js API Route → Prisma 경유)
-- ──────────────────────────────────────────────────────────
REVOKE ALL PRIVILEGES ON public."User"           FROM authenticated;
REVOKE ALL PRIVILEGES ON public."Account"        FROM authenticated;
REVOKE ALL PRIVILEGES ON public."Session"        FROM authenticated;
REVOKE ALL PRIVILEGES ON public."Organization"   FROM authenticated;
REVOKE ALL PRIVILEGES ON public."Category"       FROM authenticated;
REVOKE ALL PRIVILEGES ON public."Post"           FROM authenticated;
REVOKE ALL PRIVILEGES ON public."Resource"       FROM authenticated;
REVOKE ALL PRIVILEGES ON public."Event"          FROM authenticated;
REVOKE ALL PRIVILEGES ON public."EventAttendee"  FROM authenticated;
REVOKE ALL PRIVILEGES ON public."Story"          FROM authenticated;
REVOKE ALL PRIVILEGES ON public."ForumArchive"   FROM authenticated;
REVOKE ALL PRIVILEGES ON public."ForumMaterial"  FROM authenticated;
REVOKE ALL PRIVILEGES ON public."ForumSchedule"  FROM authenticated;
REVOKE ALL PRIVILEGES ON public."Popup"          FROM authenticated;
REVOKE ALL PRIVILEGES ON public."Leader"         FROM authenticated;
REVOKE ALL PRIVILEGES ON public."Question"       FROM authenticated;
REVOKE ALL PRIVILEGES ON public."Answer"         FROM authenticated;
REVOKE ALL PRIVILEGES ON public."ColumnPost"     FROM authenticated;
REVOKE ALL PRIVILEGES ON public.page_views       FROM authenticated;
REVOKE ALL PRIVILEGES ON public.gmfsns_org_edits FROM authenticated;


-- ──────────────────────────────────────────────────────────
-- SECTION 5. service_role 역할 — 전체 권한 GRANT
--   서버 사이드 Storage 업로드, gmfsns import API 에서 사용
--   service_role 은 BYPASSRLS 속성이 있어 RLS 를 우회합니다.
-- ──────────────────────────────────────────────────────────
GRANT ALL PRIVILEGES ON public."User"           TO service_role;
GRANT ALL PRIVILEGES ON public."Account"        TO service_role;
GRANT ALL PRIVILEGES ON public."Session"        TO service_role;
GRANT ALL PRIVILEGES ON public."Organization"   TO service_role;
GRANT ALL PRIVILEGES ON public."Category"       TO service_role;
GRANT ALL PRIVILEGES ON public."Post"           TO service_role;
GRANT ALL PRIVILEGES ON public."Resource"       TO service_role;
GRANT ALL PRIVILEGES ON public."Event"          TO service_role;
GRANT ALL PRIVILEGES ON public."EventAttendee"  TO service_role;
GRANT ALL PRIVILEGES ON public."Story"          TO service_role;
GRANT ALL PRIVILEGES ON public."ForumArchive"   TO service_role;
GRANT ALL PRIVILEGES ON public."ForumMaterial"  TO service_role;
GRANT ALL PRIVILEGES ON public."ForumSchedule"  TO service_role;
GRANT ALL PRIVILEGES ON public."Popup"          TO service_role;
GRANT ALL PRIVILEGES ON public."Leader"         TO service_role;
GRANT ALL PRIVILEGES ON public."Question"       TO service_role;
GRANT ALL PRIVILEGES ON public."Answer"         TO service_role;
GRANT ALL PRIVILEGES ON public."ColumnPost"     TO service_role;
GRANT ALL PRIVILEGES ON public.page_views       TO service_role;
GRANT ALL PRIVILEGES ON public.gmfsns_org_edits TO service_role;

-- Sequence 접근 권한 (IDENTITY / SERIAL 컬럼)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;


-- ──────────────────────────────────────────────────────────
-- SECTION 6. RLS 정책 — anon / authenticated 명시적 DENY
--   RLS 가 활성화된 테이블은 정책이 없으면 기본 거부됩니다.
--   아래 정책은 명시적 기록용입니다 (기본 거부를 중복 표현).
-- ──────────────────────────────────────────────────────────

-- 기존 정책 제거 (재실행 안전)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname IN ('kima_deny_anon', 'kima_deny_authenticated')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename);
  END LOOP;
END
$$;


-- User: 비밀번호 해시, OAuth 토큰 등 최고 민감 데이터
CREATE POLICY kima_deny_anon
  ON public."User" AS RESTRICTIVE FOR ALL TO anon
  USING (false);

CREATE POLICY kima_deny_authenticated
  ON public."User" AS RESTRICTIVE FOR ALL TO authenticated
  USING (false);


-- Account: OAuth access_token / refresh_token
CREATE POLICY kima_deny_anon
  ON public."Account" AS RESTRICTIVE FOR ALL TO anon
  USING (false);

CREATE POLICY kima_deny_authenticated
  ON public."Account" AS RESTRICTIVE FOR ALL TO authenticated
  USING (false);


-- Session: 세션 토큰
CREATE POLICY kima_deny_anon
  ON public."Session" AS RESTRICTIVE FOR ALL TO anon
  USING (false);

CREATE POLICY kima_deny_authenticated
  ON public."Session" AS RESTRICTIVE FOR ALL TO authenticated
  USING (false);


-- Organization
CREATE POLICY kima_deny_anon
  ON public."Organization" AS RESTRICTIVE FOR ALL TO anon
  USING (false);

CREATE POLICY kima_deny_authenticated
  ON public."Organization" AS RESTRICTIVE FOR ALL TO authenticated
  USING (false);


-- Category
CREATE POLICY kima_deny_anon
  ON public."Category" AS RESTRICTIVE FOR ALL TO anon
  USING (false);

CREATE POLICY kima_deny_authenticated
  ON public."Category" AS RESTRICTIVE FOR ALL TO authenticated
  USING (false);


-- Post
CREATE POLICY kima_deny_anon
  ON public."Post" AS RESTRICTIVE FOR ALL TO anon
  USING (false);

CREATE POLICY kima_deny_authenticated
  ON public."Post" AS RESTRICTIVE FOR ALL TO authenticated
  USING (false);


-- Resource
CREATE POLICY kima_deny_anon
  ON public."Resource" AS RESTRICTIVE FOR ALL TO anon
  USING (false);

CREATE POLICY kima_deny_authenticated
  ON public."Resource" AS RESTRICTIVE FOR ALL TO authenticated
  USING (false);


-- Event
CREATE POLICY kima_deny_anon
  ON public."Event" AS RESTRICTIVE FOR ALL TO anon
  USING (false);

CREATE POLICY kima_deny_authenticated
  ON public."Event" AS RESTRICTIVE FOR ALL TO authenticated
  USING (false);


-- EventAttendee: 참석자 개인정보
CREATE POLICY kima_deny_anon
  ON public."EventAttendee" AS RESTRICTIVE FOR ALL TO anon
  USING (false);

CREATE POLICY kima_deny_authenticated
  ON public."EventAttendee" AS RESTRICTIVE FOR ALL TO authenticated
  USING (false);


-- Story
CREATE POLICY kima_deny_anon
  ON public."Story" AS RESTRICTIVE FOR ALL TO anon
  USING (false);

CREATE POLICY kima_deny_authenticated
  ON public."Story" AS RESTRICTIVE FOR ALL TO authenticated
  USING (false);


-- ForumArchive
CREATE POLICY kima_deny_anon
  ON public."ForumArchive" AS RESTRICTIVE FOR ALL TO anon
  USING (false);

CREATE POLICY kima_deny_authenticated
  ON public."ForumArchive" AS RESTRICTIVE FOR ALL TO authenticated
  USING (false);


-- ForumMaterial
CREATE POLICY kima_deny_anon
  ON public."ForumMaterial" AS RESTRICTIVE FOR ALL TO anon
  USING (false);

CREATE POLICY kima_deny_authenticated
  ON public."ForumMaterial" AS RESTRICTIVE FOR ALL TO authenticated
  USING (false);


-- ForumSchedule
CREATE POLICY kima_deny_anon
  ON public."ForumSchedule" AS RESTRICTIVE FOR ALL TO anon
  USING (false);

CREATE POLICY kima_deny_authenticated
  ON public."ForumSchedule" AS RESTRICTIVE FOR ALL TO authenticated
  USING (false);


-- Popup
CREATE POLICY kima_deny_anon
  ON public."Popup" AS RESTRICTIVE FOR ALL TO anon
  USING (false);

CREATE POLICY kima_deny_authenticated
  ON public."Popup" AS RESTRICTIVE FOR ALL TO authenticated
  USING (false);


-- Leader
CREATE POLICY kima_deny_anon
  ON public."Leader" AS RESTRICTIVE FOR ALL TO anon
  USING (false);

CREATE POLICY kima_deny_authenticated
  ON public."Leader" AS RESTRICTIVE FOR ALL TO authenticated
  USING (false);


-- Question
CREATE POLICY kima_deny_anon
  ON public."Question" AS RESTRICTIVE FOR ALL TO anon
  USING (false);

CREATE POLICY kima_deny_authenticated
  ON public."Question" AS RESTRICTIVE FOR ALL TO authenticated
  USING (false);


-- Answer
CREATE POLICY kima_deny_anon
  ON public."Answer" AS RESTRICTIVE FOR ALL TO anon
  USING (false);

CREATE POLICY kima_deny_authenticated
  ON public."Answer" AS RESTRICTIVE FOR ALL TO authenticated
  USING (false);


-- ColumnPost
CREATE POLICY kima_deny_anon
  ON public."ColumnPost" AS RESTRICTIVE FOR ALL TO anon
  USING (false);

CREATE POLICY kima_deny_authenticated
  ON public."ColumnPost" AS RESTRICTIVE FOR ALL TO authenticated
  USING (false);


-- page_views (분석 전용, 서버 사이드 쓰기만 허용)
CREATE POLICY kima_deny_anon
  ON public.page_views AS RESTRICTIVE FOR ALL TO anon
  USING (false);

CREATE POLICY kima_deny_authenticated
  ON public.page_views AS RESTRICTIVE FOR ALL TO authenticated
  USING (false);


-- gmfsns_org_edits (service_role 으로만 접근)
CREATE POLICY kima_deny_anon
  ON public.gmfsns_org_edits AS RESTRICTIVE FOR ALL TO anon
  USING (false);

CREATE POLICY kima_deny_authenticated
  ON public.gmfsns_org_edits AS RESTRICTIVE FOR ALL TO authenticated
  USING (false);


-- ──────────────────────────────────────────────────────────
-- SECTION 7. Storage 버킷 권한 안내 (SQL 아님 — 대시보드 설정)
-- ──────────────────────────────────────────────────────────
-- 아래 버킷은 Supabase 대시보드 > Storage > Policies 에서 설정하세요.
--
-- 버킷 목록 및 정책:
--   kima-media  : public (읽기), OFFICER/ADMIN 만 업로드
--   forum-files : public (읽기), OFFICER/ADMIN 만 업로드
--   popups      : public (읽기), ADMIN 만 업로드
--   org-images  : public (읽기), MEMBER 이상 업로드
--
-- 모든 업로드는 서버 API Route 에서 SUPABASE_SERVICE_ROLE_KEY 로 처리합니다.
-- 브라우저에서 직접 업로드하지 않으므로 Storage RLS 정책은 읽기 허용만 설정하면 됩니다.
--
-- 버킷 공개 읽기 정책 예시 (대시보드에서 설정 또는 아래 SQL 실행):
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES
--   ('kima-media',  'kima-media',  true),
--   ('forum-files', 'forum-files', true),
--   ('popups',      'popups',      true),
--   ('org-images',  'org-images',  true)
-- ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
-- ============================================================
