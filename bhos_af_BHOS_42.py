import json
from typing import Any
import hmac
import hashlib


def verify_webhook_json(data: Any, signature: str, secret: str) -> bool:
    """
    Verifies a webhook signature independent of payload key insertion order.

    **Context:**
    `JSON.stringify` (and `dumps`) preserves insertion order for dicts, but for
    strict canonical comparison, keys should be sorted recursively. This function
    replicates that canonicalization before hashing.

    **Args:**
        data: The parsed payload (dict, list, or primitive).
        signature: The hex-encoded signature string.
        secret: The HMAC secret (string).

    **Returns:**
        bool: True if signature matches, False otherwise.

    **JSDoc Note:**
    Claims canonical serialization is achieved via `sort_keys=True` and tight
    `separators`.
    """
    # Canonicalize the data: sort keys recursively to mimic TS JSON.stringify(sort_keys=True)
    # Using separators=(',', ':') for tight canonical form matching JSON.stringify defaults closely.
    canonical_json = json.dumps(data, sort_keys=True, separators=(',', ':'))

    # Compute HMAC-SHA256 of the canonical string
    calculated_signature = hmac.new(
        secret.encode('utf-8'),
        canonical_json.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    # Compare signatures
    return calculated_signature == signature