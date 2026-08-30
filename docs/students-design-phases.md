# Student Management: design breakdown and build phases

Source: `docs/claude-designs/Student_Management.html` (bundled export, 773 KB).
Unescaped markup: 334,788 chars, **188 `sc-if` blocks, all 188 accounted for**.
Backend read against `apps/apps/urls.py` and `apps/schools/vs_students/` in the
`backend` repo, at commit state of 2026-08-30.

---

## 1. What the design contains

### 1.1 Screens

Nine top-level screens. Size is unescaped markup between one screen flag and the
next, which is a fair proxy for how much there is to build.

| # | Screen | Flag | Size | States | Collections |
|---|--------|------|------|--------|-------------|
| 1 | Student Directory | `isDirectory` | 28.7 KB | 16 | 10 |
| 2 | Enrol a Student | `isEnrol` | 24.6 KB | 19 | 8 |
| 3 | Student Profile | `isProfile` | 17.9 KB | 18 | 13 |
| 4 | Promotion | `isPromotion` | 16.1 KB | 14 | 6 |
| 5 | Classes & Transfers | `isAssign` | 12.8 KB | 7 | 4 |
| 6 | Applicants | `isApplicants` | 6.9 KB | 3 | 3 |
| 7 | Bulk Import (hub) | `isImport` | 6.9 KB | 1 | 2 |
| 8 | Guardian detail | `isGuardianDetail` | 5.5 KB | 3 | 1 |
| 9 | Guardians list | `isGuardians` | 4.8 KB | 4 | 2 |

### 1.2 Overlays

**The drawer bundle is the largest single thing in this design.** At 28.0 KB and
32 states it is bigger than the directory, and it is five different drawers
sharing one shell. It is invisible on any screenshot, and five of the nine
screens open one.

| Overlay | Flag | Size | States | What is inside |
|---------|------|------|--------|----------------|
| Drawer | `drawerOpen` | 28.0 KB | 32 | Five drawers: **Link guardian** (search / create-new tabs, duplicate detection, ward list, primary-contact rule), **Link another child** (student search from the guardian side), **Edit record** (three sections: bio, contact, medical; per-field validation; a live "what changed" line), **Change status** (allowed transitions only, per-status impact copy, destination field for transfers, red confirm for heavy moves), **Transfer class** (destination with seat counts, over-capacity warning, reason, effective date) |
| Import wizard | `importOpen` | 18.4 KB | 18 | 7 steps (Upload, Columns, Validation, Review, Confirm, Import, Done) plus a cancel-confirm |
| Command palette | `paletteOpen` | 3.2 KB | 2 | Cmd/Ctrl+E, destinations plus live student hits, empty state |
| Confirm modal | `modalOpen` | 1.6 KB | 2 | trash variant and warn variant |
| Toast | `toastOpen` | - | 4 | ok / info / warn / bad |

### 1.3 Shell

`navExpanded` appears 14 times (collapsible sidebar, every item renders twice).
`branchPillOpen` and `sessionPillOpen` are the two header pills.
`searchWide` / `searchNarrow` swap the header search at 1100px.
`hasApplicants` and `hasUnassigned` are two live count badges in the nav.

### 1.4 The per-row action model

33 row-scoped flags. This is the difference between rendering a list and
rendering a working screen, and none of it shows on a screenshot:

- **Directory row**: `r.ok`, `r.hasClass`, `r.noClass`, `r.menuOpen` (per-row menu whose Transfer item reads "Transfer class" or "Assign class" depending on whether the student has one).
- **Enrol guardian rows**: `gr.isExisting`, `gr.isNew`, `gr.showSiblings` (an existing guardian shows the siblings they already stand for).
- **Documents**: `dr.attached` / `dr.notAttached` on the enrol form, `dp.attached` / `dp.missing` on the profile.
- **Guardian cards**: `gc.isPrimary`, `gc.hasSiblings`, `gw.isPrimary`, `gl.isSibling`.
- **Promotion**: `mp.terminal` (class maps to "Graduates"), `pg2.open` / `pg2.closed` / `pg2.isOpen` / `pg2.terminal` (class groups collapsed by default, with a per-class tally line).
- **Steppers**: `ls.done` / `ls.showBar` (lifecycle), `ws.current` / `ws.done` (wizard).
- **Search results**: `lm.already` and `cm.already` mark a match that is already linked.
- **Pagination**: `pg.isGap` / `pg.isPage` and `gp.isGap` / `gp.isPage`, a windowed paginator (first, last, current +/- 1, ellipses) used on both lists.
- **Menus**: `bm.on` / `bm.off`, `sm.on` / `sm.off` for the branch and session pills.

