# School Onboarding: design breakdown and build phases

The source is `docs/claude-designs/School_Onboarding.html` (the bundled Claude
Design prototype). This document is what came out of reading it: every screen it
contains, every state each screen can be in, what the backend can serve today,
and the order we are going to build it in.

Read section 1 to know what exists, section 2 to know what is missing, and
section 3 to know what we are doing about it.

---

## 1. What the design actually contains

Twelve screens and eight overlays, keyed by the prototype's own state flags.
Sizes are the markup weight in the source, which is a fair proxy for how much
screen there is to build.

| # | Screen | Flag | Size | States it can be in |
|---|---|---|---|---|
| 1 | Welcome | `isWelcome` | 2.8 KB | one |
| 2 | App shell | `isApp` | 12.2 KB | live / pending nav, collapsed nav, status strip, expiry warning |
| 3 | Onboarding control room | `isControl` | 15.9 KB | not provisioned, provisioned, read-only after go-live; per-card: not started, in progress, done, skipped, refused, menu open |
| 4 | Roles & permissions | `isRoles` | 16.1 KB | Roles tab, Invitations tab, role menu open, invite error, invite retry |
| 5 | Invite your staff (stub) | `isStaff` | 1.5 KB | one |
| 6 | Opens at go-live | `isForbidden` | 1.1 KB | one |
| 7 | School profile | `isMeta` | 9.0 KB | complete, incomplete banner, name error, term sample, currency warning |
| 8 | **Academic structure wizard** | `isWizard` | **33.3 KB** | intro, 5 steps, plus: no departments, duplicate department, duplicate class, bad terms, conflicts, critical failure, partial warning, bulk preview |
| 9 | Upload initial datasets | `isData` | 10.6 KB | no templates, no batches, populated, partial-import notice |
| 10 | Validation results | `isValidation` | 7.7 KB | one, with error/warning grouping and a fix panel |
| 11 | Go-live | `isGolive` | 13.8 KB | blocked, form open, pending, rejected, failed, history empty/populated |
| 12 | Go-live success | `isSuccess` | 1.7 KB | one |
| 13 | Escalate an issue | `isEscalate` | 9.6 KB | form, file error, confirmation |
| — | **Import wizard** (overlay) | `importOpen` | **28.4 KB** | 7 steps: template+upload, header comparison, validating, issues, confirm, importing, complete |
| — | Cancel import | `wizCancelOpen` | 1.3 KB | one |
| — | Invitation row menu | `inviteMenuOpen` | 0.8 KB | one |
| — | Role preview drawer | `drawerOpen` | 2.6 KB | one, with per-module permission toggles |
| — | Create custom role | `addRoleOpen` | 2.3 KB | one |
| — | Bulk role upload notice | `bulkRoleOpen` | 1.6 KB | one |
| — | Import with warnings | `proceedOpen` | 1.4 KB | one |
| — | Toast | `toastOpen` | small | success, info, warning, error |

Two schools drive the scenarios, and the design uses them to show states that
one school cannot be in at once:

- **Brightfield Schools, Lagos** (`brightfield-lekki`) - operates branches,
  mid-progress, carries the Skipped chip and the blocked gate.
- **St. Monica's Academy, Enugu** (`st-monicas`) - single site, everything
  required done. Used for Ready, Pending approval, Rejected and Failed.

---

## 2. What the backend can serve

Audited against the route map in `apps/apps/urls.py`.

### Served today, and already wired
| Screen | Endpoints |
|---|---|
| Welcome, control room, go-live, success | `/v1/onboarding/*` |
| School profile | `/v1/i/me/profile/` and `/v1/i/me/profile/logo/` |
| Escalate | `POST /v1/support/tickets/` |
| Opens at go-live | none needed |

### Exists but is closed to a school that has not gone live
Everything here is a real, working API refused with 403 `TENANT_NOT_LIVE` for a
PENDING tenant, because the view never declared `pending_tenant_surface`. The
work is opening a scoped subset, not building an engine.

| Screen | Endpoints that exist |
|---|---|
| Roles & permissions | `/v1/rbac/tenants/<slug>/roles/`, `/roles/<key>/`, `/role-assignments/*` |
| Invitations | `POST /v1/user/`, `POST /v1/user/<id>/invite/resend/` |
| Data intake, validation, import wizard | `/v1/import/system-import-templates/*`, `/v1/import/batches/*` including `validate/`, `issues/`, `issues/export/`, `start-import/`, `jobs/*`, `cancel/`, `download/` |

