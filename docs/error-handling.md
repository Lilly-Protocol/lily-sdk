# Error Handling Guide

Lily SDK provides a typed error hierarchy for granular catch blocks and robust error inspection.

## Error Hierarchy

All SDK errors extend `LilySdkError`. Catch blocks can target specific error types or inspect common error metadata such as `code`, `statusCode`, `details`, and `request`.

```
LilySdkError (base)
├── LilyConfigError         — invalid configuration (bad baseUrl, invalid timeout/retry config)
├── LilyTransportError      — network-level failures (timeout, DNS, connection drops)
├── LilyValidationError     — client-side validation failures before dispatch
├── LilyAuthenticationError — 401 Unauthorized (missing or invalid credentials)
│   └── LilyAuthorizationError — 403 Forbidden (insufficient permissions)
└── LilyApiError            — API returned an HTTP error response (4xx/5xx)
    ├── LilyNotFoundError   — 404 Not Found (resource does not exist)
    ├── LilyConflictError   — 409 Conflict (e.g. state conflict, concurrent modification)
    ├── LilyRateLimitError  — 429 Too Many Requests (rate limited; provides retryAfterSeconds)
    └── LilyServerError     — 5xx Server Error (internal server issues)
```

## Error Classes & Meaning

- `LilySdkError`: Root base class for all Lily SDK errors. Carries common properties: `code`, `statusCode`, `details`, and `request`.
- `LilyConfigError`: Raised when SDK configuration is invalid (e.g., missing API key, malformed `baseUrl`).
- `LilyTransportError`: Raised for network-level failures, DNS errors, connection drops, or request timeouts (`LILY_ERROR_CODES.TIMEOUT`).
- `LilyValidationError`: Raised when request parameters or payloads fail client-side validation prior to dispatch.
- `LilyAuthenticationError`: Extends `LilySdkError` (HTTP 401). Raised when API credentials are missing, malformed, or rejected.
- `LilyAuthorizationError`: Extends `LilyAuthenticationError` (HTTP 403). Raised when credentials are valid but lack permission for the requested action.
- `LilyApiError`: Extends `LilySdkError` (HTTP 4xx/5xx). Base class for API response errors.
- `LilyNotFoundError`: Extends `LilyApiError` (HTTP 404). Raised when a requested resource (wallet, payment, agent) does not exist.
- `LilyConflictError`: Extends `LilyApiError` (HTTP 409). Raised when a request conflicts with existing state.
- `LilyRateLimitError`: Extends `LilyApiError` (HTTP 429). Raised when API rate limits are exceeded; provides `retryAfterSeconds` when available.
- `LilyServerError`: Extends `LilyApiError` (HTTP 5xx). Raised when the remote server encounters internal errors.

## Catching by Type

```typescript
import {
  LilySdk,
  LilyConfigError,
  LilyTransportError,
  LilyValidationError,
  LilyAuthenticationError,
  LilyAuthorizationError,
  LilyNotFoundError,
  LilyConflictError,
  LilyRateLimitError,
  LilyServerError,
  LilyApiError,
} from '@lily-protocol/sdk';

const sdk = new LilySdk({
  apiKey: process.env.LILY_API_KEY,
  baseUrl: 'https://api.lilyprotocol.com',
});

try {
  const payment = await sdk.payments.get('pay_123');
  console.log('Payment retrieved:', payment.id);
} catch (error) {
  if (error instanceof LilyConfigError) {
    console.error('Config error:', error.message);
  } else if (error instanceof LilyValidationError) {
    console.error('Validation error:', error.message, error.details);
  } else if (error instanceof LilyAuthorizationError) {
    console.error('Authorization forbidden (403):', error.message);
  } else if (error instanceof LilyAuthenticationError) {
    console.error('Authentication failed (401):', error.message);
  } else if (error instanceof LilyNotFoundError) {
    console.error('Resource not found (404):', error.message);
  } else if (error instanceof LilyConflictError) {
    console.error('Resource conflict (409):', error.message);
  } else if (error instanceof LilyRateLimitError) {
    console.error(`Rate limited (429). Retry after ${error.retryAfterSeconds}s:`, error.message);
  } else if (error instanceof LilyServerError) {
    console.error(`Server error (${error.statusCode}):`, error.message);
  } else if (error instanceof LilyApiError) {
    console.error(`API error (${error.statusCode}):`, error.message);
  } else if (error instanceof LilyTransportError) {
    console.error('Transport error:', error.code, error.message);
  } else {
    throw error;
  }
}
```

## Type Guard & Common Properties

All SDK errors can be narrowed using `isLilySdkError`:

```typescript
import { isLilySdkError, LILY_ERROR_CODES } from '@lily-protocol/sdk';

try {
  await sdk.payments.create({
    amount: { assetCode: 'XLM', amount: '10.00', assetIssuer: undefined },
    destination: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  });
} catch (error) {
  if (isLilySdkError(error)) {
    console.error('Lily SDK Error:', {
      name: error.name,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      request: error.request,
    });

    if (error.code === LILY_ERROR_CODES.TIMEOUT) {
      console.warn('Request timed out before server replied.');
    }
  } else {
    console.error('Unexpected non-SDK error:', error);
  }
}
```
