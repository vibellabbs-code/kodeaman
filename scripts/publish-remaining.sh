#!/bin/bash
# Publish remaining @aspidasec packages that were rate-limited during initial bulk publish.
# Run this script after the npm rate limit resets (typically 24h after the first publish batch).
#
# Usage:
#   bash scripts/publish-remaining.sh
#
# Prerequisites:
#   npm login (authenticated as kaa911-syp)
#   pnpm run build (all packages built)

set -e

PACKAGES=(
  packages/telemetry
  packages/watcher
  packages/dashboard
  packages/mcp-server
  apps/cli
  apps/bot-github
  apps/bot-gitlab
  apps/bot-gitea
)

SUCCESS=0
FAIL=0

echo "=== Publishing remaining @aspidasec packages ==="
echo "Packages to publish: ${#PACKAGES[@]}"
echo ""

for pkg in "${PACKAGES[@]}"; do
  name=$(node -p "require('./$pkg/package.json').name" 2>/dev/null)
  echo "--- Publishing: $name ---"

  if (cd "$pkg" && npm publish --access public 2>&1); then
    echo "SUCCESS: $name"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "FAILED: $name"
    FAIL=$((FAIL + 1))
  fi

  echo ""
  sleep 5
done

echo "=== RESULTS ==="
echo "Published: $SUCCESS/${#PACKAGES[@]}"
echo "Failed: $FAIL/${#PACKAGES[@]}"
