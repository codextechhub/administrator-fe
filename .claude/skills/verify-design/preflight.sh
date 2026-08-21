#!/usr/bin/env bash
# Verify the backend is up and the seeded school admin can sign in.
#
# The sign-in names its tenant, exactly as the app does. That is the difference
# from console-fe's copy of this script: there the tenant is always "codex", the
# platform tenant. Here it is a SCHOOL, one address can be an account at several
# schools, and the app reads which school it is from the hostname - so the
# tenant, the email and BASE_URL all have to name the same school or you will
# authenticate as nobody.
set -euo pipefail

BACKEND="${BACKEND:-http://localhost:8000/v1}"
TENANT="${TENANT:-brightfield-lekki}"
EMAIL="${EMAIL:-admin@$TENANT.example.com}"
PASSWORD="${PASSWORD:-School@2025}"

TOKEN=$(curl -s --max-time 8 -X POST "$BACKEND/user/auth/login/" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"tenant\":\"$TENANT\"}" \
  | python3 -c "import sys,json
try:
    print(json.load(sys.stdin)['data']['access'])
except Exception:
    pass")

if [ -z "${TOKEN:-}" ]; then
  echo "✗ Login failed for $EMAIL at tenant '$TENANT'." >&2
  echo "  Seed the cast:  cd ../../../../backend && ./cx/bin/python apps/manage.py seed_onboarding_scenarios --settings=apps.settings.local" >&2
  exit 1
fi
echo "✓ Login OK as $EMAIL (tenant: $TENANT)"

# What state is this school in? Every onboarding screen renders from this one
# payload, so an unexpected readiness explains most "the screen looks wrong"
# reports before you go looking at the screen.
curl -s --max-time 8 "$BACKEND/onboarding/state/?tenant=$TENANT" \
  -H "Authorization: Bearer $TOKEN" -H "accept: application/json" \
  | python3 -c "import sys,json
d=json.load(sys.stdin)
if not d.get('success'):
    print('  onboarding:', d.get('error',{}).get('code'), '-', d.get('message',''))
else:
    x=d['data']; c=x['counts']
    print(f\"  readiness: {x['readiness_state']}  done={c['done']} skipped={c['skipped']} remaining={c['remaining']}\")
    if x['blocking_tasks']: print('  blocked by:', ', '.join(x['blocking_tasks']))"
