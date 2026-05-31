-- KIMA legal documents RLS/grants.
-- Run after the Prisma LegalDocument and LegalDocumentSection tables have been created.

DO $$
BEGIN
  IF to_regclass('public."LegalDocument"') IS NULL THEN
    RAISE NOTICE 'LegalDocument table does not exist yet. Skipping legal document RLS setup.';
    RETURN;
  END IF;

  ALTER TABLE public."LegalDocument" ENABLE ROW LEVEL SECURITY;

  REVOKE ALL PRIVILEGES ON public."LegalDocument" FROM anon;
  REVOKE ALL PRIVILEGES ON public."LegalDocument" FROM authenticated;

  GRANT ALL PRIVILEGES ON public."LegalDocument" TO service_role;

  DROP POLICY IF EXISTS kima_deny_anon ON public."LegalDocument";
  DROP POLICY IF EXISTS kima_deny_authenticated ON public."LegalDocument";

  CREATE POLICY kima_deny_anon
    ON public."LegalDocument" AS RESTRICTIVE FOR ALL TO anon
    USING (false);

  CREATE POLICY kima_deny_authenticated
    ON public."LegalDocument" AS RESTRICTIVE FOR ALL TO authenticated
    USING (false);
END
$$;

DO $$
BEGIN
  IF to_regclass('public."LegalSource"') IS NULL THEN
    RAISE NOTICE 'LegalSource table does not exist yet. Skipping legal source RLS setup.';
    RETURN;
  END IF;

  ALTER TABLE public."LegalSource" ENABLE ROW LEVEL SECURITY;

  REVOKE ALL PRIVILEGES ON public."LegalSource" FROM anon;
  REVOKE ALL PRIVILEGES ON public."LegalSource" FROM authenticated;

  GRANT ALL PRIVILEGES ON public."LegalSource" TO service_role;

  DROP POLICY IF EXISTS kima_deny_anon ON public."LegalSource";
  DROP POLICY IF EXISTS kima_deny_authenticated ON public."LegalSource";

  CREATE POLICY kima_deny_anon
    ON public."LegalSource" AS RESTRICTIVE FOR ALL TO anon
    USING (false);

  CREATE POLICY kima_deny_authenticated
    ON public."LegalSource" AS RESTRICTIVE FOR ALL TO authenticated
    USING (false);
END
$$;

DO $$
BEGIN
  IF to_regclass('public."LegalDocumentSection"') IS NULL THEN
    RAISE NOTICE 'LegalDocumentSection table does not exist yet. Skipping legal document section RLS setup.';
    RETURN;
  END IF;

  ALTER TABLE public."LegalDocumentSection" ENABLE ROW LEVEL SECURITY;

  REVOKE ALL PRIVILEGES ON public."LegalDocumentSection" FROM anon;
  REVOKE ALL PRIVILEGES ON public."LegalDocumentSection" FROM authenticated;

  GRANT ALL PRIVILEGES ON public."LegalDocumentSection" TO service_role;

  DROP POLICY IF EXISTS kima_deny_anon ON public."LegalDocumentSection";
  DROP POLICY IF EXISTS kima_deny_authenticated ON public."LegalDocumentSection";

  CREATE POLICY kima_deny_anon
    ON public."LegalDocumentSection" AS RESTRICTIVE FOR ALL TO anon
    USING (false);

  CREATE POLICY kima_deny_authenticated
    ON public."LegalDocumentSection" AS RESTRICTIVE FOR ALL TO authenticated
    USING (false);
END
$$;
