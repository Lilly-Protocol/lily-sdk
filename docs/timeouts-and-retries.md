# Timeouts and Retries

## Timeout Configuration

```typescript
const sdk = new LilySdk({
  baseUrl: 'https://api.lily.io',
  apiKey: 'lk_live_xxx',
  timeoutMs: 5000,
});
```

Per-request override:

```typescript
await sdk.payments.get('pay_123', { timeoutMs: 1000 });
```

## Retry Configuration

```typescript
const sdk = new LilySdk({
  baseUrl: 'https://api.lily.io',
  apiKey: 'lk_live_xxx',
  retry: {
    retries: 3,
    retryDelayMs: 500,
    retryableStatusCodes: [429, 500, 502, 503, 504],
  },
});
```

## Retry-After Header

When the server returns a `Retry-After` header (on 429 or 503), the SDK honors it.

## Disabling Retries

```typescript
const sdk = new LilySdk({
  baseUrl: 'https://api.lily.io',
  retry: { retries: 0, retryableStatusCodes: [] },
});
```
