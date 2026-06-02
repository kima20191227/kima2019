# Resource upload body limit investigation

Date: 2026-06-02

Symptom:
- A 20MB file upload from `/community/language/nepal` caused the production site to show a Next.js client-side exception page.
- The UI had been updated to say 100MB files were allowed, but uploads still failed below that size.

Root cause:
- The 100MB validation existed in application code, but browser uploads were still sent as multipart bodies to `/api/upload/resource`.
- In production, the deployment platform can reject or fail large request bodies before the route handler reaches the app-level 100MB check.
- `ResourceUploadForm` also parsed failed upload responses as JSON without a catch, so non-JSON error pages could propagate as an uncaught client exception.

Fix:
- Added `/api/upload/resource/signed` to issue Google Drive resumable upload session URLs after auth, MIME, and size validation.
- Added `/api/upload/resource/drive-finalize` to set the uploaded Drive file to public reader and return the Drive link.
- Updated `uploadResourceFile()` so browser uploads go directly to Google Drive instead of through the Next.js route body.
- Routed community resource, photo, and category flag uploads through the common upload client.
- Added a policy regression test for the 100MB limit and MIME inference.

Evidence:
- `npx vitest run tests/unit/utils/resourceUploadPolicy.test.ts` passed.
- `npx tsc --noEmit` passed.
- `npm run build` passed and included `/api/upload/resource/signed` and `/api/upload/resource/drive-finalize`.

Status: DONE_WITH_CONCERNS

Remaining verification:
- Production should be tested with an authenticated 20MB file upload after deployment, because local tests cannot exercise Google Drive resumable upload CORS behavior or the service account's folder permissions.
