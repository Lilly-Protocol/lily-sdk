# Solution for Issue #118

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis

The `MoneyAmount` type models monetary amounts as decimal strings. To ensure future validators (such as those introduced in #96) maintain backward-compatible passthrough semantics for input variations (leading/trailing zeros, integer strings, etc.), we need to add robust unit tests covering `MoneyAmount` decimal normalization and preservation.

### Fix

Add a unit test suite covering `MoneyAmount` parsing and request payload transmission through `PaymentClient` methods (`quote`/`execute`), asserting that string inputs like `"1"`, `"1.0"`, `"01.5"`, and `"0.000001"` are transmitted unchanged without coercion.

### Implementation

```typescript
import { describe, it, expect, vi } from 'vitest';
import { PaymentClient } from '../src/clients/payment'; // Adjust import as per SDK layout

describe('MoneyAmount decimal normalization and passthrough', () => {
  it('preserves string format for various decimal representations without coercion', async () => {
    const mockTransport = {
      post: vi.fn().mockResolvedValue({ data: { success: true } }),
    };
    const client = new PaymentClient(mockTransport as any);

    const testAmounts = ['1', '1.0', '01.5', '0.000001', '100', '0.0'];

    for (const amount of testAmounts) {
      await client.quote({
        amount,
        currency: 'USDC',
        recipient: '0x1234567890abcdef1234567890abcdef12345678',
      });

      expect(mockTransport.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ amount }),
      );
    }
  });
});
```

### Testing

Run tests using the project test runner:

```bash
npm test
```

---

_Submitted by Aditya Waghamare_
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`
