# OpenAPI Codegen

This SDK generates TypeScript types from the backend OpenAPI specification.

## Quick Start

```bash
# Regenerate types from the vendored spec
npm run codegen

# Or specify a custom spec path
npx tsx scripts/codegen.ts path/to/custom-spec.yaml
```

## How It Works

1. The authoritative OpenAPI spec is vendored at `openapi/lily-backend.yaml`
2. Running `npm run codegen` invokes `scripts/codegen.ts`, which calls `openapi-typescript`
3. Generated output goes to `src/generated/types.ts` (committed to the repo)
4. Hand-written models in `src/models/` and contracts in `src/types/contracts.ts` are **additive** — they add method signatures and convenience types on top of the generated schema types

## When to Regenerate

- After updating `openapi/lily-backend.yaml` with backend changes
- Before submitting a PR that modifies API contracts
- As part of CI drift detection (see issue #98)

## File Structure

| Path | Purpose |
|------|---------|
| `openapi/lily-backend.yaml` | Vendored backend OpenAPI spec (source of truth) |
| `scripts/codegen.ts` | Codegen script that wraps openapi-typescript |
| `src/generated/types.ts` | Auto-generated types (DO NOT EDIT MANUALLY) |
| `src/models/*` | Hand-written model interfaces (additive overrides) |
| `src/types/contracts.ts` | Client contract interfaces with method signatures |

## Dependencies

- `openapi-typescript` (devDependency) — generates TS types from OpenAPI specs
- `tsx` (devDependency) — runs the TypeScript codegen script directly
