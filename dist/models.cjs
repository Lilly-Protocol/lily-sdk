'use strict';

// src/models/common.ts
var DECIMAL_AMOUNT_PATTERN = /^\d+(\.\d+)?$/;
function normalizeMoneyAmount(input) {
  if (typeof input.amount !== "string" || !DECIMAL_AMOUNT_PATTERN.test(input.amount)) {
    throw new RangeError(
      `MoneyAmount.amount must be a base-10 decimal string, got ${JSON.stringify(input.amount)}.`
    );
  }
  const [wholeRaw = "", fractionRaw = ""] = input.amount.split(".");
  const whole = wholeRaw.replace(/^0+(?=\d)/, "");
  const fraction = fractionRaw.slice(0, 2).padEnd(2, "0");
  return { ...input, amount: `${whole}.${fraction}` };
}

exports.normalizeMoneyAmount = normalizeMoneyAmount;
//# sourceMappingURL=models.cjs.map
//# sourceMappingURL=models.cjs.map