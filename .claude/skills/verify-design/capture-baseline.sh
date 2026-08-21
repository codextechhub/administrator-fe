#!/usr/bin/env bash
# Record the auth-table state BEFORE driving, so scrub.sh can delete exactly the
# rows the test login creates (precise, midnight-safe - keyed on ids/timestamp,
# not "today").
set -euo pipefail

DB="${DB:-cx_db}"
OUT=/tmp/verify-design
mkdir -p "$OUT"

# Trim leading/trailing whitespace only (keep the space inside a timestamp).
q() { psql -d "$DB" -tAc "$1" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'; }

{
  echo "DB=\"$DB\""
  echo "LOGINSESSION_MAX=\"$(q 'select coalesce(max(id),0) from vs_user_loginsession')\""
  echo "AUTHATTEMPT_MAX=\"$(q 'select coalesce(max(id),0) from vs_user_authattempt')\""
  echo "MARKER=\"$(q 'select now()')\""   # quoted: the timestamp contains a space
} > "$OUT/baseline.env"

echo "✓ baseline captured → $OUT/baseline.env"
cat "$OUT/baseline.env"
