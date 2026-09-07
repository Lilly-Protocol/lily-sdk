#!/usr/bin/env bash
set -euo pipefail

PACK_OUTPUT=$(npm pack --dry-run 2>&1)

# Extract only actual file paths from npm pack output
# File lines look like: "npm notice 1.1kB LICENSE" or "npm notice 245B dist/config.d.cts"
FILES=$(echo "$PACK_OUTPUT" | grep -E '^npm notice [0-9]' | sed -E 's/^npm notice [0-9.]+[kMG]*B +//' | sort)

EXPECTED_PATTERNS=(
  "^dist/"
  "^README\.md$"
  "^LICENSE$"
  "^package\.json$"
)

UNEXPECTED=()
while IFS= read -r file; do
  [ -z "$file" ] && continue
  matched=false
  for pattern in "${EXPECTED_PATTERNS[@]}"; do
    if echo "$file" | grep -qE "$pattern"; then
      matched=true
      break
    fi
  done
  if [ "$matched" = false ]; then
    UNEXPECTED+=("$file")
  fi
done <<< "$FILES"

if [ ${#UNEXPECTED[@]} -gt 0 ]; then
  echo "ERROR: Unexpected files in npm pack output:"
  printf '  %s\n' "${UNEXPECTED[@]}"
  exit 1
fi

DIST_COUNT=$(echo "$FILES" | grep -c '^dist/' || true)
if [ "$DIST_COUNT" -lt 5 ]; then
  echo "ERROR: Expected at least 5 dist files, found $DIST_COUNT"
  exit 1
fi

echo "OK: npm pack contains only expected files ($DIST_COUNT dist entries)"
