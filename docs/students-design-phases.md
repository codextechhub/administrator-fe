# Student Management: design breakdown and build phases

Source: `docs/claude-designs/Student_Management.html` (bundled export, 773 KB).
Unescaped markup: 334,788 chars, **188 `sc-if` blocks, all 188 accounted for**.
Backend read against `apps/apps/urls.py` and `apps/schools/vs_students/` in the
`backend` repo, at commit state of 2026-08-30.

> **Status, 2026-09-02: shipped, refitted to the design, and scoped by year.**
> Written as a plan and kept as a record. Section 3 carries what each phase
> built and the commit it landed in, with the original scoping text left under
> each heading so the two can be compared. Section 3b carries the refit that
> followed, which is where the design fidelity actually came from.
>
> Every backend ask in section 2 is closed. Section 5 is empty.
>
> Driven end to end against `lagoon-view` (live, two branches) and
> `sunrise-academy` (live, one branch, the recede case). 593 frontend tests and
> 217 `vs_students` tests pass; no route overflows at 390px or 820px.
>
> **Two rulings in here were reversed after being made and justified.** Both are
> kept with their reasoning rather than edited away, because in each case the
> original argument was reasonable and still wrong, and the shape of the mistake
> is the useful part: see 2.0 (the session lens) and 3b (borderless surfaces).

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

### 2.0 The session ruling, and its reversal

**Both lenses are wired.** Settled 2026-09-02, reversing the 2026-08-30 ruling
below. Do not re-open without a new reason.

The original ruling said branch was wired and session was not, because
`Student.status` is a single current column and `StudentGuardian` and
`StudentDocument` carry no session at all - so a year filter would return a
register part historical and part current with nothing separating the two.

**That reasoning was wrong, and the way it was wrong is worth keeping.** It
threw away the two things a year CAN answer in order to avoid mis-stating the
one it cannot, when the fix was to label the one:

- **The roll is per-year.** Lagoon View had 85 students in 2026/2027 and has 73
  in 2027/2028. Those are different rolls, not one roll differently filtered.
- **The class is per-year.** Amaka Adeleke reads SSS1 A in the first and SSS2 A
  in the second, which is the entire point of a promotion.

Neither question has an answer without a year. Status still has none, so the
summary returns `status_is_current` and every screen under a past year says so
in words:

> Showing the 2027/2028 roll and the classes held that year. Statuses are
> current: the school records one status per student, not one per year.

Without that line a **Graduated** chip beside a 2026 register reads as a claim
about 2026.

**Three reads deliberately ignore the year**, and each says why in its own
docstring: the unplaced worklist, the enrol form's class picker and the transfer
drawer's. All three feed a placement, placements are made in the running year,
and the module refuses writes against a closed one - so offering last year's
classes would offer a seat that cannot be taken.

**Two counts were wrong and were found by writing the tests for this**, not by
reading the code. `class_seats` had the same `is_active` trap the class register
had: a promotion turns every row of the year it leaves to `False`, so a class
that held thirty children reported nought under a past-year lens. It now counts
each student's LAST row in the year asked about. And `guardian_directory` was
paginated with no `ORDER BY`, so Postgres could return page 2 carrying a
guardian already seen on page 1 and drop another entirely.

### 2.1 Decisions taken while building

Recorded because each cost a false start, and re-litigating them would cost
another.

1. **A class belongs to a YEAR** (backend `dc85d16`, landed mid-build). Every
   session has its own JSS1 A, all named JSS1 A. Every picker must scope to the
   active year or it offers two identical options, one of which the server
   refuses on save. This is why `class_seats` filters on session.
2. **`next_level` has three states, not two.** Set, terminal, and *nobody has
   wired it*. Merging the last two graduated whole year groups; see the phase 6
   findings.
3. **Seat counts live in `vs_students`, not `vs_academics`.** The enrolment row
   is this module's, so putting the aggregate on the academics class list would
   make an M13 view import a school app it must not know about.
