# Settlement tracking — lily-sdk#577

Status: **pending verification**. Do not pay from this record.
`REAL_MONEY=false` — no payment was executed, the payout link was not used, and no outreach was made.

This file and [Lilly-Protocol/lily-sdk#577](https://github.com/Lilly-Protocol/lily-sdk/issues/577)
are the single settlement thread for this contribution. Do not reopen tracking on the
closed source issue or merged PR.

## Contribution

| Field | Value |
| --- | --- |
| Contributor | [@woahwhattheheck](https://github.com/woahwhattheheck) |
| Source issue | [Lilly-Protocol/agentlily-runtime#267](https://github.com/Lilly-Protocol/agentlily-runtime/issues/267) |
| Merged PR | [Lilly-Protocol/agentlily-runtime#384](https://github.com/Lilly-Protocol/agentlily-runtime/pull/384) |
| Merge commit | `0bbc8f9c222e818e44e89884552e39cbcac81ae9` |
| Merge (claimed) | 2026-09-06 into `main` |
| Advertised bounty | US$90 |

## Payout request (unverified)


Treat the link as a claim, not as authorization to pay.

## Verification (required before any settlement)


If any checkbox fails, do not pay. Request proof (bounty terms, link ownership) on #577.

## Settlement actions (payer only, after verification)

1. **Direct settle:** pay US$90 via the verified link, then record receipt + transaction ID in this file and on #577, and close #577 as completed.
2. **Batch settle:** reply on #577 with method, status, ETA, and the batch tracker URL. Do not also pay via the Stripe link.
3. **Hold:** if unverified or disputed, leave status as pending and document the blocker on #577.

After a successful payout, cross-link the receipt to agentlily-runtime#267 and PR #384 so this contribution cannot be paid twice.

## Guardrails
