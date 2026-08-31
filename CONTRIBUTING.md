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

Lily SDK uses a contract-driven architecture to keep clients consistent, testable, and easy to extend. Follow these five steps when adding a new client:

1. **Define the contract** in `src/types/contracts.ts`. Create an interface (e.g., `NewClientContract`) that lists every public method the client will expose. Use existing interfaces like `AgentClientContract` or `PaymentClientContract` as templates for naming and JSDoc style.

2. **Add models** in `src/models/`. Define request and response types needed by the contract. Export them from `src/models/index.ts` so they can be imported by both the contract file and the implementation.

3. **Implement the client** in `src/clients/new-client.ts`. Extend `BaseClient` from `src/clients/base-client.ts` and implement the contract interface. Use `this.request<TResponse, TRequest>()` for all HTTP calls — never call `httpClient` directly. Keep methods focused and avoid leaking transport details into business logic.

4. **Register in the SDK.** Import the new client in `src/sdk.ts`, add it as a public readonly property on `LilySdk`, and instantiate it in the constructor alongside the existing clients. Also export the client class from `src/index.ts` so consumers can import it directly if needed.

5. **Add tests** in `tests/`. Place test files directly in the `tests/` directory (no subdirectories). Mock `HttpClient` using classes that implement the interface rather than object literals with `vi.fn()` to satisfy `@typescript-eslint/unbound-method`. Cover happy paths, error responses, and edge cases defined by the contract.

Following this pattern ensures new clients are discoverable, type-safe, and consistent with the rest of the SDK surface area.

## Pull Requests

- Keep PR descriptions clear and outcome-focused.
- Link related issues when possible.
- Call out breaking changes explicitly.
- Include follow-up work if you intentionally defer part of the implementation.
