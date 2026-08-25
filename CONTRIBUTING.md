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

## Adding a Client

Clients follow a contract-driven pattern that keeps the public API explicit and centralizes transport behavior. Use these steps when adding a new endpoint group:

1. **Define the contract.** Add a `*ClientContract` interface to `src/types/contracts.ts`. This file is the source of truth for each client's public operations: method names, inputs, and return types belong here, independent of the HTTP implementation.
2. **Add the models.** Define request, response, and query types in the appropriate module under `src/models/`. Export new model types from `src/models/index.ts` so contracts, consumers, and client implementations share the same definitions.
3. **Implement the client.** Add the implementation under `src/clients/`, extend `BaseClient`, and implement its `*ClientContract`. Send endpoint requests through the inherited `BaseClient.request` method so all clients use the shared `HttpClient` abstraction instead of duplicating transport logic.
4. **Expose and compose it.** Export the client from `src/index.ts`, then add it to the `LilySdk` composition root in `src/sdk.ts`: declare the client property and construct it with the resolved shared `HttpClient`.
5. **Add tests.** Cover the client's request method, path, payload or query parameters, and response behavior. Also update the SDK composition tests to verify the new client is available from `LilySdk`.

### New Client Checklist

- [ ] A `*ClientContract` is defined in `src/types/contracts.ts`.
- [ ] Request, response, and query models are added under `src/models/` and exported from `src/models/index.ts`.
- [ ] The client extends `BaseClient`, implements its contract, and uses `BaseClient.request`.
- [ ] The client is exported from `src/index.ts` and registered on `LilySdk` in `src/sdk.ts`.
- [ ] Client behavior and SDK composition tests are added and all checks pass.

## Suggested Contribution Areas

- Endpoint and schema alignment with Lily backend services
- Better retry policies and observability hooks
- Additional payment and wallet lifecycle methods
- Improved examples and integration recipes
- Release automation and npm publishing hardening

## Pull Requests

- Keep PR descriptions clear and outcome-focused.
- Link related issues when possible.
- Call out breaking changes explicitly.
- Include follow-up work if you intentionally defer part of the implementation.
