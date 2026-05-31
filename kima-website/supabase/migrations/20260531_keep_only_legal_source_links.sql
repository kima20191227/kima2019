-- Keep only official source-link sections on legal detail pages.
-- Legal disclaimers are rendered by the app, so non-source guide sections can be removed.

DO $$
BEGIN
  IF to_regclass('public."LegalDocumentSection"') IS NULL THEN
    RAISE NOTICE 'LegalDocumentSection table does not exist yet. Skipping cleanup.';
    RETURN;
  END IF;

  DELETE FROM public."LegalDocumentSection"
  WHERE "type" <> 'SOURCE_LINKS';

  UPDATE public."LegalDocumentSection"
  SET "accessLevel" = 'PUBLIC',
      "order" = 0
  WHERE "type" = 'SOURCE_LINKS';
END
$$;
