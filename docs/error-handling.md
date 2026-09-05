# Error Handling Guide

Lily SDK provides a typed error hierarchy for granular catch blocks.

## Error Hierarchy

```
LilySdkError (base)
├── LilyConfigError          — invalid configuration (bad baseUrl, missing apiKey)
├── LilyTransportError       — network-level failures (timeout, DNS, connection)
├── LilyAuthenticationError  — auth failures (401/403); base for subclasses below
│   └── LilyAuthorizationError — explicit 403 authorization denial
└── LilyApiError             — API returned an error response (4xx/5xx)
    ├── LilyValidationError      — 400 (request validation failure)
    ├── LilyNotFoundError        — 404 (resource not found)
    ├── LilyConflictError        — 409 (resource conflict)
    ├── LilyRateLimitError       — 429 (rate limited; has retryAfterSeconds)
    └── LilyServerError          — 5xx (server-side failure)
```

## Catching by Type

```typescript
import {
  LilySdk,
  isLilySdkError,
  LilyApiError,
  LilyTransportError,
  LilyConfigError,
  LilyAuthenticationError,
} from '@lily-protocol/sdk';

try {
  const payment = await sdk.payments.get('pay_123');
} catch (error) {
  if (error instanceof LilyConfigError) {
    console.error('Config error:', error.message);
  } else if (error instanceof LilyAuthenticationError) {
    console.error('Auth error:', error.message);
  } else if (error instanceof LilyApiError) {
    console.error('API error:', error.statusCode, error.message);
  } else if (error instanceof LilyTransportError) {
    console.error('Transport error:', error.message);
  } else {
    throw error;
  }
}
```

## Type Guard

```typescript
import { isLilySdkError } from '@lily-protocol/sdk';

try {
  await sdk.payments.create({ amount: '10.00', currency: 'USD' });
} catch (error) {
  if (isLilySdkError(error)) {
    console.error('SDK error:', error.code, error.message);
  }
}
```