### Missing entirely
| Screen | What is missing |
|---|---|
| **Academic structure wizard** | There is no academics app. No sessions, terms, departments, programs, levels or classes - not closed, absent. `apps/apps/urls.py` has no academics route at all. **This module is M13 and is owned and designed separately.** We do not build it; we build the wizard against its API when that API lands. |

### Design elements with nothing behind them
Flagged now so each gets a ruling rather than being quietly dropped:

1. Header **search bar** (`⌘E`) - no search endpoint exists.
2. Notification **bell count** - `vs_notifications` exists; the unread count for
   a pending school is unverified.
3. School profile: the design makes **school name editable** and offers
   **GBP**. The backend refuses both - name is not on the update serializer, and
   `Currency` is NGN/USD only.
4. Escalation **attachments** - the ticket attachment endpoint is closed to a
   pending school.
5. Roles: **module-grouped permission toggles** in the drawer save to nothing
   scoped for a school admin today.

---

## 3. The phases

Each phase ends with something shippable: it builds, its tests pass, and the
screens in it have been driven in a browser against the real API at 390px and at
desktop. No phase leaves a screen that looks finished and does nothing.

### Phase 1 - This document, and the skill that reproduces it
The breakdown above, plus a `/design-breakdown` skill so the next design does not
need this conversation: point it at a `.dc.html` or bundled export and it
enumerates screens and states, audits the API for gaps both ways (screens with
no endpoint, endpoints with no screen), and writes the phase plan.
**Ships:** this file, the skill. **No app changes.**

### Phase 2 - The scenario schools - DONE

`python manage.py seed_onboarding_scenarios` builds eight schools, one per
state, driven through the real services wherever a service exists. Every school
signs in with `School@2025` as `admin@<slug>.example.com`, at
`<slug>.localhost:5199`.

| Slug | State it demonstrates |
|---|---|
| `brightfield-lekki` | Not ready, mid-progress, one step skipped, gate blocked |
| `st-monicas` | Ready, the go-live form open |
| `holy-cross` | Pending approval, waiting on CodeX |
| `grace-fields` | Rejected, with a reason, ready to resubmit |
| `crescent-model` | Activation failed, with a failure reference |
| `lagoon-view` | Live, control room read-only, full app open |
| `new-dawn` | Never provisioned - no checklist at all |
| `riverbank` | Not ready, inside the 14-day expiry warning |

Two notes on how it is built. **The failed activation is the only fixture**: a
failure happens when something inside activation breaks, and there is no
supported way to ask it to break, so the row is written the way the service
writes it - status FAILED, a correlation reference, no reviewer and no reason,
readiness back to READY. Everything else goes through `transition_task`,
`submit_go_live`, `reject_go_live` and `approve_go_live`, so a state that cannot
be reached honestly fails loudly rather than being faked.

**The three terminal scenarios are guarded.** Live, failed and rejected cannot
be driven twice - live refuses a second request outright, and the other two
would stack another row onto the history on every run, slowly inventing a school
that had been rejected nine times. Running the command three times in a row now
produces byte-identical output.

`reseed-dev.sh` calls it, so a reseed leaves the cast in place.

### Phase 3 - The shell and the four screens that exist - DONE

The shell now matches the prototype: a round sidebar toggle, the uppercase page
title, the centred search box with its `⌘E` badge, the notification bell, the
support button and the initials avatar. The welcome screen moved OUT of the
shell, which is how the design draws it - a card centred on the canvas with no
sidebar, header or status strip, because it is the screen before you enter the
control room.

Two rulings were taken here.

**The header search navigates; it does not search the school.** There is no
search endpoint in the backend - absent, not closed - so a box promising to find
a student by name would be a lie in the most prominent place on the page.
`⌘E` opens a palette over the screens this person can reach, gated on the same
permission keys as the sidebar, so it never offers a door the nav has hidden. A
pending school sees its four onboarding screens and nothing else. The empty
state says so out loud: "This searches screens, not records." It is the shell a
real search drops into when there is something to call.

