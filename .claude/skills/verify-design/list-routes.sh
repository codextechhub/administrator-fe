#!/usr/bin/env bash
# Dump the app's concrete (non-parameterised) route paths from routesPath.ts -
# a reference menu for choosing what to drive. Routes with params (":id") are
# listed too but need a real id to visit.
set -euo pipefail

RP="src/routes/routesPath.ts"
[ -f "$RP" ] || { echo "✗ $RP not found (run from repo root)" >&2; exit 1; }

# Every "/..." string literal, deduped. The file also holds arrow functions that
# BUILD paths (`SESSION_DETAILS_ID: (id) => ...`); their template literals are
# skipped by this grep, which is why the ":id" forms beside them are the ones
# listed - those are the patterns, and they are what you need an id for.
grep -oE '"/[^"]*"' "$RP" \
  | tr -d '"' \
  | sort -u \
  | awk '{ if ($0 ~ /:/) print $0 "   (needs a param)"; else print $0 }'
