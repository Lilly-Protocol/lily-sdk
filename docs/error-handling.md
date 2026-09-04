# Error Handling Guide

The Lily SDK provides a strongly typed error hierarchy rooted in `LilySdkError` for granular exception handling and structured error inspection.

## Error Hierarchy

```
LilySdkError (base)
├── LilyConfigError             — client configuration failure (bad URL, missing required credentials)
├── LilyTransportError          — network-level failures (timeouts, DNS lookup, connection refused)
├── LilyValidationError         — client-side validation errors (invalid params, malformed schemas)
├── LilyAuthenticationError     — authentication failure (401 Unauthorized)
│   └── LilyAuthorizationError  — insufficient permissions (403 Forbidden)
└── LilyApiError                — HTTP error responses (4xx/5xx)
    ├── LilyNotFoundError       — resource does not exist (404 Not Found)
    ├── LilyConflictError       — state or optimistic concurrency conflict (409 Conflict)
    ├── LilyRateLimitError      — rate limit exceeded (429 Too Many Requests, exposes retryAfterSeconds)
    └── LilyServerError         — unexpected upstream failure (5xx Internal Server Error)
```

## Catching by Type

Every error thrown by SDK client operations extends `LilySdkError` and exposes typed properties:
- `message`: Human-readable error description
- `code`: Structured string error code from `LILY_ERROR_CODES` (e.g. `'RATE_LIMITED'`, `'NOT_FOUND'`)
- `statusCode`: HTTP status code when available (e.g. `404`, `429`)
- `details`: Underlying API error payload details
- `request`: Metadata about the failing request (`method`, `path`, `url`)

```typescript
import {
  LilySdk,
  LilyConfigError,
  LilyAuthenticationError,
  LilyAuthorizationError,
  LilyNotFoundError,
  LilyRateLimitError,
  LilyServerError,
  LilyApiError,
  LilyTransportError,
  LilyValidationError,
} from '@lily-protocol/sdk';

const sdk = LilySdk.create();

try {
  const payment = await sdk.payments.get('pay_123');
} catch (error) {
  if (error instanceof LilyConfigError) {
    console.error('Configuration error:', error.message);
  } else if (error instanceof LilyValidationError) {
    console.error('Validation error:', error.message, error.details);
  } else if (error instanceof LilyAuthenticationError) {
    console.error('Auth error (401):', error.message);
  } else if (error instanceof LilyAuthorizationError) {
    console.error('Forbidden (403):', error.message);
  } else if (error instanceof LilyNotFoundError) {
    console.error('Payment not found (404):', error.message);
  } else if (error instanceof LilyRateLimitError) {
    console.warn(`Rate limited (429). Retry after ${error.retryAfterSeconds}s`);
  } else if (error instanceof LilyServerError) {
    console.error('Server error (5xx):', error.statusCode, error.message);
  } else if (error instanceof LilyApiError) {
    console.error('API error:', error.statusCode, error.message);
  } else if (error instanceof LilyTransportError) {
    console.error('Network transport error:', error.message);
  } else {
    throw error;
  }
}
```

## Type Guard

Use `isLilySdkError` to safely narrow unknown caught errors:

```typescript
import { LilySdk, isLilySdkError } from '@lily-protocol/sdk';

const sdk = LilySdk.create();

try {
  await sdk.payments.create({ amount: '10.00', currency: 'USD' });
} catch (error) {
  if (isLilySdkError(error)) {
    console.error('SDK error:', error.code, error.statusCode, error.message);
    if (error.request) {
      console.error(`Failed ${error.request.method} ${error.request.path}`);
    }
  } else {
    console.error('Unexpected non-SDK error:', error);
  }
}
```