4. **The admission number is read from the school's own numbers**, never from
   the pattern. A regular expression cannot be inverted, and `CSS-24-0117` is as
   valid a format as `BFS/2025/0142`.
5. **The design's step counts are not binding.** The import wizard is four steps
   rather than seven: three of the design's describe work the engine does in one
   call. A step a reader presses Next through is a page, not a step.

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

### Bucket 4: absent - **both built, `09c2054`**

No endpoint at all, at the time of the audit. Both were built rather than
dropped; what they became is noted under each.

1. **A class list with live seat counts.** Three separate controls render
   `JSS1 A - 33/35` for *every* class: the enrol form's entry-class select, the
   transfer drawer's destination select, and the assign screen's "Assign into..."
   select. `GET /v1/academics/classes/` returns `capacity` but no `used`.
   `GET /v1/students/classes/<id>/roster/` returns `seats_used` for **one** class.
   Eight classes means eight requests, and it grows with the school. Nothing
   serves this. **Ours to build (backend), small: one annotated queryset, either
   `?with_seats=true` on the academics class list or a new
   `GET /v1/students/classes/seats/`.**
   → Built as `GET /v1/students/classes/seats/`, in `vs_students` for the reason
   in 2.1. `fullest_classes` reads through the same aggregate, so the directory's
   capacity panel and the pickers cannot disagree about a load. Scoped to the
   active year, which is not incidental: see 2.1 decision 1.
2. **A next-admission-number suggestion.**
   `GET /v1/students/admission-number-policy/` returns `{required, pattern, hint}`
   only. The design pre-fills the admission field with the next free number in
   the session's year and offers a control to reset it back to that suggestion.
   There is no generator anywhere in `vs_students`. **Ours to build, or to drop:
   see the ruling below.**
   → Built, but not the way the design draws it. The suggestion is read from the
   numbers the school already issues and its trailing digits incremented, so
   `CSS-24-0117` works as well as `BFS/2025/0142`; zero padding survives and the
   width grows only on a real overflow. It returns "" rather than guessing when
   there is no series, no trailing number, or the successor fails the school's
   own pattern. On the form the value is *derived* rather than written into
   state, so clearing the box stays cleared. There is no "reset to suggestion"
   control - the field simply shows the suggestion until somebody types.

### Endpoints with no screen

Running the audit the other way. Each of these is either a gap in the design or
dead API.

| Endpoint | Reading |
|----------|---------|
| `POST /v1/students/bulk/status/` | The design **refuses** it on purpose: "Bulk status changes are applied one student at a time so each keeps its own reason." **Ruled on: the design wins.** The status drawer takes a reason per student and writes it to that student's history, and a bulk route cannot carry one reason honestly across twenty children. The endpoint stays unused. |
| `PUT /v1/students/admission-number-policy/` | No screen writes the school's admission rule. Probably belongs in school settings, not this module. |
| `POST .../confirm/`, `/reject/`, `/withdraw/`, `/suspend/`, `/reactivate/`, `/transfer-out/` | Six dedicated verbs. The design routes everything through one status drawer, which maps to `POST /<id>/status/`. `confirm` and `reject` are still reachable from the Applicants board; the other four would go unused. |
| `GET /v1/students/<id>/status-history/` | The profile's History tab uses the merged `/history/` instead. Dead for this design. |
| `GET /v1/students/promotions/<id>/` | The design reads its counts from the run's own response and never re-fetches a batch. There is no "past promotions" screen; that is a gap in the design, not dead API. |
| `POST /v1/import/batches/<id>/jobs/<id>/rollback/` | The import hub lists past batches and their outcomes but offers no undo. Gap in the design. |
| `GET /v1/guardians/?unlinked=true` | The guardian list never shows a guardian with no wards. |

### Elements nothing can serve - all ruled on

