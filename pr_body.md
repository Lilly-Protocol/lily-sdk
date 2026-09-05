## Summary

Fixes 4 failing tests in `tests/request-timeout-validation.test.ts`.

### Root cause

Mock `Response` objects were missing `Content-Type: application/json` headers. The `parseResponse()` function checks this header to decide between `response.json()` and `response.text()`. Without it, all mocks fell through to `text()`, returning the string `"{}"` instead of parsed JSON objects.

### Fix

Added `Content-Type: application/json` header to all mock Response objects that expect JSON parsing.

### Verification

- `npx vitest run tests/request-timeout-validation.test.ts` — 23 passed
- `npm run lint` — clean
- `npm run typecheck` — clean
- `npx prettier --check` — clean