### 1.5 The unhappy states, listed

These are most of the work and none of the screenshots.

- **Enrol**: 8 field-level error states, an over-capacity warning that does not block, a "no guardian matches" state, a "no guardians linked yet" state, a guardians-section error, and a carried-over-from-applicant mode.
- **Directory**: empty result, no filters set, filters set (count line), two or more filters set (chips row), selection bar open, and a capacity panel with both a rows state and an all-clear state.
- **Profile**: no guardians, no class trail, no audit entries, missing documents, and an off-path state for a withdrawn or graduated student who cannot be placed on the Applicant / Enrolled / Active stepper.
- **Import wizard**: no file, file chosen, validation blocked by errors, validation clean, bad-row table, severity filter, cancel-mid-run, and a done state that reports created and skipped.
- **Promotion**: exceptions by class (terminal level, no class at the next level) and by student (suspended, no class, wrong status), plus a skipped-students line.
- **Assign**: nothing unassigned, roster empty, target over capacity.
- **Guardians**: list empty, guardian with no wards.

### 1.6 The scenario schools in the design

The prototype runs one school, Brightfield, on a fixed clock of 2025-10-06 inside
the 2025/2026 session, with a **branch** pill offering Lekki and Ikeja and a
session pill offering 2025/2026 (active) and 2024/2025 (archived). The roll is
filled to 145 students precisely so the near-capacity, full and over-capacity
paths are all reachable, and households are built so that some guardians stand
for three children and most for one.

The backend has the matching scenario seeder, `seed_student_scenarios`, with
five schools as of phase 0: `brightfield-lekki` (two branches, full roll, every
status chip), `st-monicas` (one branch, still onboarding), `holy-cross` (two
branches, pending approval), and the two added in phase 0: `sunrise-academy`
(**one branch and live**, the recede case) and `lagoon-view` (**two branches and
live**, the branch-filter case). Only the last two answer at all from a clean
seed - every student endpoint is closed to a school that has not gone live.

---

## 2. What the backend can serve

### 2.0 Decisions already taken

**Branch is wired. Session is not.** Settled 2026-08-30, do not re-open without
a new reason.

The two header pills look alike and are not alike. `Student.branch` is a single,
currently-true fact, so filtering on it reports honestly. There is **no
per-session status, branch, guardian link or document** anywhere in the model:
`Student.status` is one current column and `StudentGuardian` and
`StudentDocument` carry no session. The one thing recorded per year is the class
placement, on `ClassEnrolment.session`.

A global session filter would therefore return a register that is one fifth
historical and four fifths current, with nothing on screen to separate the two:
last year's SSS3 Science listing Ahmed Lawal correctly from his enrolment row,
with today's **Graduated** chip beside his name, and two children filed under the
branch they moved to rather than the one they spent the year at.

So:

1. `?branch=` goes on summary, unplaced, roster and guardians, matching the list
   view that already has it. Every students query reads `useBranchLens()`.
2. `?session=` goes on the **class roster only**, where the enrolment row answers
   the question completely and no current-state column is involved.
3. **No other students query reads the session lens.**

If a school later needs a genuinely historical directory, that is a per-session
status snapshot, which is a data-model change. Decide it against a real need.

**Both pills already exist**, and this is where the ruling costs something.
`BranchPill` and `SessionPill` are built (`src/components/layout/lens-pills.tsx`),
backed by `useBranchLens` / `useSessionLens`, and already carry the recede rules
(one branch, no pill; one session, no pill; a branch-tied admin gets a label
rather than a menu). Academics, classes and calendar consume them.

