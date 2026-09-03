#!/usr/bin/env bash
set -euo pipefail

OUTPUT=$(npm pack --dry-run --json)
FILES=$(echo "$OUTPUT" | jq -r '.[0].files[].path')

ALLOWED_PATTERNS=(
  "^package\.json$"
  "^README\.md$"
  "^LICENSE$"
  "^dist/"
)

VIOLATIONS=()
while IFS= read -r file; do
  MATCH=0
  for pattern in "${ALLOWED_PATTERNS[@]}"; do
    if [[ "$file" =~ $pattern ]]; then
      MATCH=1
      break
    fi
  done
  if [[ $MATCH -eq 0 ]]; then
    VIOLATIONS+=("$file")
  fi
done <<< "$FILES"

if [[ ${#VIOLATIONS[@]} -gt 0 ]]; then
  echo "❌ Unexpected files in npm tarball:"
  printf '  %s\n' "${VIOLATIONS[@]}"
  exit 1
fi

echo "✅ npm pack contains only expected files"
