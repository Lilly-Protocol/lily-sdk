# MoneyAmount and Stellar Asset Semantics

## MoneyAmount

All monetary values use `MoneyAmount` — a decimal string with exactly 2 decimal places.

```typescript
type MoneyAmount = string; // e.g. "10.00", "0.99", "1000000.00"
```

### Validation Rules
- Must be a string
- Must match `^\d+\.\d{2}$`
- Must be non-negative

## Stellar Asset Semantics

### Memo
- Maximum 28 characters (Stellar limit)
- Printable ASCII only
- Optional field

### Asset Codes
- 4-character (native) or 12-character (extended) codes
- Issuer is a Stellar public key (56 chars, starts with `G`)

### Example

```typescript
await sdk.payments.create({
  amount: '15.50',
  currency: 'USD',
  memo: 'INV-2024-001',
  stellarAsset: { code: 'USDC', issuer: 'GA5ZSEJW...' },
});
```
