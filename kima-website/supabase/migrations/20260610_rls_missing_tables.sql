-- ============================================================
-- KIMA 2019 — 누락된 테이블 RLS 보완 (안전 버전)
-- 작성: 2026-06-10
--
-- 각 테이블은 존재 여부를 먼저 확인 후 RLS를 적용합니다.
-- 아직 생성되지 않은 테이블은 NOTICE만 출력하고 건너뜁니다.
--
-- 실행 방법:
--   Supabase 대시보드 → SQL Editor → 전체 붙여넣기 → Run
-- ============================================================


DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'DevicePushToken',
    'EmailLog',
    'EmailLogRecipient',
    'NewsCategoryConfig',
    'News',
    'NewsSource',
    'NewsSettings',
    'LegalDocument',
    'LegalSource',
    'LegalDocumentSection'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF to_regclass('public."' || t || '"') IS NULL THEN
      RAISE NOTICE 'Table % does not exist yet — skipping.', t;
      CONTINUE;
    END IF;

    -- RLS 활성화
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- anon / authenticated 권한 제거
    EXECUTE format('REVOKE ALL PRIVILEGES ON public.%I FROM anon', t);
    EXECUTE format('REVOKE ALL PRIVILEGES ON public.%I FROM authenticated', t);

    -- service_role 전체 권한 부여
    EXECUTE format('GRANT ALL PRIVILEGES ON public.%I TO service_role', t);

    -- 기존 DENY 정책 제거 (재실행 안전)
    EXECUTE format('DROP POLICY IF EXISTS kima_deny_anon ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS kima_deny_authenticated ON public.%I', t);

    -- RESTRICTIVE DENY 정책 생성
    EXECUTE format(
      'CREATE POLICY kima_deny_anon ON public.%I AS RESTRICTIVE FOR ALL TO anon USING (false)',
      t
    );
    EXECUTE format(
      'CREATE POLICY kima_deny_authenticated ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (false)',
      t
    );

    RAISE NOTICE 'RLS applied to table: %', t;
  END LOOP;
END
$$;


-- ──────────────────────────────────────────────────────────
-- 검증 쿼리 — 실행 후 존재하는 테이블은 모두 rls_enabled = true 확인
-- ──────────────────────────────────────────────────────────
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
