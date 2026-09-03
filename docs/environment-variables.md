# Environment Variables

The Lily SDK reads the following environment variables when configuration options are not explicitly provided in code.

## Supported Variables

| Variable          | Description                     | Default / Precedence                                                                                                                                                  |
| ----------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LILY_API_URL`    | Primary API base URL            | Primary URL source. Honored by `resolveLilySdkConfig` and `LilySdk.create()`. Falls back to `DEFAULT_API_URL` (`https://api.lilyprotocol.com`) in `LilySdk.create()`. |
| `LILY_BASE_URL`   | Fallback API base URL           | Honored only by `LilySdk.create()` when `LILY_API_URL` is not set (`LILY_API_URL ?? LILY_BASE_URL`).                                                                  |
| `LILY_API_KEY`    | API key for authentication      | Sent via `x-api-key` header when provided.                                                                                                                            |
| `LILY_AUTH_TOKEN` | Bearer token for authentication | Sent via `authorization: Bearer <token>` header when provided.                                                                                                        |

> **Note on Timeouts & Debugging**:  
> `timeoutMs` and other operational options (such as custom retry policies or fetch implementations) are not configured via environment variables. Configure SDK-wide defaults programmatically via `LilySdkConfig`. For a per-request timeout, set `timeoutMs` on the low-level `HttpRequest` passed to `sdk.request(...)` or `sdk.http.request(...)`; high-level client methods do not currently expose a per-call options bag.

## Precedence & Resolution

1. **Explicit configuration**: Options passed directly to `new LilySdk(config)` or `LilySdk.create(options)` always take precedence over environment variables.
2. **Base URL resolution**:
   - `LilySdk.create()` checks `options.baseUrl` -> `process.env.LILY_API_URL` -> `process.env.LILY_BASE_URL` -> `DEFAULT_API_URL` (`https://api.lilyprotocol.com`).
   - Direct constructor initialization `new LilySdk(config)` resolves `config.baseUrl` -> `process.env.LILY_API_URL`.
3. **Credentials**: `config.apiKey` / `config.authToken` override `LILY_API_KEY` and `LILY_AUTH_TOKEN`.

## Usage

### Quickstart with Environment Variables

Set environment variables in your environment:

```bash
export LILY_API_URL=https://api.lilyprotocol.com
export LILY_API_KEY=lk_live_xxx
```

Initialize the SDK without passing explicit arguments:

```typescript
import { LilySdk } from '@lily-protocol/sdk';

// Automatically resolves LILY_API_URL (or LILY_BASE_URL fallback) and LILY_API_KEY / LILY_AUTH_TOKEN
const sdk = LilySdk.create();
```
