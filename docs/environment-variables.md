# Environment Variables

The SDK reads a small, fixed set of environment variables. Anything else documented
historically (`LILY_TIMEOUT_MS`, `LILY_DEBUG`) is **not** implemented — do not rely on it.

## Supported variables

| Variable          | Purpose                        | Who reads it                                                    |
| ----------------- | ------------------------------ | --------------------------------------------------------------- |
| `LILY_API_URL`    | Primary API base URL           | `resolveLilySdkConfig` (constructor) **and** `LilySdk.create()` |
| `LILY_BASE_URL`   | Fallback API base URL          | **`LilySdk.create()` only** (when `LILY_API_URL` is unset)      |
| `LILY_API_KEY`    | API key → `x-api-key` header   | `resolveLilySdkConfig` (constructor) **and** `LilySdk.create()` |
| `LILY_AUTH_TOKEN` | Bearer token → `Authorization` | `resolveLilySdkConfig` (constructor) **and** `LilySdk.create()` |

Source of truth: `src/config/resolve-config.ts` and `LilySdk.create()` in `src/sdk.ts`.

## Entry points and `LILY_BASE_URL`

| Entry point                                    | Base URL sources (first match wins)                                                                       | Honors `LILY_BASE_URL`? |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------- |
| `new LilySdk(config)` / `resolveLilySdkConfig` | `config.baseUrl` → `process.env.LILY_API_URL` → **throws** if neither is set                              | No                      |
| `LilySdk.create(options)`                      | `options.baseUrl` → `LILY_API_URL` → `LILY_BASE_URL` → `DEFAULT_API_URL` (`https://api.lilyprotocol.com`) | **Yes** (fallback only) |

Prefer `LILY_API_URL` in new setups. Keep `LILY_BASE_URL` only if you already depend on
`LilySdk.create()` picking it up as a fallback.

## Precedence

| Setting     | Resolution order                                                                                                                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Base URL    | Explicit `baseUrl` option → `LILY_API_URL` → (`LILY_BASE_URL` **only** in `LilySdk.create()`) → for `create()` only, `DEFAULT_API_URL`                                                                                                                       |
| Credentials | Explicit `apiKey` / `authToken` → `LILY_API_KEY` / `LILY_AUTH_TOKEN`                                                                                                                                                                                         |
| Timeout     | **Not** an environment variable. Set `timeoutMs` on `LilySdkConfig` (constructor / `withConfig`). Default: `10000` ms. Per-request timeouts belong on the request options object where supported — see [timeouts-and-retries.md](./timeouts-and-retries.md). |

Explicit code options always beat environment variables.

## Not supported

| Variable          | Status                                      |
| ----------------- | ------------------------------------------- |
| `LILY_TIMEOUT_MS` | Never read; use `timeoutMs` in config       |
| `LILY_DEBUG`      | Never read; no env-driven debug flag exists |

## Usage

```bash
export LILY_API_URL=https://api.lilyprotocol.com
export LILY_API_KEY=lk_live_xxx
# optional:
# export LILY_AUTH_TOKEN=eyJhbGciOi...
```

```typescript
import { LilySdk } from '@lily-protocol/sdk';

// Reads LILY_API_URL (or LILY_BASE_URL), LILY_API_KEY, LILY_AUTH_TOKEN
const sdk = LilySdk.create();
```

Constructor path (no `LILY_BASE_URL`, no default URL — `baseUrl` or `LILY_API_URL` required):

```typescript
const sdk = new LilySdk({
  // baseUrl omitted → falls back to LILY_API_URL only
  timeoutMs: 15_000,
});
```
