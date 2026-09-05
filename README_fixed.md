# Lily SDK

## Security

Please see [SECURITY.md](SECURITY.md) for vulnerability reporting and security policy.

[![CI](https://github.com/lily-protocol/lily-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/lily-protocol/lily-sdk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/typed-TypeScript-3178C6.svg)](https://www.typescriptlang.org/)
[![Security Policy](https://img.shields.io/badge/security-policy-blue.svg)](./SECURITY.md)

TypeScript-first SDK for integrating Lily Protocol's autonomous agent finance infrastructure into Node.js applications.

The SDK is designed for backend and service-to-service integrations that need typed access to AgentLily wallets, agent identity, autonomous payments, and Lily backend APIs on Stellar.

## Status

This repository is production-oriented foundation work. The public API, tooling, and contributor workflow are in place, while several domain methods still use intentionally conservative request models so the SDK can evolve alongside the backend without breaking contributors every week.

## Features

- Typed SDK constructor with strict configuration validation
- Modular clients for agents, wallets, payments, identity, and system health
- Reusable HTTP transport abstraction with auth header handling, timeouts, and retry scaffolding
- Node.js ESM and CommonJS builds, a browser-targeted ESM build, and emitted declaration files
- Vitest test suite, ESLint, Prettier, and GitHub Actions CI
- Contributor-ready project docs, issue templates, and example script

## Browser Support

The SDK ships a browser-compatible ESM build at `dist/browser/`. Bundlers that support the `browser` export condition (webpack, Vite, Rollup, esbuild) will automatically resolve to this build.

```js
// Browser bundlers resolve to dist/browser/index.js via the exports map
import { LilySdk } from '@lily-protocol/sdk';
```

The browser build targets ES2022 and uses the native `fetch` API. Node.js-specific APIs are not included.

## Installation

```bash
npm install @lily-protocol/sdk
```

### Browser support

The SDK supports modern browsers with native `fetch`, `URL`, and `AbortController` APIs. Browser-aware bundlers select the dedicated `browser` export automatically; it is compiled as ES2022 without Node.js globals or built-ins. Keep API keys and other server-side credentials out of browser applications—only use credentials that are explicitly safe to expose to end users.

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

// Uses https://api.lilyprotocol.com by default and reads LILY_API_URL,
// LILY_API_KEY, and LILY_AUTH_TOKEN from the environment when present.
const sdk = LilySdk.create();

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

| Field            | Type                    | Default                                                                                      | Description                                                                                                   |
| :--------------- | :---------------------- | :------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| `baseUrl`        | `string`                | _required_                                                                                   | Absolute URL for the Lily Protocol API (e.g. `https://api.lilyprotocol.com`).                                 |
| `apiKey`         | `string`                | `undefined`                                                                                  | API key sent as `x-api-key` header when provided.                                                             |
| `authToken`      | `string`                | `undefined`                                                                                  | Bearer token sent as `Authorization` header when provided.                                                    |
| `timeoutMs`      | `number`                | `10000`                                                                                      | Request timeout in milliseconds. Must be positive. Can be overridden per-request via `HttpRequest.timeoutMs`. |
| `retry`          | `Partial<RetryPolicy>`  | `{ retries: 2, retryDelayMs: 250, retryableStatusCodes: [408,409,425,429,500,502,503,504] }` | Retry behaviour for failed requests. See below.                                                               |
| `defaultHeaders` | `Record<string,string>` | `{}`                                                                                         | Extra headers merged into every request.                                                                      |
| `userAgent`      | `string`                | `lily-sdk/0.1.0`                                                                             | Value of the `User-Agent` header.                                                                             |
| `fetch`          | `typeof fetch`          | `globalThis.fetch`                                                                           | Custom fetch implementation for unsupported runtimes.                                                         |

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

// Low-level escape hatch: the active HttpClient (injected or default)
await sdk.http.request({
  method: 'GET',
  path: '/v1/system/health',
});
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

## Domain Models

### `MoneyAmount` and Stellar Asset Semantics

`MoneyAmount` (defined in `src/models/common.ts`) is the core model representing currency amounts and asset specifications across the Lily SDK, including wallet balances (`Wallet.balances`), payment quoting (`PaymentQuoteRequest`, `PaymentQuote`), and payment execution (`ExecutePaymentRequest`, `Payment`).

```ts
export interface MoneyAmount {
  assetCode: string;
  assetIssuer?: string;
  amount: string;
}
```

#### Decimal-String Semantics (`amount`)

- **String, Never Float:** The `amount` field is strictly typed as a base-10 decimal `string` (e.g. `'10.50'`), **never** a JavaScript `number`.
- **Float Precision Rationale:** Standard JavaScript numbers are IEEE 754 floating-point values, which cannot precisely represent fractional base-10 amounts (for instance, `0.1 + 0.2 === 0.30000000000000004`). In financial transactions and agent autonomous settlements, floating-point math can lead to subtle truncation bugs and balance mismatches. Using decimal strings ensures exact arithmetic and lossless serialization across API boundaries.
- **Precision Expectations:** On the Stellar network, amounts support up to 7 decimal places of precision, corresponding to the smallest Stellar unit: 1 stroop (`0.0000001 XLM` = `10^-7 XLM`). Amounts passed in `MoneyAmount` should reflect exact decimal values up to 7 fractional digits (or the designated precision of the custom asset).

#### Native vs. Issued Assets (`assetCode` & `assetIssuer`)

Stellar distinguishes between native network lumens and custom issued assets:

- **Native Asset (`XLM`):**
  - `assetCode`: Set to `'XLM'`.
  - `assetIssuer`: Must be omitted or `undefined`. The native asset is built into the ledger and has no issuing account.
- **Issued Credit Assets (e.g., `USDC`, `EURC`):**
  - `assetCode`: 1 to 12 character alphanumeric string (Alpha4 for 1–4 characters such as `'USDC'`, Alpha12 for 5–12 characters).
  - `assetIssuer`: The 56-character base32-encoded Stellar public key (G-address, e.g. `'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'`) of the issuing account or anchor.
- **Relationship to Stellar `Asset` and Home Domains:**
  - In the Stellar protocol, an issued asset is uniquely identified by the pair `(assetCode, assetIssuer)`. Two assets with the identical code issued by different accounts represent separate, distinct assets.
  - Stellar issuing accounts publish a `home_domain` in their account records for SEP-1 TOML discovery, allowing clients to resolve issuer legitimacy and asset metadata.

#### Asset Code and Amount Validation

- **Validation Rules:** Asset codes and issuer addresses are validated by Lily backend APIs and verified on-chain by Stellar Horizon/RPC nodes during transaction submission.
- **Asset Code Constraints:** Alphanumeric characters only (`[a-zA-Z0-9]`), length between 1 and 12 characters.
- **Issuer Key Constraints:** Valid 56-character Ed25519 public key starting with `G` with a valid checksum.
- **Amount Constraints:** Positive base-10 decimal strings (e.g. `'10.50'`, `'0.0000001'`). Negative numbers, exponential/scientific notation (e.g. `'1e-5'`), and non-numeric characters are invalid.

#### Examples: Valid and Invalid `MoneyAmount`

```ts
import type { MoneyAmount } from '@lily-protocol/sdk';

// ✅ Valid: Native XLM (no issuer, 7 decimal places)
const validNative: MoneyAmount = {
  assetCode: 'XLM',
  amount: '25.5000000',
};

// ✅ Valid: Issued asset (USDC with 56-char G-address issuer)
const validIssued: MoneyAmount = {
  assetCode: 'USDC',
  assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
  amount: '100.00',
};

// ✅ Valid: Minimum Stellar unit (1 stroop)
const validStroop: MoneyAmount = {
  assetCode: 'XLM',
  amount: '0.0000001',
};

// ✅ Valid: Whole integer amount as decimal string
const validInteger: MoneyAmount = {
  assetCode: 'XLM',
  amount: '50',
};

// ❌ Invalid: Using a number instead of a decimal string
const invalidFloat = {
  assetCode: 'XLM',
  amount: 10.5, // Type error: amount must be a string to avoid float precision bugs
};

// ❌ Invalid: Scientific / exponential notation is not allowed
const invalidExponential: MoneyAmount = {
  assetCode: 'XLM',
  amount: '1e-7', // Invalid format: must be standard decimal string
};

// ❌ Invalid: Incomplete decimal point notation
const invalidDecimal: MoneyAmount = {
  assetCode: 'XLM',
  amount: '10.', // Invalid format: missing fractional digits
};

// ❌ Invalid: Native asset (XLM) with an issuer
const invalidNativeIssuer: MoneyAmount = {
  assetCode: 'XLM',
  assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', // XLM has no issuer
  amount: '10.00',
};

// ❌ Invalid: Issued asset without the required assetIssuer
const invalidMissingIssuer: MoneyAmount = {
  assetCode: 'USDC', // Issued assets require assetIssuer to identify the anchor
  amount: '100.00',
};
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

## Testing

| Command                 | Description                                 |
| ----------------------- | ------------------------------------------- |
| `npm test`              | Run tests with coverage (default)           |
| `npm run test:unit`     | Fast tests without coverage instrumentation |
| `npm run test:coverage` | Explicit coverage run (same as `npm test`)  |
| `npm run test:watch`    | Watch mode for development                  |

## Development

```bash
npm install
npm run lint
npm run typecheck
npm run test:unit
npm run test:coverage
npm run test
npm run build
```

Run the example:

```bash
npm run example
```

## Error Handling

All SDK errors extend `LilySdkError`. Use `isLilySdkError` to safely narrow an
unknown caught value and `LILY_ERROR_CODES` to compare transport error codes
without hardcoded strings:

```ts
import { isLilySdkError, LILY_ERROR_CODES } from '@lily-protocol/sdk';

try {
  await sdk.system.health();
} catch (error) {
  if (isLilySdkError(error) && error.code === LILY_ERROR_CODES.TIMEOUT) {
    // Handle a request timeout.
  }
}
```

The transport uses `API_ERROR`, `AUTHENTICATION_ERROR`, `TIMEOUT`, and
`TRANSPORT_ERROR`. Their typed values are available from `LILY_ERROR_CODES`.

## Design Notes

- `LilySdk` composes a shared transport with focused domain clients instead of exposing a single massive client surface. The resolved `HttpClient` is also available as `sdk.http` for one-off raw requests that must reuse the SDK's transport and config.
- Models are exported from stable entrypoints so future internal refactors do not require a public breaking change.
- The HTTP layer is intentionally small and swappable, which keeps backend integration work easy to test and contributor-friendly.
- Timed-out GET, PUT, and DELETE requests use the configured retry budget; non-idempotent requests fail immediately on timeout.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a full list of changes. The changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and is updated with every release.

## Roadmap Themes

- Real backend endpoint alignment and response model hardening
- Pagination helpers and richer idempotency ergonomics
- Webhook verification, observability hooks, and advanced auth flows
- More complete Stellar asset and payment orchestration coverage

Please read [SECURITY.md](./SECURITY.md) for supported versions and how to report a vulnerability privately via GitHub Security Advisories. Do not file public issues for security-sensitive reports.

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
