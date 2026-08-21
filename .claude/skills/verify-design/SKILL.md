---
name: verify-design
description: Launch the app, sign in as a seeded school admin, drive screens in a headless browser, screenshot each, report console/page errors, and scrub the test-login rows from the dev DB. Use after implementing or changing ANY screen in school-fe (onboarding, students, teachers, academics, classes, branches) to verify it actually renders against the real backend, not just that it type-checks.
---

# verify-design - drive any screen in the real running app

Build-green ≠ works. This app's screens sit behind auth + a live backend, and
classes of bug only surface against real responses (empty-list `{}`, missing
fields, refusals, render-time crashes). This skill launches the app, signs in,
drives the screens you point it at, screenshots them, and reports runtime errors
- then leaves the dev DB exactly as it found it.

It is **not** tied to any one feature. Drive whatever you just built.

**Two things differ from console-fe's copy of this skill, and both will waste an
hour if you miss them.**

1. **The address names the school.** school-fe reads which school it is from the
   hostname, so `BASE_URL` must carry the slug as a subdomain -
   `http://brightfield-lekki.localhost:5199`, not `http://localhost:5199`. A bare
   origin names no school, and the sign-in form refuses to render at all.
2. **You are signing in as a school admin, not a platform admin.** The tenant in
   the login body, the email, and the subdomain in `BASE_URL` all have to name
   the SAME school.

### Which school to drive

`seed_onboarding_scenarios` (in the backend) builds one school per state. Pick
the one whose state you need rather than trying to force a screen into it:

| Slug | State |
|---|---|
| `brightfield-lekki` | Not ready, mid-progress, one step skipped |
| `st-monicas` | Ready, go-live form open |
| `holy-cross` | Pending approval |
| `grace-fields` | Rejected, with a reason |
| `crescent-model` | Activation failed, with a reference |
| `lagoon-view` | Live - the full app is open, onboarding read-only |
| `new-dawn` | Never provisioned - no checklist |
| `riverbank` | Ten days from expiry |

All sign in as `admin@<slug>.example.com` / `School@2025`. Each also has
`branch.admin@<slug>.example.com`, who holds read-only onboarding access - use
them to check a screen's read-only rendering.

**A pending school reaches onboarding and nothing else.** Driving `/students` at
`brightfield-lekki` correctly renders "This part of XVS opens when your school
goes live" - that is a pass, not a failure. Drive `lagoon-view` for the rest of
the app.

**Look at the screenshots.** A blank frame or the app's "Something went wrong"
error boundary is a failure, even if the run "succeeded".

## Inputs

`$ARGUMENTS` = optional space/comma-separated route paths to drive. If omitted,
the skill targets the screens you just changed (from the git diff). Examples:
- `/verify-design` → verify the screens in your current working changes
- `/verify-design /team-management /organogram` → verify those two
- `/verify-design HEAD~1` → verify the screens changed in the last commit

Env overrides: `TENANT` (default `brightfield-lekki` - change this to drive a
different state), `BACKEND` (default `http://localhost:8000/v1`),
`EMAIL` (defaults to `admin@$TENANT.example.com`), `PASSWORD` (default
`School@2025`), `DB` (default `cx_db`).

## Steps - follow in order

### 1. Preflight: backend must be running
The dev server can't be started for you (long-running + needs env). Check it:
```bash
curl -s -o /dev/null -w "%{http_code}" --max-time 5 -X POST \
  "${BACKEND:-http://localhost:8000/v1}/user/auth/login/" \
  -H "Content-Type: application/json" -d '{}'
```
- `400` → backend is up (it rejected the empty body). Continue.
- otherwise → STOP. Tell the user to start it:
  `! cd ~/Documents/Dev-Projects/GitHub/backend/apps && ../cx/bin/python manage.py runserver --settings=apps.settings.local`

### 2. Decide which routes to drive
- If the user passed route paths in `$ARGUMENTS`, use those.
- If they passed a git ref (e.g. `HEAD~1`), or passed nothing, find the changed
  screens and map them to routes:
  ```bash
  bash .claude/skills/verify-design/changed-pages.sh ${ARG_REF:-}   # changed page/route files
  bash .claude/skills/verify-design/list-routes.sh                  # the full route menu (reference)
  ```
  Map each changed `src/pages/...` file to its URL by cross-referencing
  `src/routes/routesPath.ts`. Drive the parameterised detail routes only if you
  can supply a real id from the list views.