But `LensRail` is rendered **globally in the sidebar**
(`src/components/app-sidebar.tsx:384`), not per route. The `lens` route handle
gates only the header's read-only notice. So the session pill is on the student
directory whether or not this module reads it, and turning it will do nothing.

That is precisely the hazard the house already wrote down, and it names this
screen while doing it (`src/components/layout/dashboard-layout.tsx:66`):

> "A session pill over the student roster would be a control that changes
> nothing, and a branch pill on a screen that does not filter by branch is
> worse: it looks like it narrowed the page."

The comment describes an opt-in that the rail does not actually implement.
**Phase 1 therefore has to make the rail route-aware**: a handle declaring which
lenses a screen reads, with `LensRail` rendering only those. Students declares
branch. Academics and calendar declare both, which is what they do today, so
nothing regresses. Small, and it is a house-convention fix rather than a
students one, so it belongs in the shared layout with the comment updated to
match.

### Bucket 1: served and wired

**Nothing.** There is no student code in this frontend at all: no page, no route,
no API slice, no type. `src/permissions/index.ts` holds four student permission
codes and that is the entire footprint.

### Bucket 2: served, not wired

The backend module `schools.vs_students` is complete and mature: 3,949 lines,
30 routes, RBAC on every view, tenant scoping asserted in the view rather than
inherited, and a services layer the seeder drives the same way the API does.
Every screen below has its endpoints today.

| Screen | Endpoints |
|--------|-----------|
| Directory | `GET /v1/students/summary/`, `GET /v1/students/?search=&class=&level=&status=&branch=`, `GET /v1/students/unplaced/` (nav badge). Note: **only the list takes `?branch=`** - see bucket 3. |
| Profile | `GET /v1/students/<id>/`, `/guardians/`, `/subjects/`, `/class-history/`, `/documents/`, `/history/` |
| Edit drawer | `PATCH /v1/students/<id>/` |
| Status drawer | `POST /v1/students/<id>/status/` (one route, the state machine refuses illegal moves) |
| Transfer drawer | `POST /v1/students/<id>/assign-class/` (assign and transfer are the same route) |
| Link guardian | `GET /v1/guardians/?search=`, `POST /v1/students/<id>/guardians/`, `PATCH` and `DELETE /v1/students/<id>/guardians/<gid>/` |
| Enrol | `POST /v1/students/` (with `as_applicant`, inline guardian rows, `allow_over_capacity`, `confirm_duplicate`), `GET /v1/students/admission-number-policy/` |
| Applicants | `GET /v1/students/?status=APPLICANT`, `POST /v1/students/<id>/confirm/`, `POST /v1/students/<id>/reject/` |
| Classes & Transfers | `GET /v1/students/unplaced/`, `POST /v1/students/bulk/assign-class/`, `GET /v1/students/classes/<id>/roster/` (returns `seats_used`, `capacity`, `class_name` beside the rows) |
| Guardians | `GET /v1/guardians/`, `GET /v1/guardians/<id>/`, `GET /v1/guardians/<id>/students/` |
| Promotion | `POST /v1/students/promotions/preview/`, `POST /v1/students/promotions/` |
| Import | `GET /v1/import/system-import-templates/`, `POST /v1/import/batches/`, `/validate/`, `/issues/`, `/issues/export/`, `/start-import/`, `/jobs/` |
| Palette | `GET /v1/students/search/?q=` |
| Documents | `GET`/`POST /v1/students/<id>/documents/`, `DELETE .../<doc_id>/` (the serializer carries a `url`, so "view" works) |

### Bucket 3: exists but closed

A surface flag or a few lines apart, not a module apart.

1. **Directory CSV export.** The `school.students` dataset **is** registered with
   the Export Centre by `VsStudentsConfig.ready`, but `vs_students` never calls
   `register_screen(...)`. `vs_academics` does exactly that in about twenty lines
   of `export_datasets.py`. Until it does,
   `GET /v1/exports/from-screen/?screen=students` has no binding and the
   directory's "Export" button has nothing behind it. **Backend, one file.**
