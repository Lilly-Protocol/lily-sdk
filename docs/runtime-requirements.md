# Runtime Requirements

## Node.js
- Minimum: Node.js 18 (LTS)
- Recommended: Node.js 20+ (LTS)
- Tested: Node.js 18, 20, 22, 24

Uses native global `fetch` (Node.js 18+).

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
