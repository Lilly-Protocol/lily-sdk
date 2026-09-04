# Environment Variables

The SDK automatically discovers credentials and endpoints from environment variables in Node.js environments.

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

```bash
export LILY_API_URL=https://api.lilyprotocol.dev
export LILY_API_KEY=lk_live_xxx
```

```typescript
import { LilySdk } from '@lily-protocol/sdk';

// Automatically reads LILY_API_URL and LILY_API_KEY from process.env
const sdk = LilySdk.create();
```

To configure custom timeouts or retry behavior, pass them directly in configuration:

```typescript
const sdk = new LilySdk({
  apiKey: process.env.LILY_API_KEY,
  timeoutMs: 15_000,
});
```