2. **The capacity panel's shape.** `fullest_classes(...)` returns at most **3**
   classes and only those with **5 or fewer seats free**. The design shows the
   fullest **4 whatever the load** (its own comment: the panel answers "where
   will I struggle to place the next student", which has an answer at any load),
   plus a rest-line ("2 more near capacity, 3 with room") and an empty state
   worded "No class holds any students yet". Today the panel would go blank at a
   half-full school and say the wrong thing about why. **Backend, one function.**
3. **Two permission codes missing from the frontend registry.**
   `school.students.import` and `school.students.export` exist on the backend
   (`constants.py`) and are seeded into school roles, but have no `MMRRAA` code
   in `src/permissions/index.ts`. **Frontend, two lines.**
4. **`?branch=` is on one endpoint out of the module.** `StudentListCreateView`
   accepts it (`views/students.py:129`); summary, unplaced, the class roster and
   the guardian directory do not. Switching the branch pill today moves the table
   and leaves the four tiles above it reading the other branch's numbers, with
   nothing on screen saying so. **Backend, the same one-line change four more
   times.** Per the ruling in 2.0 this is a phase 1 ask, not a later one.
5. **`?session=` on the class roster.** `ClassRosterView` reads
   `self.active_session`; the enrolment rows it queries are already stamped per
   session, so answering for a past year costs a parameter, not a schema.
   **Backend, small.** Nothing else in the module gets one.

### Bucket 4: absent

No endpoint at all. These are the ones that cost.

1. **A class list with live seat counts.** Three separate controls render
   `JSS1 A - 33/35` for *every* class: the enrol form's entry-class select, the
   transfer drawer's destination select, and the assign screen's "Assign into..."
   select. `GET /v1/academics/classes/` returns `capacity` but no `used`.
   `GET /v1/students/classes/<id>/roster/` returns `seats_used` for **one** class.
   Eight classes means eight requests, and it grows with the school. Nothing
   serves this. **Ours to build (backend), small: one annotated queryset, either
   `?with_seats=true` on the academics class list or a new
   `GET /v1/students/classes/seats/`.**
2. **A next-admission-number suggestion.**
   `GET /v1/students/admission-number-policy/` returns `{required, pattern, hint}`
   only. The design pre-fills the admission field with the next free number in
   the session's year and offers a control to reset it back to that suggestion.
   There is no generator anywhere in `vs_students`. **Ours to build, or to drop:
   see the ruling below.**

### Endpoints with no screen

Running the audit the other way. Each of these is either a gap in the design or
dead API.

| Endpoint | Reading |
|----------|---------|
| `POST /v1/students/bulk/status/` | The design **refuses** it on purpose: selecting several students and choosing "Change status" shows "Bulk status changes are applied one student at a time so each keeps its own reason." Design and API disagree; needs a ruling. |
| `PUT /v1/students/admission-number-policy/` | No screen writes the school's admission rule. Probably belongs in school settings, not this module. |
| `POST .../confirm/`, `/reject/`, `/withdraw/`, `/suspend/`, `/reactivate/`, `/transfer-out/` | Six dedicated verbs. The design routes everything through one status drawer, which maps to `POST /<id>/status/`. `confirm` and `reject` are still reachable from the Applicants board; the other four would go unused. |
| `GET /v1/students/<id>/status-history/` | The profile's History tab uses the merged `/history/` instead. Dead for this design. |
| `GET /v1/students/promotions/<id>/` | The design reads its counts from the run's own response and never re-fetches a batch. There is no "past promotions" screen; that is a gap in the design, not dead API. |
| `POST /v1/import/batches/<id>/jobs/<id>/rollback/` | The import hub lists past batches and their outcomes but offers no undo. Gap in the design. |
| `GET /v1/guardians/?unlinked=true` | The guardian list never shows a guardian with no wards. |

### Elements nothing can serve

Each needs a one-line ruling before it is built or dropped.

1. **Next admission number, and the "reset to suggestion" control** (bucket 4
   above). Build the generator, or make the field empty with only the school's
   pattern hint.
2. **"Print profile"** (`pPrint`). The design itself only fires a toast. There is
   no print or PDF endpoint. Drop it, or make it a browser print stylesheet.
3. ~~The session pill as a switch.~~ **Ruled on: see 2.0.** The pill is a label.
   The historical question is served by `?session=` on the class roster and by
   the profile's class trail, both of which read the enrolment row rather than a
   current-state column.
4. **The import template's column list.** The design hard-codes 12 columns; the
   seeded `students_v1` template carries 15 (it adds `branch`, `guardian_email`
   and `previous_school`, and its own comment says the design's 12 would split
   every family imported in one file). Build the Columns screen from the template
   the API returns, never from the design's list.
5. **The `fees` field** on the design's mock students. Never rendered anywhere.
   Ignore it.

---

## 3. The phases

Every phase builds, has its tests passing, and has been driven in a browser
against the real API at 390px and desktop before it is called done.

### Phase 0 - Seed, and prove the data (backend, no frontend) - **DONE 2026-08-30**

Wired `seed_student_scenarios` into `reseed-dev.sh` after the timetable seeder,
applied the two `vs_students` migrations (the local DB had never run them), and
seeded. **87 students, 18 guardians per school across all three**, covering
active, applicant, enrolled, suspended, withdrawn, transferred and rejected.
Re-running leaves the counts unchanged, so it is idempotent as documented.

Then drove all nineteen phase 1 endpoints as `admin@holy-cross.example.com`.
Results below. Two defects found and fixed; the original text of the phase
follows.

**What answered.** Summary (total 87, on_roll 82, active 80, applicants 2,
unassigned 1, by_status populated), list with every filter the directory sends
(`status`, `class=unassigned`, `search`, `branch`), unplaced, palette search,
admission policy, the six profile reads, and all three guardian reads.

**Only `holy-cross` is drivable.** `brightfield-lekki` and `st-monicas` answer
`403 TENANT_NOT_LIVE` on every student route, which is correct: this module
declares no `pending_tenant_surface`, so absence means closed. Drive the module
against holy-cross and nothing else.

**Two live schools were added to the cast, and they fixed a second hole.**
`sunrise-academy` (one branch, driven live the same way `lagoon-view` is) joins
all three seeder casts; `lagoon-view` (already live, two branches) joins the
academics and students casts. Verified against the API:

| School | Branches | Live | Roll | Directory row |
|--------|----------|------|------|---------------|
| `sunrise-academy` | 1 | yes | 84 | **no `branch` field at all** |
| `lagoon-view` | 2 | yes | 84 | `branch` present, narrows 35 / 49 |
| `holy-cross` | 2 | by hand | 84 | `branch` present, narrows 35 / 49 |
| `st-monicas` | 1 | no | - | 403 TENANT_NOT_LIVE |
| `brightfield-lekki` | 2 | no | - | 403 TENANT_NOT_LIVE |

`sunrise-academy` is the recede case, observable for the first time.
`lagoon-view` is the branch-filter case, and it is live straight out of a clean
reseed with no manual approval.

It also closed a hole nobody had noticed. The onboarding cast parks
`holy-cross` at **pending approval**, not live - it is live in this developer's
database only because it was activated by hand. The academics and students
seeders both claimed in their docstrings that holy-cross was "Two branches AND
LIVE. This is the one to drive the module against", which was never true of a
freshly seeded world. So **after a clean `./reseed-dev.sh`, every student route
answered 403 TENANT_NOT_LIVE and the module was entirely undrivable.**
`sunrise-academy` is now that school, and the two stale docstrings say what is
actually true.

**No onboarding state was lost.** `holy-cross` stays parked at "pending
approval" in the cast, which is what gives the admin console a go-live request
to review, and it stays live in this developer's database because it was
approved by hand. `lagoon-view` carries the live multi-branch case instead, so a
clean reseed needs no manual approval to make this module drivable.

**The earlier open question, now resolved.** `st-monicas` is the single-branch school the
seeder's docstring said existed to show the branch dimension receding - and it
is PENDING, so no student endpoint ever answers for it. Taking it live would
have cost the cast its only "ready, go-live form open" school, so a new cast
member was added instead. Resolved by `sunrise-academy` above.

**The branch gap, now measured rather than argued** (holy-cross, 2 branches):

| Call | Total |
|------|-------|
| `GET /v1/students/` | 84 |
| `GET /v1/students/?branch=31` (Annex) | 35 |
| `GET /v1/students/?branch=19` (Main) | 49 |
| `GET /v1/students/summary/` | 87 |
| `GET /v1/students/summary/?branch=31` | **87** - parameter ignored |

That is the failure in 2.0 with real numbers behind it: the table narrows to 35
and the tiles above it keep saying 87.

**Two defects found and fixed** (`views/records.py`, `views/base.py`):

`GET /v1/students/<id>/history/` - the profile's History tab - answered **500
for every student at every school**. Two faults, one wrong assumption each:

1. `AuditEvent` stamps `event_at`, not `created_at`. The view ordered by and
   read `created_at`, the name every other model in the repo uses.
2. `StudentHistoryView` is a plain `APIView` and called `paginate_queryset`,
   which DRF only builds on `GenericAPIView`.

**Root cause, and why it was fixed at the choke point.** Both are the same
mistake: an `APIView` in this module reaching for machinery it does not have.
The module already knew about it - `views/base.py` documents exactly this for
`get_serializer_context`, which raised AttributeError on twelve action views for
the same reason. The mixin also sets `pagination_class` for all twenty-two
views, so every one of them *looks* paginated while the twelve `APIView`s
silently are not. So the paginator is now back-filled onto `APIView` in
`StudentsViewMixin` beside the serializer-context fix, closing the trap for the
next view rather than patching the one that hit it. Generic views are untouched:
the mixin is first in every MRO, so `super()` finds DRF's own implementation.

**Why no test caught a hard 500.** `test_security.py` does exercise
`student-history`, but only as a caller holding nothing, asserting 403 -
permission is checked before the handler runs, so the body was never reached.
Added `HistoryTabTests` in `tests/test_shape.py`: four cases covering an audit
event present, the pagination block, newest-first ordering, and the empty case.
Each was confirmed to fail with either fix reverted. **Module suite: 155 tests,
all passing** (was 151).

The original scope of this phase, for reference:

`seed_student_scenarios` already exists and is **not** in `reseed-dev.sh`
(which runs `seed_onboarding_scenarios`, `seed_academic_scenarios` and
`seed_timetable_scenarios`, then stops). Add it after the academic seeder, run
it, and confirm `holy-cross` answers summary, list, unplaced, roster, guardians,
history and promotion preview with real rows.

Ships: nothing visible. Blocks everything, because a screen cannot be checked
against an endpoint that returns nothing.

### Phase 1 - Directory and Profile (read-only)

The front door and the record behind it. Both are pure reads, so this phase has
no write path to get wrong and it ships a genuinely usable module.

Also lays the module's foundations: `routesPath.PROTECTED.STUDENTS`,
`students-routes.tsx`, the sidebar entries with their two live badges, the
`students-api.ts` / `students-types.ts` slice, and the two missing permission
codes. Every query in the slice reads `useBranchLens()`; none reads the session
lens.

Includes the shared-layout fix from 2.0: `LensRail` becomes route-aware so the
student screens show the branch pill and not the session pill. It is a house
convention that the layout already documents and does not yet enforce, so the
fix belongs in `lens-pills.tsx` and `app-sidebar.tsx`, with console-fe kept in
step if it carries the same rail.

- Directory: KPI strip, the single status bar, the capacity panel, filters with
  the facet count / count line / chips row, list **and** card views, the windowed
  paginator, the row menu (Open profile only, for now), the selection bar, the
  empty state.
- Profile: header with lifecycle stepper and off-path state, six tabs (Overview,
  Guardians, Academic, Medical, Documents, History) with all four empty states.

### Phase 2 - The drawer bundle, the confirm modal and the toast

The largest single artifact in the design, and the point at which the module
stops being a report and becomes a tool. Five drawers in one shell: Edit record,
Change status, Transfer class, Link guardian, and the confirm modal and toast
they all use. Wired from the directory row menu and the profile action bar,
which both light up fully at the end of this phase.

Note: **the transfer drawer's destination select needs seat counts** (bucket 4).
Ship it naming the classes without `used/capacity` and add the numbers when the
backend lands, rather than firing one roster request per class.

### Phase 3 - Enrol, and the Applicants board

19 states and 8 field errors on the form, and the applicants board is where most
enrolments start (its "Enrol" button carries the applicant's details into the
form). Includes the inline guardian rows with sibling detection and the
one-primary-contact rule, the document checklist, and the capacity warning that
warns without blocking.

Depends on the ruling about the admission number suggestion.

### Phase 4 - Classes & Transfers

Two tabs. Unassigned (multi-select, assign into a class, over-capacity warning)
and Roster (class picker, seat bar, per-row move). The capacity panel from phase
1 deep-links into the roster tab.

### Phase 5 - Guardians list and Guardian detail

Windowed paginator, search, sibling markers, ward cards, and the "link another
child" drawer, which is the sixth drawer and searches students rather than
guardians.

### Phase 6 - Promotion

Four steps: target session and the class map, per-class review groups collapsed
by default with a tally line, exceptions split into class-wide and per-student
causes, the preview and confirm, and the done panel. Preview and run are the same
classification on the backend, so the screen must send the same overrides to
both.

### Phase 7 - Bulk import

The hub (required columns, template downloads, past batches with their outcomes)
and the 7-step wizard. Reuses the patterns already built for onboarding import
(`src/pages/protected/onboarding/import.tsx` and `import-validation.tsx`). The
Columns step is built from the API's template, not the design's 12-column list.

### Phase 8 - Command palette

Cmd/Ctrl+E palette with live student hits over `/students/search/`, merged into
the existing action palette (`src/lib/action-palette`) rather than built beside
it. Small, and last because nothing else waits on it.

The header pills are **not** in this phase: both already exist and are wired.
Making the rail route-aware is phase 1 work, per 2.0.

### Backend asks, and what re-opens when they land

Six, all small. Only the first blocks anything: **the branch pill cannot ship
correct without it**, so it lands with phase 1 rather than after it.

| Ask | Re-opens |
|-----|----------|
| `?branch=` on summary, unplaced, roster and guardians | The branch pill telling the truth on every panel, not just the table (phase 1, blocking). Measured in phase 0: the list narrows 84 to 35, the summary stays at 87. |
| ~~A live single-branch school with students~~ | **Done in phase 0**: `sunrise-academy`. |
| ~~A live MULTI-branch school with students~~ | **Done in phase 0**: `lagoon-view`. |
| `register_screen` for the students directory | The directory's Export button (phase 1) |
| Relax `fullest_classes` (limit 4, drop the `remaining <= 5` filter, return totals) | The capacity panel's fourth row, rest-line and correct empty state (phase 1) |
| Class list with live seat counts | The `33/35` labels on three selects (phases 2, 3, 4) |
| Next admission number generator | The enrol form's pre-filled number and reset control (phase 3) |
| `?session=` on the class roster | Reading a past year's register from the Roster tab (phase 4) |

One frontend ask sits alongside them: making `LensRail` route-aware, so the
session pill does not appear over a roster it cannot move (phase 1, blocking for
the same reason).

---

## 4. Order, and why

1. **Seed first.** A phase that builds screens you cannot put into their states is
   a phase you cannot verify. `holy-cross` is the only seeded school that is live,
   and every student endpoint is closed to a school that is not.
2. **Reads before writes.** Phase 1 has no write path, so the whole API contract,
   the response envelope, the pagination shape and the branch/session context get
   proven against the real backend before a single mutation is written.
3. **The drawers second, not last.** They are the biggest artifact and five
   screens open one. Built late, every screen before them ships with dead menu
   items and gets revisited.
4. **Closed-surface work is not a phase.** Five of the six backend asks are small
   enough to land alongside whichever phase wants them; none of them justifies
   parking a
   phase.
5. **Nothing here is blocked on another module.** Academic Structure already
   supplies classes, levels, sessions and subjects, and this frontend already
   consumes all four. **The critical path we control runs the whole way to phase
   8.**

Phase 7 is the one that could be dropped without leaving a hole: a school can
load its roll through the onboarding import surface, which already exists and is
the only student-shaped surface open to a school that is not yet live.
