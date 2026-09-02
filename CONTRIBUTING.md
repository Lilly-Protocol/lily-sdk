# Contributing to Lily SDK

Thanks for contributing to Lily SDK. This repository is intended to be approachable for first-time contributors while still maintaining production-quality standards.

## Prerequisites

- Node.js 20 or newer
- npm 11 or newer
- Git

## Getting Started

```bash
git clone https://github.com/lily-protocol/lily-sdk.git
cd lily-sdk
npm install
npm run lint
npm run typecheck
npm run test
```

## Development Workflow

1. Create a focused branch from `main`.
2. Make the smallest coherent change that solves one problem well.
3. Add or update tests whenever behavior changes.
4. Run `npm run lint`, `npm run typecheck`, and `npm run test` before opening a PR.
5. Update docs or examples when the public developer experience changes.

## Project Principles

- Keep the public API ergonomic and strongly typed.
- Prefer small, composable modules over deep abstraction stacks.
- Avoid coupling SDK internals too tightly to backend implementation details unless the API contract is stable.
- Leave clear extension points for future contributors.

## Code Style

- TypeScript strict mode is required.
- ESLint and Prettier define the default style.
- Public types should be explicit and stable.
- New transport or client features should come with tests.

## Suggested Contribution Areas

- Endpoint and schema alignment with Lily backend services
- Better retry policies and observability hooks
- Additional payment and wallet lifecycle methods
- Improved examples and integration recipes
- Release automation and npm publishing hardening

## Adding a New Client (Contract-Driven Pattern)

Lily SDK uses a contract-driven architecture to ensure consistency across all domain clients. Follow this five-step pattern when adding new functionality:

### 1. Define the Contract

Add a new interface to `src/types/contracts.ts` that extends or mirrors existing client contracts:

```ts
export interface NewFeatureClientContract {
  list(params?: ListParams): Promise<ListResponse>;
  create(data: CreateRequest): Promise<CreateResponse>;
}
```

### 2. Add Domain Models

Create request/response types in `src/models/new-feature.ts` and export them from `src/models/index.ts`:

```ts
export interface CreateRequest { /* ... */ }
export interface CreateResponse { /* ... */ }
```

### 3. Implement via BaseClient

Create `src/clients/new-feature-client.ts` extending `BaseClient`:

```ts
import { BaseClient } from './base-client';
import type { NewFeatureClientContract } from '../types/contracts';

export class NewFeatureClient extends BaseClient implements NewFeatureClientContract {
  async list(params?: ListParams) {
    return this.request({ method: 'GET', path: '/new-feature', query: params });
  }
}
```

### 4. Register in LilySdk

Update `src/sdk.ts` to compose the new client and expose it as a public property:

```ts
this.newFeature = new NewFeatureClient(this.transport);
```

Export relevant symbols from `src/index.ts`.

### 5. Add Tests

Write unit tests in `tests/new-feature.test.ts` covering happy paths, error cases, and contract compliance. Use stubbed fetch for deterministic results.

### Checklist for New Clients

- [ ] Contract defined in `src/types/contracts.ts`
- [ ] Models added to `src/models/` and re-exported
- [ ] Client implements contract via `BaseClient`
- [ ] Registered in `LilySdk` constructor (`src/sdk.ts`)
- [ ] Public exports updated in `src/index.ts`
- [ ] Unit tests cover success, error, and edge cases
- [ ] README or docs updated if user-facing behavior changes

## Pull Requests

- Keep PR descriptions clear and outcome-focused.
- Link related issues when possible.
- Call out breaking changes explicitly.
- Include follow-up work if you intentionally defer part of the implementation.
