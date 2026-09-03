# Runtime Requirements

## Node.js

- Minimum: Node.js 20
- Recommended: the latest active LTS release of Node.js
- Tested in CI: Node.js 20, 22, and 24

The SDK relies on the native global `fetch`, `AbortController`, and DOM `Headers`
APIs available in Node.js 20 and later.

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
