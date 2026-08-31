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

Lily SDK uses a contract-driven architecture to keep clients consistent and testable. Follow this checklist when adding a new domain client:

1. **Define the Contract**: Add a `*ClientContract` interface in `src/types/contracts.ts` describing the public methods and their signatures.
2. **Add Models**: Create request/response types in `src/models/` specific to the new domain.
3. **Implement the Client**: Extend `BaseClient` from `src/clients/base-client.ts` and implement the contract interface. Use `this.request()` for all HTTP calls.
4. **Register in SDK**: Export the client from `src/index.ts` and wire it into `LilySdk` in `src/sdk.ts` so it is available as `sdk.<domain>`.
5. **Add Tests**: Write unit tests covering the new client's methods, mocking the transport layer. Ensure lint, typecheck, and test suites pass.

This pattern ensures every client shares the same transport, error handling, and configuration resolution while keeping domain logic isolated.

## Pull Requests

- Keep PR descriptions clear and outcome-focused.
- Link related issues when possible.
- Call out breaking changes explicitly.
- Include follow-up work if you intentionally defer part of the implementation.
