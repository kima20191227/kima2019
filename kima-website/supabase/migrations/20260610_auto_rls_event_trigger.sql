-- ============================================================
-- KIMA 2019 — 신규 테이블 RLS 자동 적용 Event Trigger
-- 작성: 2026-06-10
--
-- 동작:
--   public 스키마에 새 테이블이 CREATE TABLE 될 때마다
--   자동으로 아래를 실행합니다:
--     1. RLS 활성화
--     2. anon / authenticated 권한 제거
--     3. service_role 전체 권한 부여
--     4. RESTRICTIVE DENY 정책 생성
--
-- 효과:
--   prisma db push 로 테이블이 추가될 때마다 별도 SQL 실행 불필요.
--
-- 실행 방법:
--   Supabase 대시보드 → SQL Editor → 전체 붙여넣기 → Run
--   (1회만 실행하면 이후 영구 적용)
-- ============================================================


-- ──────────────────────────────────────────────────────────
-- 1. Event Trigger 함수
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.kima_auto_rls_on_create_table()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tbl_name TEXT;
BEGIN
  -- CREATE TABLE 이벤트 중 public 스키마 대상만 처리
  SELECT c.relname INTO tbl_name
  FROM pg_event_trigger_ddl_commands() e
  JOIN pg_class c ON c.oid = e.objid
  WHERE e.command_tag = 'CREATE TABLE'
    AND e.schema_name  = 'public'
    AND e.object_type  = 'table'
  LIMIT 1;

  IF tbl_name IS NULL THEN
    RETURN;
  END IF;

  -- RLS 활성화
  EXECUTE format(
    'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
    tbl_name
  );

  -- anon / authenticated 권한 제거
  EXECUTE format('REVOKE ALL PRIVILEGES ON public.%I FROM anon',          tbl_name);
  EXECUTE format('REVOKE ALL PRIVILEGES ON public.%I FROM authenticated', tbl_name);

  -- service_role 전체 권한 부여
  EXECUTE format('GRANT ALL PRIVILEGES ON public.%I TO service_role', tbl_name);

  -- 기존 DENY 정책 제거 후 재생성
  EXECUTE format('DROP POLICY IF EXISTS kima_deny_anon          ON public.%I', tbl_name);
  EXECUTE format('DROP POLICY IF EXISTS kima_deny_authenticated ON public.%I', tbl_name);

  EXECUTE format(
    'CREATE POLICY kima_deny_anon
       ON public.%I AS RESTRICTIVE FOR ALL TO anon
       USING (false)',
    tbl_name
  );
  EXECUTE format(
    'CREATE POLICY kima_deny_authenticated
       ON public.%I AS RESTRICTIVE FOR ALL TO authenticated
       USING (false)',
    tbl_name
  );

  RAISE NOTICE '[KIMA] Auto RLS applied → public.%', tbl_name;
END;
$$;


-- ──────────────────────────────────────────────────────────
-- 2. Event Trigger 등록 (이미 존재하면 교체)
-- ──────────────────────────────────────────────────────────
DROP EVENT TRIGGER IF EXISTS kima_auto_rls_trigger;

CREATE EVENT TRIGGER kima_auto_rls_trigger
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE')
  EXECUTE FUNCTION public.kima_auto_rls_on_create_table();


-- ──────────────────────────────────────────────────────────
-- 3. 등록 확인 쿼리
-- ──────────────────────────────────────────────────────────
SELECT
  evtname        AS trigger_name,
  evtevent       AS event,
  evtenabled     AS enabled,
  evtfoid::regproc AS function
FROM pg_event_trigger
WHERE evtname = 'kima_auto_rls_trigger';
