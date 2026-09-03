# Error Handling Guide

Lily SDK provides a typed error hierarchy for granular catch blocks.

## Error Hierarchy

\LilySdkError (base)
+-- LilyConfigError       — invalid configuration (bad baseUrl, missing apiKey)
+-- LilyTransportError    — network-level failures (timeout, DNS, connection)
+-- LilyAuthenticationError — 401/403 (bad/missing credentials)
+-- LilyApiError          — API returned an error response (4xx/5xx)
|   +-- LilyAuthorizationError  — 403 (insufficient permissions)
|   +-- LilyNotFoundError       — 404 (resource not found)
|   +-- LilyConflictError       — 409 (conflict)
|   +-- LilyRateLimitError      — 429 (rate limited)
|   +-- LilyServerError         — 5xx (server error)
+-- LilyValidationError   — response validation failure
\
## Catching by Type

\\	ypescript
import {
  LilySdk,
  isLilySdkError,
  LilyApiError,
  LilyTransportError,
  LilyConfigError,
  LilyAuthenticationError,
  LilyValidationError,
} from '@lily-protocol/sdk';

try {
  const payment = await sdk.payments.get('pay_123');
} catch (error) {
  if (error instanceof LilyConfigError) {
    console.error('Config error:', error.message);
  } else if (error instanceof LilyAuthenticationError) {
    console.error('Auth error:', error.message);
  } else if (error instanceof LilyValidationError) {
    console.error('Validation error:', error.message);
  } else if (error instanceof LilyApiError) {
    console.error('API error:', error.statusCode, error.message);
  } else if (error instanceof LilyTransportError) {
    console.error('Transport error:', error.message);
  } else {
    throw error;
  }
}
\
## Type Guard

\\	ypescript
import { isLilySdkError } from '@lily-protocol/sdk';

try {
  await sdk.payments.create({ amount: '10.00', currency: 'USD' });
} catch (error) {
  if (isLilySdkError(error)) {
    console.error('SDK error:', error.code, error.message);
  }
}
\