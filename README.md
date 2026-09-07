# Lily SDK — Stellar Asset-Aware TypeScript SDK

## Security

Please see [SECURITY.md](./SECURITY.md) for supported versions and private vulnerability reporting through GitHub Security Advisories. Do not file public issues for security-sensitive reports.

[![CI](https://github.com/lily-protocol/lily-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/lily-protocol/lily-sdk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/typed-TypeScript-3178C6.svg)](https://www.typescriptlang.org/)
[![Stellar](https://img.shields.io/badge/Stellar-asset%20semantics-7D00FF)](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/assets)
[![Network](https://img.shields.io/badge/network-stellar--testnet-00A7E0)](https://soroban-testnet.stellar.org/)

**TypeScript-first SDK for Lily Protocol's Stellar-native autonomous agent finance — typed access to AgentLily wallets, agent identity, and USDC/XLM payments.**

The SDK is the developer entry point to Lily Protocol, the **autonomous agent finance stack being built on the Stellar network**. It gives Node.js and browser apps typed access to AgentLily **Stellar wallet provisioning**, **agent identity**, and **payment quoting/execution** against Lily backend APIs — with a domain model that speaks Stellar natively.

## Stellar at a Glance

- **`stellar-testnet` out of the box** — wallet provisioning targets the Stellar network explicitly (`network: "stellar-testnet"` → `stellar-mainnet` as deployments land).
- **Native XLM vs issued USDC** — `MoneyAmount` encodes Stellar's asset model precisely: `XLM` with _no issuer_, issued assets like `USDC` with their **56-character `G…` issuer account**, and **7-decimal stroop precision**.
- **Decimal-string money, never floats** — amounts are base-10 strings to mirror Stellar's exact integer/stroop arithmetic and avoid the float bugs that break settlements.
- **`toAmountString` / `toMoneyAmount` helpers** — safely convert database values and user input into exact Stellar-scale amounts.
- **Webhook verification with replay protection** for agent payment events.

```
┌──────────────────────────────────────────────────────────────┐
│  Your app (Node.js / browser)                                │
│   const sdk = LilySdk.create();                              │
│   await sdk.wallets.provision({ agentId, network:'stellar-testnet' });│
└──────────────────────────────┬───────────────────────────────┘
                               │ typed HTTP (retry, timeout, auth)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  Lily Protocol backend API (Stellar asset validation)         │
└──────────────────────────────┬───────────────────────────────┘
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  Stellar network — AgentLily wallets, USDC/XLM settlement    │
└──────────────────────────────────────────────────────────────┘
```

## Features

- Typed SDK constructor with strict configuration validation
- Modular clients for **agents, wallets (Stellar), payments (Stellar assets), identity, and system health**
- Stellar-native `MoneyAmount` model (XLM vs issued assets, 7-decimal precision)
- Reusable HTTP transport abstraction with auth header handling, timeouts, and retry scaffolding
- Node.js ESM and CommonJS builds, a browser-targeted ESM build, and emitted declaration files
- Vitest test suite, ESLint, Prettier, and GitHub Actions CI
- Contributor-ready project docs, issue templates, and example script

## Status

This repository is production-oriented foundation work. The public API, tooling, and contributor workflow are in place, while several domain methods still use intentionally conservative request models so the SDK can evolve alongside the backend without breaking contributors every week.

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

## Requirements & Compatibility

- **Node.js >= 20**: The SDK requires Node.js 20 or later. It relies on the built-in global `fetch`, `AbortController`, and DOM `Headers` APIs available natively from Node 20+.
- **Global Fetch**: A standards-compliant `fetch` implementation must be available globally. If running in an environment without native fetch, provide a compatible polyfill via the `config.fetch` option when constructing the SDK.
- **CI-Supported Versions**: Automated tests run against Node.js 20, 22, and 24 (matching `.github/workflows/ci.yml`).
- **Browser Considerations**: When using the SDK in browser environments, be aware of CORS restrictions and ensure that the `Headers` API is supported. The SDK does not include browser-specific polyfills; configure your bundler or runtime accordingly.
- **Custom Fetch Fallback**: For unsupported runtimes (e.g., older Node versions or specialized environments), pass a custom fetch implementation through the SDK configuration to override the global default.

  ```ts
  import { LilySdk } from '@lily-protocol/sdk';
  import fetch from 'node-fetch'; // or any compatible polyfill

  const sdk = new LilySdk({
    baseUrl: 'https://api.lilyprotocol.com',
    fetch: fetch as typeof globalThis.fetch,
  });
  ```

  Browser applications are also subject to server-enforced CORS restrictions. Ensure the Lily backend allows requests from your origin, or use a proxy/backend-for-frontend pattern.

## Quick Start

```ts
import { LilySdk } from '@lily-protocol/sdk';

// Uses https://api.lilyprotocol.com by default and reads LILY_API_URL,
// LILY_API_KEY, and LILY_AUTH_TOKEN from the environment when present.
const sdk = LilySdk.create();

const health = await sdk.system.health();

// Provision an AgentLily wallet on the Stellar testnet
const wallet = await sdk.wallets.provision({
  agentId: 'agent_123',
  network: 'stellar-testnet',
});

console.log(health.status);
console.log(wallet.wallet.address); // G… Stellar account address

// Quote a USDC payment at Stellar precision
const quote = await sdk.payments.quote({
  fromWalletId: 'wallet_123',
  toAddress: 'G…',
  amount: { assetCode: 'USDC', amount: '10.00' },
});
```

## Configuration

The SDK accepts a `LilySdkConfig` object. Fields are optional at the type level, but direct construction must resolve a `baseUrl` from either the explicit config or `LILY_API_URL`; `LilySdk.create()` also provides the fallback described below.

| Field               | Type                    | Default                                                                                      | Description                                                                                                   |
| :------------------ | :---------------------- | :------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| `baseUrl`           | `string`                | _required_                                                                                   | Absolute URL for the Lily Protocol API (e.g. `https://api.lilyprotocol.com`).                                 |
| `apiKey`            | `string \| null`        | `undefined`                                                                                  | API key sent as `x-api-key` header when provided. Pass `null` to clear in `withConfig`.                       |
| `authToken`         | `string \| null`        | `undefined`                                                                                  | Bearer token sent as `Authorization` header when provided. Pass `null` to clear in `withConfig`.              |
| `timeoutMs`         | `number`                | `10000`                                                                                      | Request timeout in milliseconds. Must be positive. Can be overridden per-request via `HttpRequest.timeoutMs`. |
| `retry`             | `Partial<RetryPolicy>`  | `{ retries: 2, retryDelayMs: 250, retryableStatusCodes: [408,409,425,429,500,502,503,504] }` | Retry behaviour for failed requests. See below.                                                               |
| `defaultHeaders`    | `Record<string,string>` | `{}`                                                                                         | Extra headers merged into every request.                                                                      |
| `userAgent`         | `string`                | `lily-sdk/0.1.0`                                                                             | Value of the `User-Agent` header.                                                                             |
| `fetch`             | `typeof fetch`          | `globalThis.fetch`                                                                           | Custom fetch implementation for unsupported runtimes.                                                         |
| `validateResponses` | `boolean`               | `true`                                                                                       | Enables runtime validation for known response models. Invalid validated payloads throw `LilyValidationError`. |

### Default constants

The default `timeoutMs` and retry policy are exported so custom `HttpClient` implementations and tooling can reference them instead of hard-coding the values. They are the single source of truth used by both config resolution and the fetch transport:

```ts
import {
  DEFAULT_TIMEOUT_MS,
  DEFAULT_RETRY_POLICY,
} from '@lily-protocol/sdk/config';
// also re-exported from the root entrypoint:
import { DEFAULT_TIMEOUT_MS, DEFAULT_RETRY_POLICY } from '@lily-protocol/sdk';

DEFAULT_TIMEOUT_MS; // 10_000
DEFAULT_RETRY_POLICY; // { retries: 2, retryDelayMs: 250, retryableStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504] }
```

### Retry semantics

- Retries only apply to **safe/idempotent** methods: `GET`, `PUT`, and `DELETE`. Requests using `POST` or `PATCH` fail immediately on error.
- Eligible status codes default to `[408, 409, 425, 429, 500, 502, 503, 504]` and can be customised via `retry.retryableStatusCodes`.
- Transport-level errors (network failures, DNS errors) are retried under the same method constraint.
- The delay between attempts grows linearly: `retryDelayMs × attemptNumber` (e.g. 250 ms, then 500 ms).
- Timeouts (`AbortError`) are wrapped as `LilyTransportError` with code `TIMEOUT` and are not retried beyond the transport policy.

The default values above are not hard-coded twice: they are exported from the `@lily-protocol/sdk/config` subpath as `DEFAULT_TIMEOUT_MS` and `DEFAULT_RETRY_POLICY` (plus `DEFAULT_RETRYABLE_STATUS_CODES`), so custom `HttpClient` implementations and documentation can reference the exact defaults the SDK resolves.

### Example

```ts
const sdk = new LilySdk({
  baseUrl: 'https://api.lilyprotocol.com',
  authToken: process.env.LILY_AUTH_TOKEN,
  timeoutMs: 15_000,
  retry: { retries: 3, retryDelayMs: 500 },
  defaultHeaders: { 'x-request-source': 'billing-service' },
  validateResponses: true,
});
```

Per-request overrides use the low-level HTTP client instead:

```ts
await sdk.http.request({
  method: 'POST',
  path: '/v1/wallets/provision',
  body: { agentId: 'agent_123', network: 'stellar-testnet' },
  timeoutMs: 5_000,
});
```

### Tenant-scoped overrides with `withConfig`

Use `withConfig()` to derive a tenant-specific SDK instance with overridden credentials, headers, or endpoint while leaving the original SDK instance unchanged.

```ts
const platformSdk = new LilySdk({
  baseUrl: 'https://api.lilyprotocol.com',
  apiKey: 'platform-api-key',
  defaultHeaders: { 'x-service': 'billing' },
});

const tenantSdk = platformSdk.withConfig({
  apiKey: 'tenant-api-key',
  defaultHeaders: { 'x-tenant-id': 'tenant_123' },
});

const wallet = await tenantSdk.wallets.get('wallet_123');
```

Credentials are inherited from the parent unless explicitly overridden. There is currently no way to clear an inherited credential via `withConfig()` — use a fresh `LilySdk` constructor for anonymous child instances.

### `LilySdk.create()` environment-variable precedence

`LilySdk.create()` resolves its environment-backed values in this order:

- `baseUrl`: explicit `options.baseUrl` → `LILY_API_URL` → `LILY_BASE_URL` → `https://api.lilyprotocol.com`
- `apiKey`: explicit `options.apiKey` → `LILY_API_KEY` → `undefined`
- `authToken`: explicit `options.authToken` → `LILY_AUTH_TOKEN` → `undefined`

Explicit values therefore override process-wide environment defaults.

## Public API Overview

```ts
import { LilySdk } from '@lily-protocol/sdk';

const sdk = new LilySdk({ baseUrl: 'https://api.lilyprotocol.com' });

sdk.agents.list();
sdk.wallets.provision({ agentId: 'agent_123', network: 'stellar-testnet' });
sdk.payments.quote({
  fromWalletId: 'wallet_123',
  toAddress: 'GB…',
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

## Domain Models: Stellar Money & Assets

`MoneyAmount` (defined in `src/models/common.ts`) is the core model representing currency amounts and asset specifications across the Lily SDK, including wallet balances (`Wallet.balances`), payment quoting (`PaymentQuoteRequest`, `PaymentQuote`), and payment execution (`ExecutePaymentRequest`, `Payment`).

```ts
export interface MoneyAmount {
  assetCode: string;
  assetIssuer?: string;
  amount: string;
}
```

### Decimal-String Semantics (`amount`)

- **String, Never Float:** The `amount` field is strictly typed as a base-10 decimal `string` (e.g. `'10.50'`), **never** a JavaScript `number`.
- **Float Precision Rationale:** Standard JavaScript numbers are IEEE 754 floating-point values, which cannot precisely represent fractional base-10 amounts (for instance, `0.1 + 0.2 === 0.30000000000000004`). In financial transactions and agent autonomous settlements, floating-point math can lead to subtle truncation bugs and balance mismatches. Using decimal strings ensures exact arithmetic and lossless serialization across API boundaries.
- **Precision Expectations:** On the Stellar network, amounts support up to 7 decimal places of precision, corresponding to the smallest Stellar unit: 1 stroop (`0.0000001 XLM` = `10^-7 XLM`). Amounts passed in `MoneyAmount` should reflect exact decimal values up to 7 fractional digits (or the designated precision of the custom asset).

### Native vs. Issued Assets (`assetCode` & `assetIssuer`)

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

### Asset Code and Amount Validation

- **Validation Rules:** Asset codes and issuer addresses are validated by Lily backend APIs and verified on-chain by Stellar Horizon/RPC nodes during transaction submission.
- **Asset Code Constraints:** Alphanumeric characters only (`[a-zA-Z0-9]`), length between 1 and 12 characters.
- **Issuer Key Constraints:** Valid 56-character Ed25519 public key starting with `G` with a valid checksum.
- **Amount Constraints:** Positive base-10 decimal strings (e.g. `'10.50'`, `'0.0000001'`). Negative numbers, exponential/scientific notation (e.g. `'1e-5'`), and non-numeric characters are invalid.

### Examples: Valid and Invalid `MoneyAmount`

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

### Safe Amount Conversion Helpers (`toAmountString` & `toMoneyAmount`)

To eliminate floating-point artifacts (e.g. `0.1 + 0.2 === 0.30000000000000004`), expand exponential notations (such as `1e-7`), and safely construct `MoneyAmount` objects from database values or user inputs, use the built-in conversion helpers:

```ts
import { toAmountString, toMoneyAmount } from '@lily-protocol/sdk';

// Convert numbers to clean, exact decimal strings without float artifacts
toAmountString(0.1 + 0.2); // '0.3'
toAmountString(0.1 + 0.2, 2); // '0.30'
toAmountString(12.3456, 2); // '12.35' (half-up rounding)
toAmountString(1e-7); // '0.0000001' (expanded from scientific notation)

// Safely construct valid MoneyAmount instances
const native = toMoneyAmount(0.1 + 0.2, 'XLM');
// { assetCode: 'XLM', amount: '0.3' }

const usdc = toMoneyAmount({
  amount: 100.5,
  assetCode: 'USDC',
  assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
  scale: 2,
});
// { assetCode: 'USDC', assetIssuer: '...', amount: '100.50' }
```

## Repository Structure

```text
src/
  clients/       domain-oriented SDK modules (agents, wallets, payments, identity)
  config/        SDK configuration types and resolution
  errors/        typed SDK error hierarchy
  http/          transport abstraction and fetch implementation
  models/        public request/response and domain model types (Stellar MoneyAmount)
  types/         client contracts and shared public contracts
tests/           unit tests and test helpers
examples/        runnable local examples
.github/         CI and contributor workflow templates
```

## Subpath Imports

The SDK supports fine-grained subpath imports for minimal bundle size and tree-shaking:

| Subpath                       | Description                                          |
| :---------------------------- | :--------------------------------------------------- |
| `@lily-protocol/sdk`          | Full SDK (all clients and exports)                   |
| `@lily-protocol/sdk/config`   | Configuration types and resolver                     |
| `@lily-protocol/sdk/errors`   | Error classes and type guards                        |
| `@lily-protocol/sdk/http`     | HTTP transport layer                                 |
| `@lily-protocol/sdk/models`   | Domain models (incl. Stellar asset semantics)        |
| `@lily-protocol/sdk/types`    | Shared type definitions                              |
| `@lily-protocol/sdk/webhooks` | Webhook signature verification and replay protection |

### Webhook Verification

```ts
import {
  verifyWebhookSignature,
  verifyWebhookWithReplay,
} from '@lily-protocol/sdk/webhooks';

// Verify webhook signature with replay protection (5-minute tolerance)
const isValid = verifyWebhookWithReplay(
  rawBody,
  req.headers['x-lily-signature'],
  process.env.LILY_WEBHOOK_SECRET!,
);
```

## Error Handling

All SDK errors extend `LilySdkError`. Use `isLilySdkError` to safely narrow an unknown caught value and `LILY_ERROR_CODES` to compare transport error codes without hardcoded strings:

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

The transport uses `API_ERROR`, `AUTHENTICATION_ERROR`, `TIMEOUT`, and `TRANSPORT_ERROR`. Their typed values are available from `LILY_ERROR_CODES`.

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

## Design Notes

- `LilySdk` composes a shared transport with focused domain clients instead of exposing a single massive client surface. The resolved `HttpClient` is also available as `sdk.http` for one-off raw requests that must reuse the SDK's transport and config.
- Models are exported from stable entrypoints so future internal refactors do not require a public breaking change.
- The HTTP layer is intentionally small and swappable, which keeps backend integration work easy to test and contributor-friendly.
- Timed-out GET, PUT, and DELETE requests use the configured retry budget; non-idempotent requests fail immediately on timeout.

## Documentation

In-depth guides are available under [docs/](./docs/):

| Guide                                                        | Description                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------- |
| [Money & Stellar Assets](./docs/money-and-stellar-assets.md) | MoneyAmount semantics, XLM vs issued assets, stroop precision |
| [Environment Variables](./docs/environment-variables.md)     | Available env vars and their defaults                         |
| [Error Handling](./docs/error-handling.md)                   | Error hierarchy, type guards, and recovery patterns           |
| [Runtime Requirements](./docs/runtime-requirements.md)       | Node.js version, fetch polyfills, browser support             |
| [Subpath Imports](./docs/subpath-imports.md)                 | Tree-shakeable ./config, ./errors, ./http imports             |
| [Timeouts & Retries](./docs/timeouts-and-retries.md)         | Retry policy, backoff, and idempotency                        |
| [Auth Headers](./docs/auth-headers.md)                       | How x-api-key and Authorization are set                       |
| [Custom HTTP Client](./docs/custom-http-client.md)           | Injecting a custom HttpClient                                 |
| [Non-JSON Responses](./docs/non-json-responses.md)           | Handling 204 and non-JSON payloads                            |
| [API Reference](./docs/api-reference.md)                     | Generated API documentation                                   |

## Roadmap Themes

- Real backend endpoint alignment and response model hardening
- Pagination helpers and richer idempotency ergonomics
- Webhook verification, observability hooks, and advanced auth flows
- **More complete Stellar asset and payment orchestration coverage** (mainnet, Stellar Asset Contract tokens, transaction submission)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a full list of changes. The changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and is updated with every release.

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.
