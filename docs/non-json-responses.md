# Non-JSON and 204 Responses

## 204 No Content

```typescript
const result = await sdk.agents.delete('agent_123');
// result === null
```

## Non-JSON Content Types

For non-JSON responses, the SDK returns the body as a string.

## Empty Body

For empty bodies, the SDK returns `null`.

## Content-Type Handling

- `application/json` → parsed as JSON
- Other types → returned as text
- No body → `null`
