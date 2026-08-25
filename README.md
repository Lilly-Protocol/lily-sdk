# Lily SDK

[![CI](https://github.com/lily-protocol/lily-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/lily-protocol/lily-sdk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/typed-TypeScript-3178C6.svg)](https://www.typescriptlang.org/)

TypeScript-first SDK for integrating Lily Protocol's autonomous agent finance infrastructure into Node.js applications.

The SDK is designed for backend and service-to-service integrations that need typed access to AgentLily wallets, agent identity, autonomous payments, and Lily backend APIs on Stellar.

## Status

This repository is production-oriented foundation work. The public API, tooling, and contributor workflow are in place, while several domain methods still use intentionally conservative request models so the SDK can evolve alongside the backend without breaking contributors every week.

## Features

- Typed SDK constructor with strict configuration validation
- Modular clients for agents, wallets, payments, identity, and system health
- Reusable HTTP transport abstraction with auth header handling, timeouts, and retry scaffolding
- ESM and CommonJS builds with emitted declaration files
- Vitest test suite, ESLint, Prettier, and GitHub Actions CI
- Contributor-ready project docs, issue templates, and example script

## Installation

```bash
npm install @lily-protocol/sdk
```

For local development in this repository:

```bash
npm install
```

## Quick Start

```ts
import { LilySdk } from '@lily-protocol/sdk';

const sdk = new LilySdk({
  baseUrl: 'https://api.lilyprotocol.com',
  authToken: process.env.LILY_AUTH_TOKEN,
  apiKey: process.env.LILY_API_KEY,
});

const health = await sdk.system.health();
const wallet = await sdk.wallets.provision({
  agentId: 'agent_123',
  network: 'stellar-testnet',
});

console.log(health.status);
console.log(wallet.wallet.address);
```

## Public API Overview

```ts
import { LilySdk } from '@lily-protocol/sdk';

const sdk = new LilySdk({ baseUrl: 'https://api.lilyprotocol.com' });

sdk.agents.list();
sdk.wallets.provision({ agentId: 'agent_123', network: 'stellar-testnet' });
sdk.payments.quote({
  fromWalletId: 'wallet_123',
  toAddress: 'GB...',
  amount: { assetCode: 'USDC', amount: '10.00' },
});
sdk.identity.resolve({ agentId: 'agent_123' });
sdk.system.health();
```

## Error Handling

The SDK ships a typed error hierarchy from `@lily-protocol/sdk` (also re-exported as `@lily-protocol/sdk/errors`). Every SDK failure extends `LilySdkError`, which itself extends `Error`.

### Shared fields

All six classes accept the same constructor options. These fields are available on the thrown error:

| Field | Type | Description |
| --- | --- | --- |
| `code` | `string \| undefined` | Machine-readable code such as `AUTHENTICATION_ERROR`, `API_ERROR`, `TIMEOUT`, or `TRANSPORT_ERROR`. |
| `statusCode` | `number \| undefined` | HTTP status when the failure came from the Lily Protocol API. |
| `details` | `unknown` | Parsed response body or other structured context from the throw site. |
| `cause` | `unknown` | Original exception, exposed as standard `Error.cause` when the SDK wraps a lower-level failure. |

### Decision table

| Error class | When it throws | Fields typically set |
| --- | --- | --- |
| `LilySdkError` | Base class for all SDK errors. Catch this to handle any Lily failure. | `code`, `statusCode`, `details`, and `cause` as provided by subclasses |
| `LilyConfigError` | Invalid SDK constructor config: missing or invalid `baseUrl`, invalid `timeoutMs` or retry policy, or missing `fetch` in unsupported runtimes. | message; HTTP fields are usually unset |
| `LilyTransportError` | Request timed out (`code: 'TIMEOUT'`) or a network/fetch failure after retries (`code: 'TRANSPORT_ERROR'`). | `code`, `cause` |
| `LilyValidationError` | Reserved for request or response validation failures. It is part of the public hierarchy even if current throw sites do not yet use it. | `code`, `details` when thrown |
| `LilyAuthenticationError` | HTTP 401 or 403 from the Lily Protocol API. | `code: 'AUTHENTICATION_ERROR'`, `statusCode`, `details` |
| `LilyApiError` | Other non-OK HTTP responses after retries (not 401/403). | `code: 'API_ERROR'`, `statusCode`, `details` |

The HTTP client retries selected 4xx/5xx statuses and retryable transport errors for safe/idempotent methods (`GET`, `PUT`, `DELETE`) before throwing. Authentication failures are never retried.

### Catch guide

Use `instanceof` so auth failures are not treated as retryable API or network errors.

```ts
import {
  LilySdk,
  LilyApiError,
  LilyAuthenticationError,
  LilyTransportError,
} from '@lily-protocol/sdk';

const sdk = new LilySdk({
  baseUrl: 'https://api.lilyprotocol.com',
  authToken: process.env.LILY_AUTH_TOKEN,
});

async function withRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Auth failures need new credentials, not another attempt.
      if (error instanceof LilyAuthenticationError) {
        throw error;
      }

      const retryableTransport =
        error instanceof LilyTransportError &&
        (error.code === 'TIMEOUT' || error.code === 'TRANSPORT_ERROR');
      const retryableApi =
        error instanceof LilyApiError &&
        error.statusCode !== undefined &&
        [408, 409, 425, 429, 500, 502, 503, 504].includes(error.statusCode);

      if (!retryableTransport && !retryableApi) {
        throw error;
      }
    }
  }

  throw lastError;
}

try {
  const health = await withRetry(() => sdk.system.health());
  console.log(health.status);
} catch (error) {
  if (error instanceof LilyAuthenticationError) {
    console.error('Refresh credentials', error.statusCode, error.details);
  } else if (error instanceof LilyApiError) {
    console.error('API request failed', error.code, error.statusCode, error.details);
  } else if (error instanceof LilyTransportError) {
    console.error('Network or timeout', error.code, error.cause);
  } else {
    throw error;
  }
}
```

## Repository Structure

```text
src/
  clients/       domain-oriented SDK modules
  config/        SDK configuration types and resolution
  errors/        typed SDK error hierarchy
  http/          transport abstraction and fetch implementation
  models/        public request/response and domain model types
  types/         client contracts and shared public contracts
tests/           unit tests and test helpers
examples/        runnable local examples
.github/         CI and contributor workflow templates
```

## Development

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

Run the example:

```bash
npm run example
```

## Design Notes

- `LilySdk` composes a shared transport with focused domain clients instead of exposing a single massive client surface.
- Models are exported from stable entrypoints so future internal refactors do not require a public breaking change.
- The HTTP layer is intentionally small and swappable, which keeps backend integration work easy to test and contributor-friendly.

## Roadmap Themes

- Real backend endpoint alignment and response model hardening
- Pagination helpers and richer idempotency ergonomics
- Webhook verification, observability hooks, and advanced auth flows
- More complete Stellar asset and payment orchestration coverage

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.
