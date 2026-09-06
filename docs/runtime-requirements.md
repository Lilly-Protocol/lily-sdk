# Runtime Requirements

## Node.js

- Minimum: Node.js 20 (`package.json` engines: `>=20.0.0`)
- Recommended: Node.js 22 LTS (or newer active LTS)
- Tested in CI: Node.js 20, 22, and 24

Uses native global `fetch`, `AbortController`, and DOM `Headers` (Node.js 20+).
Node.js 18 is not supported.

## Browser

- Chrome 67+, Firefox 69+, Safari 14+, Edge 79+
- Browser-specific build via `browser` export condition.

## Deno

- Compatible with Deno 1.28+

## Bun

- Compatible with Bun 1.0+

## Polyfills

For environments without `fetch`:

```typescript
import { Polyfill } from 'whatwg-fetch';
globalThis.fetch = Polyfill;
```
