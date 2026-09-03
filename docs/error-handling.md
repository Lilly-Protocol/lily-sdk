# Error Handling Guide

Lily SDK provides a typed error hierarchy for granular catch blocks.

## Error Hierarchy

```
LilySdkError (base)
├── LilyConfigError      — invalid configuration (bad baseUrl, missing apiKey)
├── LilyTransportError   — network-level failures (timeout, DNS, connection)
└── LilyApiError         — API returned an error response (4xx/5xx)
    ├── LilyAuthenticationError — 401/403 (bad/missing credentials)
    └── LilyRateLimitError       — 429 (rate limited)
```

## Catching by Type

```typescript
import { LilySdk, isLilySdkError, LilyApiError, LilyTransportError, LilyConfigError } from 'lily-sdk';

try {
  const payment = await sdk.payments.get('pay_123');
} catch (error) {
  if (error instanceof LilyConfigError) {
    console.error('Config error:', error.message);
  } else if (error instanceof LilyAuthenticationError) {
    console.error('Auth error:', error.message);
  } else if (error instanceof LilyApiError) {
    console.error('API error:', error.status, error.message);
  } else if (error instanceof LilyTransportError) {
    console.error('Transport error:', error.message);
  } else {
    throw error;
  }
}
```

## Type Guard

```typescript
import { isLilySdkError } from 'lily-sdk';

try {
  await sdk.payments.create({ amount: '10.00', currency: 'USD' });
} catch (error) {
  if (isLilySdkError(error)) {
    console.error('SDK error:', error.code, error.message);
  }
}
```
