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

| Variable          | Description                                                                 | Precedence / Notes |
| ----------------- | --------------------------------------------------------------------------- | ------------------ |
| `LILY_API_URL`    | Primary API base URL                                                       | Highest precedence across constructor and `LilySdk.create()` |
| `LILY_BASE_URL`   | Fallback API base URL                                                      | Honored as fallback by `LilySdk.create()` |
| `LILY_API_KEY`    | API key for header-based authentication                                    | Populates `config.apiKey` |
| `LILY_AUTH_TOKEN` | Bearer token for authorization header authentication                        | Populates `config.authToken` |

> [!NOTE]
> `timeoutMs` is configured programmatically via `LilySdkConfig` options (default: `10000` ms) or per-request overrides; the SDK does not read timeout or debug settings from environment variables (`LILY_TIMEOUT_MS` and `LILY_DEBUG` are not supported).

## Precedence

1. **Base URL**: Explicit `baseUrl` option passed in configuration > `LILY_API_URL` > `LILY_BASE_URL` (in `LilySdk.create()`) > Default (`https://api.lilyprotocol.dev`).
2. **Credentials**: Explicit `apiKey` or `authToken` option > `LILY_API_KEY` or `LILY_AUTH_TOKEN` environment variables.

## Quickstart Usage

### Quickstart with Environment Variables

Set environment variables in your environment:

```bash
export LILY_API_URL=https://api.lilyprotocol.com
export LILY_API_KEY=lk_live_xxx
# optional:
# export LILY_AUTH_TOKEN=eyJhbGciOi...
```

Initialize the SDK without passing explicit arguments:

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