1. ~~Next admission number, and the "reset to suggestion" control~~ **Ruled on:
   built.** The generator reads the school's own numbers rather than the pattern.
   The reset control was dropped as unnecessary once the value was derived.
2. ~~"Print profile"~~ **Ruled on: dropped.** The design itself only fires a
   toast, and there is no print or PDF endpoint. Not shipped; a browser print
   stylesheet remains the cheap option if anyone asks.
3. ~~The session pill as a switch.~~ **Ruled on: see 2.0.** The pill is a label.
   The historical question is served by `?session=` on the class roster and by
   the profile's class trail, both of which read the enrolment row rather than a
   current-state column.
4. ~~The import template's column list.~~ **Ruled on: the server's template
   wins**, and phase 7 reads it. Fifteen columns, not the design's twelve, and
   the extra ones are load-bearing - `guardian_email` is how siblings are joined,
   so the design's twelve would split every family imported in one file. The
   headings are the template's display names ("First Name"), which is what the
   engine matches on.
5. ~~The `fees` field~~ **Ruled on: ignored.** Never rendered anywhere in the
   design, and no screen was built for it.

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

### Phase 1 - Directory and Profile (read-only) - **DONE**, `475d3e2` + `e648d53`

Shipped as scoped, plus the foundations: routes, the API slice, the two missing
permission codes, and the route-aware `LensRail`.

**Found while building.** The branch lens narrowed the table and not the tiles -
87 students printed over 49 rows with nothing marking the difference. Fixed in
the backend (`15d3a2b`) by moving `?branch=` onto a shared resolver used by the
list, summary, unplaced, roster and guardian directory; six tests pin it. Also a
hidden id that stopped a row rendering.

*Original scope follows.*


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

### Phase 2 - The drawer bundle, the confirm modal and the toast - **DONE**, `475d3e2`

All five drawers, the confirm modal and the toast. The status drawer reads
`allowed_transitions` off the student rather than carrying its own copy of the
state machine, so it can never offer a move the server refuses - the design's
hard-coded impact map was not needed.

*Original scope follows.*


The largest single artifact in the design, and the point at which the module
stops being a report and becomes a tool. Five drawers in one shell: Edit record,
Change status, Transfer class, Link guardian, and the confirm modal and toast
they all use. Wired from the directory row menu and the profile action bar,
which both light up fully at the end of this phase.

Note: **the transfer drawer's destination select needs seat counts** (bucket 4).
Ship it naming the classes without `used/capacity` and add the numbers when the
backend lands, rather than firing one roster request per class.

### Phase 3 - Enrol, and the Applicants board - **DONE**, `ee3e093` + `1ce4381`

Shipped, then reshaped: the form became a five-step flow (`1ce4381`) after the
single page proved to be a wall of 21 fields that lit up eight errors at once on
first save. Next validates only the current step, reached steps stay clickable,
the rail carries a per-step count of what is missing, and a field-keyed 400
jumps to the step that owns the field.

**Divergence from the design, deliberate.** Confirming an applicant calls
`POST /<id>/confirm/`, which moves them to Enrolled *without* a class - it does
not re-run enrolment. An enrolled student with no class is the "unassigned"
state the module tracks, and the class is assigned separately with its own
reason and audit line.

*Original scope follows.*


19 states and 8 field errors on the form, and the applicants board is where most
enrolments start (its "Enrol" button carries the applicant's details into the
form). Includes the inline guardian rows with sibling detection and the
one-primary-contact rule, the document checklist, and the capacity warning that
warns without blocking.

Depends on the ruling about the admission number suggestion.

### Phase 4 - Classes & Transfers - **DONE**, `d09a122`

Two tabs, both in the URL so the capacity panel deep-links into a register.
Bulk assign reports per-student results by name, because the route answers per
student and "2 could not be placed" says nothing about which two.

