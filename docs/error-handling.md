# Error Handling Guide

Lily SDK provides a typed error hierarchy for granular catch blocks.

## Error Hierarchy

```
LilySdkError (base)
├── LilyConfigError        — invalid configuration (bad baseUrl, missing apiKey)
├── LilyTransportError     — network-level failures (timeout, DNS, connection)
├── LilyAuthenticationError — 401/403 (bad/missing credentials)
│   └── LilyAuthorizationError — 403 (forbidden / insufficient permissions)
├── LilyValidationError    — request/response validation failures
└── LilyApiError           — API returned an error response (4xx/5xx)
    ├── LilyNotFoundError  — 404
    ├── LilyConflictError  — 409
    ├── LilyServerError    — 5xx
    └── LilyRateLimitError — 429 (rate limited)
```

## Catching by Type

```typescript
import {
  LilySdk,
  isLilySdkError,
  LilyApiError,
  LilyAuthenticationError,
  LilyAuthorizationError,
  LilyNotFoundError,
  LilyConflictError,
  LilyRateLimitError,
  LilyServerError,
  LilyValidationError,
  LilyTransportError,
  LilyConfigError,
} from '@lily-protocol/sdk';

try {
  const payment = await sdk.payments.get('pay_123');
} catch (error) {
  if (error instanceof LilyConfigError) {
    console.error('Config error:', error.message);
  } else if (error instanceof LilyAuthorizationError) {
    console.error('Authorization error:', error.statusCode, error.message);
  } else if (error instanceof LilyAuthenticationError) {
    console.error('Authentication error:', error.statusCode, error.message);
  } else if (error instanceof LilyNotFoundError) {
    console.error('Not found:', error.statusCode, error.message);
  } else if (error instanceof LilyConflictError) {
    console.error('Conflict:', error.statusCode, error.message);
  } else if (error instanceof LilyRateLimitError) {
    console.error('Rate limited:', error.statusCode, error.message);
  } else if (error instanceof LilyServerError) {
    console.error('Server error:', error.statusCode, error.message);
  } else if (error instanceof LilyApiError) {
    console.error('API error:', error.statusCode, error.message);
  } else if (error instanceof LilyValidationError) {
    console.error('Validation error:', error.message);
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
  await sdk.system.health();
} catch (error) {
  if (isLilySdkError(error)) {
    console.error('SDK error:', error.code, error.statusCode, error.message);
  }
}
```
