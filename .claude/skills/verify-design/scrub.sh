#!/usr/bin/env bash
# Delete exactly the auth rows the test login created (since the baseline) and
# reset the admin's last_login. Business tables are never touched by the drive.
set -euo pipefail

BASE=/tmp/verify-design
[ -f "$BASE/baseline.env" ] || { echo "✗ no baseline.env - run capture-baseline.sh first" >&2; exit 1; }
# shellcheck disable=SC1091
source "$BASE/baseline.env"
EMAIL="${EMAIL:-admin@brightfield-lekki.example.com}"

UID_SQL="(select id from vs_users_user where email='$EMAIL')"

psql -d "$DB" -v ON_ERROR_STOP=1 <<SQL
BEGIN;
DELETE FROM vs_audit_auditevent
  WHERE actor_user_id=$UID_SQL AND action_type='LOGIN_SUCCESS' AND event_at >= '$MARKER';
DELETE FROM vs_user_authattempt WHERE id > ${AUTHATTEMPT_MAX};
DELETE FROM vs_user_loginsession WHERE id > ${LOGINSESSION_MAX};
UPDATE vs_users_user SET last_login=NULL WHERE id=$UID_SQL;
COMMIT;
SQL

echo "✓ scrubbed test-login rows (loginsession>$LOGINSESSION_MAX, authattempt>$AUTHATTEMPT_MAX, audit>=$MARKER) and reset last_login"