**Found while building.** The refusal panel immediately caught a cross-branch
rule, which exposed the better fix: do not offer the refusal. Both destination
pickers now filter to the student's own branch plus school-wide classes - the
transfer drawer had been offering all seven classes where four would have been
rejected.

*Original scope follows.*


Two tabs. Unassigned (multi-select, assign into a class, over-capacity warning)
and Roster (class picker, seat bar, per-row move). The capacity panel from phase
1 deep-links into the roster tab.

### Phase 5 - Guardians list and Guardian detail - **DONE**, `f4cad4b`

The list leads with the children's names rather than a count, because "3
students" makes a registrar open a row to answer a question the row could have
answered. The link-another-child drawer uses the same endpoint as its phase 2
mirror, so the rules cannot drift. Also wired `/students/search/`, which nothing
had used yet, and made the profile's guardian cards link out to the household.

*Original scope follows.*


Windowed paginator, search, sibling markers, ward cards, and the "link another
child" drawer, which is the sixth drawer and searches students rather than
guardians.

### Phase 6 - Promotion - **DONE**, `1505b27` + `bef48ec`

Four steps. Overrides go to the preview as well as the run, so the counts a
registrar confirms are the ones the run produces - verified by overriding one
student to Repeat and seeing the server return 72/1/0/9 on both.

**The worst finding in the whole build, and it was not in the frontend.** A
level with no promotion target and no terminal flag - "nobody has wired this
yet" - was read as "pupils leave the school here". A preview against seeded
Lagoon View reported **82 students graduating**: the entire roll, JSS1 children
included. Confirming it would have taken them all off the roll, reachable by a
mis-click at any school that has not finished wiring its ladder. Fixed in
`39ee671`: a bare null is now its own cause and *holds*. `Level.next_level`'s own
comment and FRD v2.7 FR-005 both required this guard; it had never been built.
The seeder created every level in that state, which is why no school could
demonstrate a promotion at all - it now wires each ladder.

`bef48ec` then made each exception link to the screen that fixes it.

*Original scope follows.*


Four steps: target session and the class map, per-class review groups collapsed
by default with a tally line, exceptions split into class-wide and per-student
causes, the preview and confirm, and the done panel. Preview and run are the same
classification on the backend, so the screen must send the same overrides to
both.

### Phase 7 - Bulk import - **DONE**, `dc2cdc1`

**Four steps, not the design's seven.** Three of the design's describe work the
engine does in one call; column matching in particular is something it decides
and never asks about, so a screen for it would promise a control that does not
exist. The column list is the server's template - fifteen columns, not the
design's twelve, and the extra two are load-bearing.

Gated on `school.students.import`, which the backend keeps in its own bundle
away from the enrol keys. The route refuses it as well as the sidebar hiding it.

**Note for other environments.** `school.students.import` and `.export` existed
in code but had no `Permission` rows in the dev database; `seed_all_permissions`
created them.

*Original scope follows.*


The hub (required columns, template downloads, past batches with their outcomes)
and the 7-step wizard. Reuses the patterns already built for onboarding import
(`src/pages/protected/onboarding/import.tsx` and `import-validation.tsx`). The
Columns step is built from the API's template, not the design's 12-column list.

### Phase 8 - Command palette - **DONE**, `b1409b9`

Mostly the removal of an apology. The palette carried a note saying it could not
search the school because no endpoint existed; M11 shipped one, so the promise
is now kept. Students appear above the actions on two characters, gated on the
same key the directory checks, and join the existing keyboard model rather than
sitting beside it - every action index is offset past them, including the
ungrouped branch where two rows would otherwise have claimed index 0.

The header pills needed no work: they already existed, and phase 1 made the rail
route-aware.

*Original scope follows.*


Cmd/Ctrl+E palette with live student hits over `/students/search/`, merged into
the existing action palette (`src/lib/action-palette`) rather than built beside
it. Small, and last because nothing else waits on it.

The header pills are **not** in this phase: both already exist and are wired.
Making the rail route-aware is phase 1 work, per 2.0.

