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

```bash
npm install @lily-protocol/sdk
```

For local development in this repository:

```bash
npm install
```

## Requirements & Compatibility

- **Node.js >= 20**: The SDK requires Node.js 20 or later. It relies on the built-in global `fetch`, `AbortController`, and DOM `Headers` APIs available natively from Node 20+.
- **Global Fetch**: A standards-compliant `fetch` implementation must be available globally. If running in an environment without native fetch, provide a compatible polyfill via the `config.fetch` option when constructing the SDK.
- **CI-Supported Versions**: Automated tests run against Node.js 20 and Node.js 22.
- **Browser Considerations**: When using the SDK in browser environments, be aware of CORS restrictions and ensure that the `Headers` API is supported. The SDK does not include browser-specific polyfills; configure your bundler or runtime accordingly.
- **Custom Fetch Fallback**: For unsupported runtimes (e.g., older Node versions or specialized environments), pass a custom fetch implementation through the SDK configuration to override the global default.

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

## Configuration

The SDK accepts a `LilySdkConfig` object. All fields except `baseUrl` are optional and have sensible defaults.

| Field | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `baseUrl` | `string` | *required* | Absolute URL for the Lily Protocol API (e.g. `https://api.lilyprotocol.com`). |
| `apiKey` | `string` | `undefined` | API key sent as `x-api-key` header when provided. |
| `authToken` | `string` | `undefined` | Bearer token sent as `Authorization` header when provided. |
| `timeoutMs` | `number` | `10000` | Request timeout in milliseconds. Must be positive. Can be overridden per-request via `HttpRequest.timeoutMs`. |
| `retry` | `Partial<RetryPolicy>` | `{ retries: 2, retryDelayMs: 250, retryableStatusCodes: [408,409,425,429,500,502,503,504] }` | Retry behaviour for failed requests. See below. |
| `defaultHeaders` | `Record<string,string>` | `{}` | Extra headers merged into every request. |
| `userAgent` | `string` | `lily-sdk/0.1.0` | Value of the `User-Agent` header. |
| `fetch` | `typeof fetch` | `globalThis.fetch` | Custom fetch implementation for unsupported runtimes. |

### Retry semantics

- Retries only apply to **safe/idempotent** methods: `GET`, `PUT`, and `DELETE`. Requests using `POST` or `PATCH` fail immediately on error.
- Eligible status codes default to `[408, 409, 425, 429, 500, 502, 503, 504]` and can be customised via `retry.retryableStatusCodes`.
- Transport-level errors (network failures, DNS errors) are retried under the same method constraint.
- The delay between attempts grows linearly: `retryDelayMs × attemptNumber` (e.g. 250 ms, then 500 ms).
- Timeouts (`AbortError`) are wrapped as `LilyTransportError` with code `TIMEOUT` and are not retried beyond the transport policy.

### Example

```ts
const sdk = new LilySdk({
  baseUrl: 'https://api.lilyprotocol.com',
  authToken: process.env.LILY_AUTH_TOKEN,
  timeoutMs: 15_000,
  retry: { retries: 3, retryDelayMs: 500 },
  defaultHeaders: { 'x-request-source': 'billing-service' },
});
```

Per-request overrides work the same way:

```ts
await sdk.wallets.provision(
  { agentId: 'agent_123', network: 'stellar-testnet' },
  { timeoutMs: 5_000 }, // overrides the global timeout for this call only
);
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

The root entrypoint also exposes the transport layer for custom clients and tests:

```ts
import {
  BaseClient,
  createFetchHttpClient,
  HttpClient,
  HttpHeaders,
  HttpRequest,
  HttpResponse,
  RetryPolicy,
} from '@lily-protocol/sdk';

class MyClient extends BaseClient {
  async health() {
    return this.request<{ status: string }>({
      method: 'GET',
      path: '/v1/system/health',
    });
  }
}

const httpClient = createFetchHttpClient({
  baseUrl: 'https://api.lilyprotocol.com',
  authToken: process.env.LILY_AUTH_TOKEN,
});

const client = new MyClient(httpClient);
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

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a full list of changes. The changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and is updated with every release.

## Roadmap Themes

- Real backend endpoint alignment and response model hardening
- Pagination helpers and richer idempotency ergonomics
- Webhook verification, observability hooks, and advanced auth flows
- More complete Stellar asset and payment orchestration coverage

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

## Requirements and Compatibility

- **Node.js**: Version 20 or newer is required. The SDK relies on built-in `fetch`, `AbortController`, and `Headers` APIs available in Node 20+.
- **CI-Supported Versions**: Automated tests run against Node.js 20 and 22.
- **Global Fetch**: A standards-compliant global `fetch` implementation is required by default. If your runtime lacks native fetch (e.g., older Node versions or specialized environments), provide a custom implementation via the `fetch` config option:

  ```ts
  import { LilySdk } from '@lily-protocol/sdk';
  import fetch from 'node-fetch'; // or any compatible polyfill

  const sdk = new LilySdk({
    baseUrl: 'https://api.lilyprotocol.com',
    fetch: fetch as typeof globalThis.fetch,
  });
  ```

- **Browser Usage**: The SDK can run in browsers that support the Fetch API. Note that browser environments are subject to CORS restrictions enforced by the server. Ensure the Lily backend allows requests from your origin, or use a proxy/backend-for-frontend pattern.
