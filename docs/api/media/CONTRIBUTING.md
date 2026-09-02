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

## Pull Requests

- Keep PR descriptions clear and outcome-focused.
- Link related issues when possible.
- Call out breaking changes explicitly.
- Include follow-up work if you intentionally defer part of the implementation.