### Backend asks - all closed

| Ask | Landed |
|-----|--------|
| A live single-branch school with students | Phase 0, `sunrise-academy` |
| A live MULTI-branch school with students | Phase 0, `lagoon-view` |
| `?branch=` on summary, unplaced, roster and guardians | `15d3a2b`. One shared resolver on the mixin rather than five copies; six tests pin that the branches sum to the whole school |
| Class list with live seat counts | `09c2054`. `class_seats`, one aggregate, read by all three pickers *and* by the directory's capacity panel so they cannot disagree |
| Next admission number generator | `09c2054`. Read from the school's own numbers, not the pattern |
| `LensRail` route-aware (frontend) | Phase 1 |

Two were dropped rather than built, and the reasons are worth keeping:

- ~~`register_screen` for the directory's Export button.~~ **Built afterwards**
  (backend `a0de88d`, frontend below). The binding carries `search`, `status`
  and the branch lens, and reports `class` and `level` - a class is a placement
  in a year rather than a column on the student, so the file would cover every
  class. The branch IS carried here where the academics screens report it, and
  the difference is real: a student belongs to exactly one branch and is never
  school-wide.
- **Relaxing `fullest_classes`.** Not needed in the end. The panel's copy was
  written to what the endpoint can actually support ("No class is close to
  full") rather than the design's wording, which would have been a lie at a
  half-full school.

`?session=` on the class roster remains open and unbuilt - nothing in phases 1
to 8 needed it, and it only matters if somebody asks to read a past year's
register. See 2.0 for why it is the *only* session parameter this module should
ever grow.

---

## 3b. The refit, 2026-09-01/02

All eight phases shipped, and then the screens were read against the
prototype's **markup** rather than its state list. That found a class of gap the
phases could not: every screen was functionally right and several were built
from the data model rather than from the design.

### What the markup had that the build did not

| Screen | What was missing | Commit |
|--------|------------------|--------|
| Directory | The page header, the single overview card (six surfaces where the design draws one), filters behind a panel with a facet count, the row's avatar and amber no-class chip | `8202211` |
| Profile | The 72px avatar, dot-separated header facts, the tab tray, borderless panels, the ring empty state, "Not on file" | `81f0276` |
| Classes | The header, and the class picker rebuilt AS the capacity list rather than a bare select | `98e1e4a` |
| Applicants | Board columns rather than a list | `762a946` |
| Guardians | A card grid rather than a table - the useful part of a row is a sentence of names, which a table truncates after the first | `f4cad4b`+ |
| Enrol | Gender as buttons, required asterisks, the guardian matches floating rather than reflowing the form | `46b60b6` |

**The recurring mistake was building from the endpoint.** Given a shape and a
list of states, the result is a correct screen that looks like a table of the
data. The design's own comments say what each screen is FOR, and that is the
part that does not survive being inferred.

### The shared-component sweep, `d4a32f1`

The students screens used four of the twenty-three components in
`components/custom` and reimplemented several of the rest. Two of those
components say in their own comments that this keeps happening:
`segmented-toggle.tsx` records five hand-rolled copies and that "a sixth was
about to be written" - this module wrote the seventh; `surface.tsx` records four
copies of the clickable card of which only two animated - this module wrote a
fifth, with the same dead hover.

Adopted: `SegmentedToggle`, `ClickableCard`, `Panel` (nine surfaces), `KpiCard`
(eight tiles), and `Tabs` on the profile and Classes & Transfers - which also
puts the active tab in the URL, so `?tab=guardians` is a link somebody can send.

**This reversed a call made three commits earlier.** Borders had been removed
from these surfaces to match the prototype. That was fidelity to one module's
mockup at the cost of the app: sixteen files already import the shared surface,
and a registrar moving from Academic Structure to Students would have seen two
treatments of the same white box. House consistency wins; the prototype was
drawn without knowledge of the screens already shipped.

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

### What the order was actually worth

Reads-before-writes paid for itself twice. Phase 1 proved the envelope, the
pagination shape and the branch lens before any mutation existed, and it was
phase 1 that surfaced the 87-over-49 defect - on a read-only screen, where it
cost a backend fix and no rework.

Drawers-second also held. Every screen from phase 3 on opened one that already
worked, and none shipped with a dead menu item.

The one thing the order did not protect against was a dependency landing
*during* the build: a concurrent change gave classes a year (`dc85d16`), which
silently invalidated an assumption in work already written. It was caught by
re-reading the three commits before continuing, not by any test. Worth doing
again next time a module is built alongside its backend.

---

## 5. What is left

Nothing. All eight phases shipped and every loose end below is now closed;
the list is kept as a record of what the build uncovered.

1. ~~The onboarding import page is out of date.~~ **Fixed.** Its prose claimed
   the students dataset had no template and no model; the merge logic was
   already correct, so only the comments and the redundant placeholder needed
   to go. Required templates now sort first, because a live template arrives
   through the server's list and was landing under the optional placeholders.
2. ~~`school.students.import` / `.export` may be missing.~~ **Checked, fine.**
   All eight student keys resolve true for a seeded school administrator on the
   local database, so the gates are live rather than dead. Still worth a glance
   on staging, where the seeder may not have been re-run.
3. ~~The nav badges the design draws.~~ **Built**, `9e2bb49`. Applicants and
   Classes & Transfers carry their counts; the directory gets none, because a
   count of the roll is a fact rather than a job. The query is skipped for a
   PENDING school - firing it from the sidebar would have redirected an
   onboarding school to the not-live screen on every page.
4. ~~`?session=` on the class roster.~~ **Not needed, and the route was
   broken.** M13 gave classes a year, so the roster's session comes from the
   class - a parameter could only ever disagree with it. `ce27dd8`.

**Nothing is outstanding.**

### Defects found after the phases, all fixed

Four, none of them in the phase plan, all found by reading the design or by
writing a test rather than by using the app:

- **`class_seats` reported nought for a past year** (`913eff9`). Same
  `is_active` trap as the class register: a promotion turns every row of the
  year it leaves to `False`. Now counts each student's last row in the year
  asked about, which also settles a mid-year transfer.
- **The guardian directory was paginated with no `ORDER BY`** (`913eff9`).
  Postgres could return page 2 carrying a guardian already seen on page 1 and
  drop another entirely, with nothing to tell the reader.
- **A near miss, caught while writing it** (`9e2bb49`). Wiring the nav counts
  meant the SIDEBAR calling a student endpoint, which a pending school is
  refused - and the refusal redirects. Unguarded, every onboarding school would
  have been thrown off whatever page they opened, on every page.

### Two defects found while finishing, both fixed

Neither was in this module's scope, and both were breaking something in front
of a user.

- **The class register answered for the wrong year** (`ce27dd8`). `SSS2 B` in
  2027/2028 holds twenty-five children and its register read `0 of 30`, because
  the view used the school's ACTIVE year rather than the class's own. Silent:
  an empty class is an ordinary thing for a register to say, and nothing named
  the year it had looked in.
- **Every `/v1/notify/` request 500d** (`acee29d`, backend). Notifications
  migration `0010` could not be applied to any database holding a row: Django
  defers a new column's index to the end of the migration, so the order became
  ADD COLUMN, UPDATE every row, CREATE INDEX - and Postgres will not index a
  table whose rows the same transaction just touched. Empty database, no rows,
  no failure, which is why it shipped. Split into `0010` schema and `0011`
  data. This affected every page with the notification bell, not this module.

### Dev-data notes

The verification runs left residue in the local database: two `Testimport`
students from phase 7, and a promotion that moved 82 students from 2026/2027
into 2027/2028. `./reseed-dev.sh` restores a clean world and now seeds students
as part of it.
