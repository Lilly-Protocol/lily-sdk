# Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LILY_BASE_URL` | API base URL | Required |
| `LILY_API_KEY` | API key | — |
| `LILY_AUTH_TOKEN` | Bearer token | — |
| `LILY_TIMEOUT_MS` | Request timeout (ms) | `10000` |
| `LILY_DEBUG` | Enable debug logging | `false` |

## Usage

```bash
export LILY_BASE_URL=https://api.lily.io
export LILY_API_KEY=lk_live_xxx
```

```typescript
const sdk = LilySdk.create();
```