**The backend wins on school name and currency.** The design makes the name
editable and offers GBP; the name is deliberately off the update serializer,
because the spreadsheet importer identifies a school by name when a row carries
no slug, so a rename silently turns a school's own import file into a request to
create a second school. Currency stays Naira and US Dollar. The screen is off-
design in those two places and correct in both.

**The bell is real.** `GET /v1/notify/unread-count/` already exists, is already
open to a pending school, and its docstring says it drives the bell badge. No
count, no badge - which is what zero looks like anyway, so it needs no error
state.

Below `lg` the search box collapses to its icon: a 560px field cannot sit
between a title and three controls on a 390px screen without one of them
leaving.

### Phase 4 - Roles and invitations - MOSTLY NOT OURS

**This phase was planned wrong and the FRD caught it.** What shipped is the
`isStaff` explanation screen. The roles workshop is Module 4's and is not built
here.

Three sources agree, and only the raw prototype disagrees:

- **The design's own update (B3)** removes custom role creation, the
  module-grouped permission picker, the role preview drawer, the role-file
  import and the staff invitation panel from the pre-go-live app, in those
  words, because none of it is reachable by a school that has not gone live.
- **The FRD (FR-006)** scopes M9's entire roles involvement to two verification
  conditions - an active whole-tenant `school_admin` assignment, and that
  template carrying at least one granted permission - and states the limit
  plainly: "This module exposes the failure and never silently re-provisions."
- **The FRD's dependency table** assigns roles and permissions to Module 4. M9
  consumes its evaluator and scoping and owns none of it.

The prototype still contains `isRoles` (16 KB: tabs, custom roles, a permission
picker, an invitation table) because it was drawn from the original brief, and
it also contains `isStaff` (1.5 KB), which is the update's replacement for it.
Both are in the file. The phase list in this document was built from the screen
inventory without weighting the update, which is how a Module 4 project ended up
scheduled as M9's phase 4.

**Shipped:** `/onboarding/staff` - the explanation, and the one action that
works (set the optional step aside). The card links to it.

**Moved out of this plan:** the roles workshop, the permission picker, the
preview drawer, the bulk upload, and the invitation table. They belong to
Module 4 and need its API, which is closed to a pending school by design.

### Phase 5 - Data intake, validation and the import wizard
Backend: open the `vs_import_data` batch and template surface to a pending
school. Frontend: `isData`, `isValidation`, the 7-step `importOpen` wizard, the
cancel-import and import-with-warnings modals.
**Ships:** screens 9, 10 and the largest overlay. The engine already exists, so
this is orchestration UI over a real API.

### Phase 6 - Academic structure wizard (BLOCKED on M13)
The academics module is M13's, designed and owned separately, so the backend
half is not ours. What is ours is the 5-step wizard: the intro with its
manual-versus-upload choice and glossary drawer, session and term setup with the
timeline preview, departments and programs with bulk add and the conflict panel,
classes with auto-generate, and review and lock - plus the eight error states
listed in section 1.

**Blocked until M13 ships an API.** Two things unblock it and both come from
them: the endpoint shapes, and whether the platform can verify a structure once
it exists. The second one changes the control room: `ACADEMIC_STRUCTURE` is the
one self-attested step today ("We take your word for this step"), and it stops
being self-attested the moment there is something to check.

**What we do in the meantime:** nothing in this phase. It is parked, not
started. Bringing it forward as a stubbed wizard would mean building five steps
against invented endpoint shapes and rebuilding them when the real ones arrive.

**Ships when unblocked:** the largest screen in the design.

### Phase 7 - Sweep
Every remaining state from section 1 walked against the seeded cast, a
side-by-side diff against the prototype, the responsive probe over every route,
and a written list of anything we chose to leave different from the design.

---

## 4. Order, and why

Phase 2 comes before any screen work because every later phase is verified
against those schools. Phase 3 is next because it is the highest-visibility work
and needs no backend. Phases 4 and 5 are backend-surface work over engines that
already exist, so they are cheap relative to their screen count.

Phase 6 is last and is the only one we cannot schedule, because the module it
needs belongs to M13. That is also why it is safe to leave until the end:
nothing in phases 1 to 5 depends on it, and the control room already handles its
absence honestly. Phase 7's sweep can run without it, and re-run when it lands.

**The critical path we control ends at Phase 5.** If M13 is late, everything
except one screen is still finished.