- If nothing changed and no routes were given, ask the user which screen(s) to
  verify (don't guess the whole app).

Hold the chosen paths as a space-separated string for step 6 (`ROUTES`).

### 3. Capture the DB baseline FIRST (before any login)
So every login below (preflight + the drive) sits above the baseline and gets
scrubbed in step 7.
```bash
bash .claude/skills/verify-design/capture-baseline.sh
```

### 4. Confirm the login works
```bash
TENANT=brightfield-lekki bash .claude/skills/verify-design/preflight.sh
```
Signs in and prints the school's readiness, counts and blocking steps. Every
onboarding screen renders from that one payload, so an unexpected readiness
explains most "the screen looks wrong" reports before you open the screen.

Fails loudly if the school is not seeded - then run the backend's
`seed_onboarding_scenarios`.

### 5. Ensure the frontend dev server is running
```bash
grep -qE "Local:\s+http" /tmp/verify-design/vite.log 2>/dev/null && \
  echo "vite up: $(grep -oE 'http://localhost:[0-9]+' /tmp/verify-design/vite.log | head -1)" || \
  { mkdir -p /tmp/verify-design; (npm run dev > /tmp/verify-design/vite.log 2>&1 &); sleep 3; \
    grep -oE 'http://localhost:[0-9]+' /tmp/verify-design/vite.log | head -1; }
```

### 6. Drive the routes
Playwright is already installed at `.claude/node_modules` and Node resolves it
from this folder by walking up, so there is nothing to install.

**Rewrite the origin to carry the school's subdomain** - this is the step people
get wrong:
```bash
PORT="$(grep -oE 'http://localhost:[0-9]+' /tmp/verify-design/vite.log | head -1 | grep -oE '[0-9]+$')"
TENANT="${TENANT:-brightfield-lekki}"

BASE_URL="http://$TENANT.localhost:$PORT" \
EMAIL="admin@$TENANT.example.com" PASSWORD="School@2025" \
ROUTES="<the paths from step 2>" \
node .claude/skills/verify-design/drive.mjs
```
It logs in, screenshots each route to `/tmp/verify-design/shots/`, and lists
console/page errors. **Then Read each screenshot and judge it** - confirm the
screen rendered, not the error boundary.

### 7. Scrub the test-login rows from the dev DB
Logging in writes `vs_user_loginsession` / `vs_user_authattempt` /
`vs_audit_auditevent (LOGIN_SUCCESS)` and bumps `user.last_login`. Restore:
```bash
bash .claude/skills/verify-design/scrub.sh
```
Deletes exactly the rows created since the baseline and resets `last_login`.
The drive is read-only, so business tables are never written.

### 8. Report
Which screens rendered cleanly, any console errors (quote them), any screen
showing the error boundary - with the screenshot as evidence. If a fix is
needed, the console-error text + the offending endpoint's real shape
(`curl …?entity=CODEX` with the bearer token) is the fastest way in.

## Notes
- **Read-only**: navigates + screenshots only; never submits a form, so no
  business rows are created - only the auth-login trail, which step 7 removes.
- Works for every area: pass any route, or let step 2 target your changes.
- Most screens in this app are still static mock data and make no request. They
  render the same whatever the backend says, so a clean screenshot of one proves
  less than it looks like it does.
- **Responsive checking is a separate script.** `.claude/mobile-audit.mjs` drives
  routes at 390px and 820px and reports page-level horizontal overflow. It is not
  duplicated inside this skill - there is one copy, and CLAUDE.md points at it:
  `cd .claude && BASE_URL=http://brightfield-lekki.localhost:5199 EMAIL=admin@brightfield-lekki.example.com PASSWORD=School@2025 ROUTES="/onboarding" node ./mobile-audit.mjs`
- **Loading/error states**: `drive.mjs` can only capture the loaded screen. To
  screenshot a route's LOADING and ERROR render states (invisible-skeleton and
  broken-error-UI bugs only surface there), run `probe-loading.mjs` - it delays
  then aborts the matching API calls:
  `BASE_URL=http://brightfield-lekki.localhost:5199 ROUTES="/onboarding" PATTERN="/onboarding/state/" node .claude/skills/verify-design/probe-loading.mjs`
  (`net::ERR_FAILED` console errors in its output are the probe's own aborts.)
