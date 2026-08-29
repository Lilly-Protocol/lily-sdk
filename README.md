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

## Subpath Imports

The root package `@lily-protocol/sdk` is the convenience surface: `LilySdk`, domain clients, and re-exported helpers (config types, errors, models, and a subset of HTTP types).

These five `package.json` exports are also **stable public entrypoints**. Prefer them when you want a smaller import, tree-shaking, or a helper that is not on the root (notably `createFetchHttpClient`). Deep imports such as `@lily-protocol/sdk/dist/...` or unpublished `src/` paths are not part of the public API.

### `@lily-protocol/sdk/config`

SDK configuration types and the resolver used by `LilySdk`.

Main symbols: `LilySdkConfig`, `ResolvedLilySdkConfig`, `resolveLilySdkConfig`.

```ts
import {
  resolveLilySdkConfig,
  type LilySdkConfig,
  type ResolvedLilySdkConfig,
} from '@lily-protocol/sdk/config';
```

### `@lily-protocol/sdk/errors`

Typed error hierarchy for config, transport, validation, auth, and API failures.

Main symbols: `LilySdkError`, `LilyConfigError`, `LilyTransportError`, `LilyValidationError`, `LilyAuthenticationError`, `LilyApiError`.

```ts
import {
  LilyApiError,
  LilyAuthenticationError,
  LilyConfigError,
  LilySdkError,
} from '@lily-protocol/sdk/errors';
```

### `@lily-protocol/sdk/http`

HTTP transport contract and the default fetch-based client. Use this entrypoint to construct or swap the transport passed into `LilySdk`.

Main symbols: `createFetchHttpClient`, `HttpClient`, `HttpRequest`, `HttpResponse`, `HttpHeaders`, `HttpMethod`, `RetryPolicy`.

```ts
import { createFetchHttpClient, type HttpClient } from '@lily-protocol/sdk/http';
```

### `@lily-protocol/sdk/models`

Public request/response and domain model types (agents, wallets, payments, identity, system health, shared money/pagination types).

Main symbols include `Agent`, `Wallet`, `Payment`, `IdentityProfile`, `HealthStatus`, `ProvisionWalletRequest`, and related request/result types.

```ts
import type {
  Agent,
  HealthStatus,
  Payment,
  ProvisionWalletRequest,
  Wallet,
} from '@lily-protocol/sdk/models';
```

### `@lily-protocol/sdk/types`

Client contracts for implementing or mocking domain modules without importing concrete client classes.

Main symbols: `AgentClientContract`, `WalletClientContract`, `PaymentClientContract`, `IdentityClientContract`, `SystemClientContract`.

```ts
import type {
  AgentClientContract,
  WalletClientContract,
} from '@lily-protocol/sdk/types';
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
