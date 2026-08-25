# Academic Structure - design breakdown and build phases

Source: `docs/claude-designs/Academic_Structure.html` (bundled export, 665 KB;
126 KB of markup once unescaped, 133 `sc-if` blocks, all accounted for).

Backend read against `/Users/mac/Documents/Dev-Projects/GitHub/backend`,
module `apps/schools/vs_academics` (mounted at `/v1/academics/`).

---

## 0. Decisions taken

**Nav.** "Academic Management" becomes **Academic Structure**, and every screen
in this design becomes a submenu under it:

```
Academic Structure
  ├─ Overview               (the design's main Academic Structure screen)
  ├─ Sessions & Terms
  ├─ Departments
  ├─ Programs & Levels
  ├─ Classes & Arms
  ├─ Subjects
  └─ Assignments
Academic Calendar           (its own top-level item, sibling of the above)
```

**Academic Calendar stays and moves out.** It is no longer a child of Academic
Management; it becomes its own nav item. It is not in this design, so it keeps
its current screens for now and gets its own design pass later. That also
settles the term-events question from the earlier draft: the events list is the
calendar's job, not the session detail's, so the session detail ships without
it and nothing in this plan is blocked on the missing event model.

**Existing screens keep their look; only the data behind them changes.** Where
a screen already exists on dummy data (Sessions list, Session detail, Classes,
and both Calendar screens), the current design is the one that ships. The Claude
prototype supplies what those screens do not have - scope chips, filters, the
table view, the drawer, the confirm modals - and supplies the five screens that
do not exist at all. It does not get to restyle a card the design already got
right. Section 3.1 lists the three places this rule cannot hold, and why.

**The prototype says "campus". We say branch.** Every "campus" in the design's
copy and flag names (`showCampusSelect`, `sessCampusEmpty`, "One campus", "All
campuses") is translated to **branch** as it is built - the word the data model,
the API and the product all use. See the vocabulary rule in CLAUDE.md.

**Permissions follow console-fe.** Studied and reported in section 2, bucket 3:
the architecture is already there and already identical; what is missing is
eleven keys and a test to stop them drifting again.

**Duplicate names follow the backend.** A subject may share a name with a
department. The prototype's one-namespace-for-everything rule is dropped.

**The backend writes the clash message.** It already does this for every other
refusal in the module - `exceptions.py` says so in its own header, that a
message is written for the person reading it on screen and rendered verbatim
under the control that caused it. Duplicates were the one refusal that had not
caught up. See section 2.

**Program, Level and Class get a `description` column.** So the drawer's
Description box means the same thing on all five entity types.

---

## 1. What the design contains

### 1.1 Screens

Eight screens behind one shell. Size is unescaped markup characters, which is a
fairer proxy for work than headings are.

| Screen | Flag | Markup | Its own states |
| --- | --- | --- | --- |
| Overview ("Academic Structure") | `isOverview` | 15.6k | list view / tree view; tree with and without the scope column; expand-all / collapse-all |
| Sessions & Terms | `isSessions` | 13.6k | cards view / table view; empty (twice: cards and table); status filter; search; timeline strip; pagination |
| Session detail | `isSessionDetail` | 4.7k | school-wide vs named-branch chips; per-term state (completed / ongoing / not started); term with events; term with no events |
| Departments | `isDepartments` | 11.7k | cards / table; empty; status filter; scope filter; search |
| Programs & Levels | `isPrograms` | 8.9k | accordion open / closed; program with no levels; empty; scope filter; search |
| Classes & Arms | `isClasses` | 13.4k | cards / table; empty; status, scope and level filters; search; archived rows offer Restore instead of Archive |
| Subjects | `isSubjects` | 12.0k | cards / table; empty; scope filter; core/elective filter; search |
| Assignments | `isAssignments` | 2.3k | two panels, both deliberately empty with an explanation |

### 1.2 The drawer is the biggest single thing in the design

| Surface | Flag | Markup |
| --- | --- | --- |
| **Right-hand drawer** | `drawerOpen` | **27.9k** |
| Confirm modal | `modalOpen` | 1.4k |
| Command palette | `paletteOpen` | 2.1k |
| Toast | `toastOpen` | 0.5k |
| Shell (sidebar, header, two pills, search, read-only banner) | `navExpanded` … `sessionReadOnly` | 11.0k |

The drawer is larger than any screen and more than twice the size of the
session detail. It is nine forms sharing one frame:

1. **Entity** (`dwIsEntity`) - one body serving five kinds: department,
   program, level, class, subject. Name, code with a Generate button,
   description, scope.
2. **Class** (`dwIsClass`) - puts Level and Arm above Name and composes the
   name from them until the person types their own (`dwNameAuto`).
3. **Subject options** (`dwShowSubjectOpts`, 4.1k) - core/elective toggle plus
   an "Offered at" picker grouped by programme, each group with its own
   All/Clear.
4. **Session** (`dwIsSession`, 4.9k) - name, dates, a repeating term editor
   with add/remove, and a multi-branch scope control that is not the one the
   other entities use.
5. **Event** (`dwIsEvent`) - name, category (Term / Exam / Holiday / PTA /
   Results), start, optional end.
6. **Bulk levels** (`dwIsBulk`) - a textarea, one name per line, with a live
   preview table marking each name New or Already exists.
7. **Generate arms** (`dwIsArms`) - a level plus a comma list, same live
   preview.

Its error and edge states are the work nobody sees in a screenshot:
`dwNameError`, `dwCodeError`, `dwHasClash` (a paragraph explaining *why* the
name is taken and what to do), `evDateError`, `noLevelsAvailable` (three
places), `dwShowLevelSelect`, `sessCampusEmpty`, `scopeLocked` vs
`scopeEditable`, `showCampusSelect`, per-term `dt.hasError`, and a Save button
gated on both valid **and** dirty.

### 1.3 Overlays and the confirm modal

The modal is one component with **ten** payloads: `setActive`,
`archiveSession`, `deleteDept`, `narrow` (school-wide item narrowed to one
branch), `blocked` (department still has programmes - offers "Go to programs"),
`blocked2` (programme still has levels; level still has classes),
`deleteProgram`, `deleteLevel`, `archiveClass`, `deleteSubject`.

Also in the shell: a branch pill (`branchPillOpen`), a session pill
(`sessionPillOpen`), a search box that collapses to an icon below 1100px
(`searchWide` / `searchNarrow`), a read-only banner on an archived session
(`sessionReadOnly`), and a Cmd/Ctrl-E command palette that navigates screens
and says so when a destination lives outside the module.

### 1.4 Per-row states

41 dotted flags - the difference between a list and a working screen:

```
bm.off bm.on  cc.canArchive cc.canRestore cc.showDot  cr.canArchive
cr.canRestore cr.menuOpen cr.scopeChip cr.scopeText  dc.showPin
dr.menuOpen dr.scopeChip dr.scopeText  dt.hasError dt.noEvents
hp.showTick  k.showScope  lv.scopeChip lv.scopeText  pr.hasChev
pr.menuOpen pr.noLevels pr.open pr.scopeChip pr.scopeText  sm.off sm.on
sr.canArchive sr.canEdit sr.canSetActive sr.menuOpen  su.menuOpen
su.scopeChip su.scopeText su.showPin  tp.showTick  tr.canExpand
tr.isLeaf tr.scopeChip tr.scopeText
```

### 1.5 The mock tenants - and a third axis

Two schools, and a **user scope** selector on top of them, so the design covers
six combinations, not two:

| | Brightfield Schools, Lagos | Sunrise Academy, Ibadan |
| --- | --- | --- |
| Branches | Lekki, Ikeja | none (single branch) |
| Sessions | archived 2025/26, active 2026/27, draft 2027/28 | archived 2025/26, active 2026/27 |
| Branch-only rows | General Studies (dept, Ikeja), Yoruba (subject, Ikeja), JSS1 C (class, Ikeja) | none |
| Programmes | Nursery, Primary, JSS, SSS | Primary, JSS |

User scope: **School-level user**, **Tied to Lekki Branch**, **Tied to Ikeja
Branch**. A tied user sees school-wide rows plus their own branch, and
**cannot widen scope**: the drawer states the branch rather than offering it
(`scopeLocked`, "Your account is tied to this branch").

These differences are requirements. On Sunrise every branch-shaped control
disappears - no scope column, no scope filter, no scope radio, no pin icon, no
split line under the count cards. It is not greyed out; it is absent.

---

## 2. What the backend can serve

### Bucket 1 - served and wired

**Empty.** school-fe calls no academics endpoint at all today. Every academics
screen in the app now is a local array: `src/pages/protected/academics/session/index.tsx`,
`session-details.tsx`, `academics/calender/index.tsx`, `calender-details.tsx`,
`classes/index.tsx` all render a `dummyData` const. There is no
`src/redux/services/academics/`.

### Bucket 2 - served, not wired

The whole module. `apps/schools/vs_academics/urls.py` already serves, and the
design already needs, every one of these:

| Design surface | Endpoint |
| --- | --- |
| Overview hero, count spine, six-row spine | `GET /v1/academics/overview/` |
| Tree view | `GET /v1/academics/structure/tree/?depth=full&branch=&session=` |
| Sessions list, search, status filter | `GET /v1/academics/sessions/?status=&search=&branch=` |
| Create / edit session with its terms and branches in one Save | `POST` / `PATCH /v1/academics/sessions/[<id>/]` (nested `terms`, `branch_ids`) |
| "Set as active" | `POST /v1/academics/sessions/<id>/activate/` |
| "Archive session" | `POST /v1/academics/sessions/<id>/archive/` |
| Term add / edit / delete | `/v1/academics/sessions/<id>/terms/`, `/v1/academics/terms/<id>/` |
| Departments screen | `/v1/academics/departments/[<id>/]` (`search`, `is_active`, `branch`) |
| Programmes accordion, levels nested | `/v1/academics/programs/[<id>/]` |
| "Add levels in bulk" | `POST /v1/academics/programs/<id>/levels/bulk/` |
| Level edit / delete | `/v1/academics/levels/<id>/` |
| Classes screen, level filter | `/v1/academics/classes/?level=` |
| "Generate arms" | `POST /v1/academics/classes/generate-arms/` |
| Archive / Restore a class | `/v1/academics/classes/<id>/archive/`, `/restore/` |
| Subjects screen, core/elective filter | `/v1/academics/subjects/?is_core=` |
| "Offered at" replace-all | `PUT /v1/academics/subjects/<id>/offerings/` |
| Branch pill | `GET /v1/i/me/branches/` - already has an RTK query (`getMyBranches`), no consumer |
| The six **Export** buttons | `POST /v1/exports/from-screen/`, over the datasets `apps/schools/vs_academics/export_datasets.py` already registers |

Two things the API does that the design does not use: `capacity` on a class,
and `next_level` / `next_level_name` (level promotion). Neither is a gap to
close now; noted so they are not mistaken for missing fields later.

The API also matches the design's harder rules already: a school with one
branch gets responses with every branch field stripped (`_BranchAware`), an
archived session refuses writes with `SESSION_ARCHIVED_READ_ONLY`, deleting a
department that still holds programmes answers 409 with the exact sentence the
design's `blocked` modal prints, and every view declares
`pending_tenant_surface = True` so a school still onboarding can build its
structure.

### Bucket 3 - exists but closed

**Nothing is closed on the backend.** Every academics view declares
`pending_tenant_surface = True` on the shared mixin, so even a school still
onboarding can build its structure. The one gap of this shape is ours, and it is
the permission registry - covered next.

### Permissions: what console-fe actually does, and what school-fe is missing

I read console-fe's `src/permissions/index.ts`, `src/hooks/use-permissions.ts`,
`src/components/custom/permission-gate.tsx` and `src/utils/fls.ts` against
school-fe's copies of the same four files.

**The architecture is already here, and it is already console-fe's.** Not
similar - the same:

| Piece | console-fe | school-fe |
| --- | --- | --- |
| `MM RR AA` six-digit code format, one `REGISTRY` holding the only copy of the dotted backend keys | yes | **identical** |
| `P.*` constants named for the UI capability, never the backend key | yes | **identical** |
| `resolvePermissionKey()` as the only bridge between the two | yes | **identical** |
| `usePermissions()` with `hasPermission` / `hasAnyPermission` / `hasAllPermissions` / `hasModuleAccess` | yes | **byte-for-byte identical** apart from the example prefixes in the comment |
| `PermissionGate` with `permission`, `mode="any"/"all"`, `fallback` | yes | **byte-for-byte identical** |
| `utils/fls.ts` - `isStripped()` / `strippedFields()` reading `_stripped_fields` | yes | **byte-for-byte identical** |

So there is no port to do. The MM allocation differs because the two apps face
different backends (console: 10=platform, 20=finance, 70=procurement, …;
school: 10=school, 20=onboarding, 30=academics, 40=import), which is correct -
they are separate registries over separate key namespaces.

**What is missing is keys, not machinery.** Diffing school-fe's `REGISTRY`
against everything the backend seeders register for a school user
(`seed_school_permissions`, `seed_import_permissions`, `seed_onboarding_permissions`):

Eleven keys the backend seeds a school and school-fe cannot name:

```
academics.structure.view / .create / .update / .manage      ← blocks this module
academics.subject.view   / .create / .update / .manage      ← blocks this module
school.roles.approve
school.user_overrides.view / .manage
```

(`import.templates.create` and `.manage` also exist and are also absent here,
correctly: `seed_import_permissions` registers them at PLATFORM scope, so a
school tenant can never hold them and a code for them would be a capability
this app can never have.)

The first eight are the ones that matter here: every department, programme,
level, class and subject view demands one of them, and `usePermissions` returns
`false` for a code it cannot resolve, so today school-fe would hide the entire
module from a school admin who is fully entitled to it.

`school.user_overrides.*` and `school.roles.approve` are seeded CRITICAL to
school_admin and have no screen in school-fe at all - console-fe has the
per-user permission-exception screens, school-fe does not. Worth adding the
codes now; the screens are a separate piece of work.

**Field level security: the scaffolding is here, and academics has no use for
it.** `utils/fls.ts` is already in place, ready for any endpoint that strips
fields. `vs_academics` strips none: it registers no `view_sensitive` action, emits
no `_stripped_fields`, and its serializer header states the rule plainly - no
user email, no permission keys, no raw metadata, nothing the FRD does not name.
The one place FLS bites in school-fe is students (`school.students.view_sensitive`,
already in the registry). So FLS needs no work for this module; it needs a
convention written down so the next module that does strip fields uses
`isStripped()` rather than checking for `undefined`.

**What is genuinely absent versus console-fe:** two small helpers,
`permissionLabel(key)` and `permissionModule(key)`, which turn a raw backend key
into readable text. console-fe needs them because its permission-exception
screens render keys the user never picked from a `P.*` constant. school-fe has
no such screen yet, so they are worth porting only when `school.user_overrides.*`
gets one.

**And a test to stop the drift recurring.** console-fe has
`src/permissions/procurement-permissions.test.ts` - a handful of
`resolvePermissionKey(P.X) === "module.resource.action"` assertions pinning the
codes a module's controls depend on. school-fe has no equivalent, which is how
eight keys went missing without anything failing. Each phase below adds its own.

### Bucket 4 - absent

1. **Term calendar events - now the Calendar's problem, not this module's.**
   The prototype's session detail lists events per term, colours them by
   category, adds and deletes them. There is **no event model anywhere in the
   backend** - not in `vs_academics`, not elsewhere - though the permission keys
   `academics.calendar.view/create/update/manage` are seeded and a permission
   group named "Academic Calendar" already exists. Since Academic Calendar is
   now its own nav item with its own design pass coming, the events belong
   there. **The session detail ships without them**, and this module has no
   blocked work left.

2. **A duplicate check that can name what clashed.** The backend answers every
   unique violation with `{"code": "DUPLICATE", "message": "A record with these
   details already exists."}` from the generic handler in
   `apps/core/exceptions.py:145` - no field, no name, no branch. Ruled: the
   backend learns to say it. Copy and scope in "Elements that needed a ruling"
   below; the work is listed under "Backend work this plan depends on".

3. **Assignments.** Class teachers and class lists have no model. This is not
   blocked work: the design already renders the screen as two explained empty
   panels and says so in its own copy. It ships as-is.

### Elements that needed a ruling - all resolved

**(a) The cross-pool name and code clash - dropped, the backend wins.**
The prototype treated names and codes as one namespace across departments,
programmes, levels, classes and subjects (`findClash` searches every pool). The
backend namespaces them per type. We follow the backend, so Sunrise can run a
**Commercial** department and teach **Commercial** at SSS, which is ordinary
practice. `findClash` does not get ported.

What remains is the real uniqueness the database enforces, and it differs by
type: department, programme, class code, subject and session names are unique
per school; a **level** name is unique only within its programme.

**(b) The clash message - the backend learns to write it.**
The frontend cannot compute it. A Lekki-tied admin's subject list does not
contain Yoruba@Ikeja, because `scope_to_visible_branches` removed it, so the
client has no way to know what it collided with. Only the server does.

Today the server answers every duplicate with
`{"code": "DUPLICATE", "message": "A record with these details already exists."}`
from the generic `IntegrityError` branch in `apps/core/exceptions.py`. It needs a
typed refusal per write path instead, carrying the field that clashed, the name
of the row it clashed with, and that row's scope.

**The copy, with the "branches you do not have access to" clause dropped.**
"Unique across the whole school" already carries that meaning and is a third of
the length. Inline under the field stays short; the paragraph below it explains:

| Case | Inline | Paragraph |
| --- | --- | --- |
| Name, culprit at a branch | This name is already in use. | Yoruba already exists at Ikeja Branch. Names are unique across the whole school, so pick a different one. |
| Name, culprit school-wide | This name is already in use. | Mathematics is already offered school-wide, so this branch already has it. Give a branch copy its own name and code, or use the one that exists. |
| Code, culprit at a branch | This code is already in use. | That code belongs to Yoruba at Ikeja Branch. Codes are unique across the whole school, so pick a different one. |
| Code, culprit school-wide | This code is already in use. | That code belongs to Mathematics, which is school-wide. Codes are unique across the whole school, so pick a different one. |
| Level name | This name is already in use. | JSS1 already exists in Junior Secondary. Pick a different name. |
| Session name | This name is already in use. | 2026/2027 already exists. Pick a different name. |

Single-branch schools never see a branch named, because there is none to name -
the same recede rule the serializers already apply.

**(c) The Description field - the backend gets the column.**
`Program`, `Level` and `SchoolClass` gain
`description = models.TextField(blank=True, default="")`, exposed on read and
write like `Department`'s and `Subject`'s already are. One migration, additive,
no default to backfill. The drawer then means the same thing on all five types.

**(d) The session pill as a lens - unchanged, and deliberate.**
Both the prototype and `StructureTreeView`'s docstring say the same thing: the
session at the root of the tree labels it and does not filter it, because
nothing in this module ties a class or a subject to a year. Recorded so a later
reader does not "fix" it into a filter.

**(e) Departments have an Archived filter but no Archive action.**
The prototype offers All statuses / Active / Archived on departments, and the
only row action is Delete. Nothing in it can put a department into the state the
filter looks for. The API supports it (`PATCH is_active`), so the cheap answer
is to add Archive/Restore to the row menu the way Classes has it. Doing that in
phase 3.

### Backend work this plan depends on - **DONE**

All three landed in `apps/schools/vs_academics`, with 175 tests green and each
one checked over the wire against the dev database.

1. **Typed duplicate refusals.** New `services/uniqueness.py`, raised from every
   create and update path, with `DUPLICATE_NAME` / `DUPLICATE_CODE` at 409 and
   the sentence written server-side. It names the field, the row that blocked
   you and its branch:

   > `General Studies already exists at Brightfield Schools Annex. Names are
   > unique across the whole school, so pick a different one.`
   >
   > `That code belongs to Sciences, which is school-wide. Codes are unique
   > across the whole school, so pick a different one.`

   Two things it is careful about. The rule the message STATES is the rule the
   constraint enforces, and those differ by kind: a level's name is unique
   inside its programme, a class's name inside its level AT ITS BRANCH, a class
   CODE across the whole school. A single message would be wrong about two of
   them. And it reads `all_objects`, because an archived row still holds its
   name and the constraint does not exempt it either.

   It does not replace the constraints. Two concurrent writes can both pass it
   and the database stops the second, which still answers the generic message -
   the right trade, since that is a race rather than a typo.

   Two existing session tests asserted the old bare `400 DUPLICATE`; they now
   assert the refusal that replaced it.

2. **`description` on `Program`, `Level` and `SchoolClass`.** Model field,
   migration `0003`, and the field on both the read and write serializers.
   Additive, nothing to backfill.

3. **`?branch=` on `OverviewView`.** The counts now narrow with the pill above
   them - a shared row counts at every branch, which is what a null branch
   means. The live-year block is deliberately NOT filtered: blanking the hero
   for a branch whose year names other branches is a different and misleading
   fact, and `branches_without_a_session` already reports that one.

### A stale note in CLAUDE.md

CLAUDE.md's responsive section lists a "Known gap: this repo's
`dashboard-layout.tsx` does NOT have that wrapper yet". It does -
`src/components/layout/dashboard-layout.tsx` ends with the
`grid grid-cols-1 min-w-0` wrapper and its ported-from-console-fe comment. And
`CustomTable` already has the phone-card mode with the `mobile="scroll"` opt-out
(`src/components/custom/custom-table.tsx:57`). Neither needs porting; the note
should be deleted so nobody spends a morning on it.

---

## 3. The phases

Every phase builds, has tests (including the `resolvePermissionKey` assertions
for the codes it introduces), and has been driven in a browser against the real
API at 390px and desktop before it counts as done (`.claude/mobile-audit.mjs`,
and the `verify-design` skill for the login-and-screenshot pass).

### 3.1 Where "keep the existing design" cannot hold

Three numbers on the existing screens have nothing behind them. This is not a
styling preference, so the cards keep their shape and lose the figures they
cannot fill.

**The session card's metrics row.** It currently reads
`3 branches · 1,284 students · 16 classes`. The academics API has no student
count - students are a different module that has not shipped. The prototype
solved this by printing the school's real structure on the active session
(`3 terms · 12 levels · 8 classes · 8 subjects`) and the session's own shape on
every other card (`3 terms · 37 teaching weeks`), because a count of classes is
only true of the year that is running.

> Sunrise Academy has 3 classes. If the archived 2025/2026 card and the active
> 2026/2027 card both say "3 classes", the archived one is lying: it is showing
> today's structure under last year's name. Mr. Alabi opens it to check what the
> school looked like last year and gets this year's numbers.

Same card, same layout, honest figures.

**The class card's three stats.** They currently read Students / Subject /
Avg Score. Only the middle one is servable (`subject_count` is a real per-class
figure derived from the offerings at that class's level). Students needs the
student module; Avg Score needs an assessment module that does not exist. The
prototype's Level / Arm / Subjects fits the same three-column slot exactly.

**Everything else stays.** The session card's status badge, term pills with the
tick and the "- ongoing" suffix, the date range, the active-session green
border; the session detail's title row, status badge, Edit button, branch chips
and per-term cards; the class card's coloured icon tile and View/Edit buttons.
All of it is already the design and already close to the prototype - the
prototype is an evolution of these screens, not a replacement for them.

### Phase 1 - Foundations, the nav, the branch lens, and the Overview - **SHIPPED**

Built, and driven in a real browser against the real API at 1440px and 390px as
both scenario schools. Zero console errors, zero horizontal page overflow.

- Seeded the two scenario schools in dev, and added `seed_academic_scenarios` to
  the backend's `reseed-dev.sh` so a fresh reseed includes them. (The local DB
  had never run the `vs_academics` migrations; it has now.)
- Added the eleven missing keys to `src/permissions/index.ts` (academics
  structure = RR 04, subject = RR 05; `school.roles.approve` = AA 05, a verb the
  header's action list did not have; `school.user_overrides` = RR 13, the same
  RR console-fe gives that resource) plus
  `src/permissions/academics-permissions.test.ts`, which pins each code to its
  backend key AND asserts that every `P.*` constant resolves at all.
- `src/redux/services/academics/` - types and endpoints for the whole module,
  with the branch lens applied in ONE place rather than per call site.
- `src/redux/features/academics/lens-slice.ts` plus `use-branch-lens` and
  `use-session-lens`. Not persisted, deliberately: a lens restored from last
  week silently narrows a list to a branch the reader has forgotten.
- The lens strip, `src/components/layout/lens-pills.tsx`, opt-in per route via a
  new `lens` handle. It sits UNDER the header, not in it - see the finding below.
- Nav and routes: Academic Structure with Overview, Sessions & Terms and
  Classes & Arms; Academic Calendar lifted out to its own top-level item and its
  spelling corrected. Old paths (`/academic`, `/academic/session`,
  `/academic/calender`, `/classes`) redirect rather than 404.
- The Overview screen: hero, count spine, list view and tree view.

**Three things the build turned up that the plan had not:**

1. **The whole module was unreachable to the schools that need it most.** The
   layout closed every non-onboarding route to a PENDING school, but building
   the academic structure is a REQUIRED onboarding task, and every academics view
   declares `pending_tenant_surface = True` for exactly that reason. So the API
   was open and the app was shut. Fixed at the choke point: `DashboardHandle`
   gained `pendingSurface`, the frontend's word for the backend's contract,
   absent-means-closed like the backend's. The onboarding control room's
   Academic Structure card said "opens when your school goes live" - true before
   the module existed - and now opens it.

2. **Every legacy path landed on the lock screen.** The redirects from
   `/academic/session`, `/classes` and friends never ran for a pending school:
   the closed-school notice renders above the outlet, so the layout answered
   before the redirect could. Same root as the finding above and fixed the same
   way - a redirect declares `pendingSurface` because it shows nothing and
   grants nothing; whatever it lands on makes its own decision.

3. **The header has no room for the lens.** The search box is absolutely
   positioned and centred on the header bar, so anything added to the right-hand
   cluster grows leftwards underneath it - the branch pill rendered as
   "…ranches". The pills moved to a strip below the header, where
   `OnboardingStatusStrip` already lives. A phone now gets the lens too, which
   is better than the hiding-below-`sm` the first attempt did: a branch admin on
   a phone is precisely the reader who needs to know which branch they are in.

**One backend ask this raised**, small and not blocking: `OverviewView` takes no
`branch` argument, so the four counts do not follow the branch pill while the
tree does. The lens is already passed, so they start narrowing the day the server
accepts it; until then the screen claims no per-branch split, because a number
that ignores the filter above it is worse than no number. Four lines, mirroring
`StructureTreeView`'s own `resolve_branch_reference` block.

### Phase 2 - Sessions & Terms - **SHIPPED**

Built, and driven in a real browser against the real API at 1440px and 390px as
both scenario schools. Zero console errors, zero horizontal page overflow, 232
frontend tests and 175 backend tests green.

The existing card and detail screens kept their design and got the API behind
them, then gained what they lacked: search and status filters, the scope line, a
table view, an empty state that distinguishes "no sessions yet" from "nothing
matches that filter", pagination, a row menu, the activate and archive
confirmations, and the **session drawer** - name, dates, a repeating term editor
with add and remove, per-row date validation, and the multi-branch scope control.

The footer changed, as section 3.1 said it would. It read
"3 branches · 1,284 students · 16 classes"; it now reads
"3 terms · 42 teaching weeks · The whole school". There is no student model in
the product, and a class count is only true of the year that is RUNNING - the
old card printed this year's classes under last year's name.

The session detail ships without its per-term event lists: they belong to the
Academic Calendar. Its "Active branch:" row became "Applies to", because the old
label was wrong in both directions - the chips were never about the branch you
are looking at, and a session naming no branch is not missing one.

**Two things worth recording:**

1. **The drawer renders the backend's new refusal verbatim.** Creating a second
   2028/2029 puts *"2028/2029 already exists in this school. Pick a different
   name."* under the Name box with the field outlined, rather than a toast
   saying a record exists. That is the whole point of the backend change,
   working end to end.

2. **Every academics page was stretching its own rows.** A grid container
   defaults to `align-content: normal`, which behaves as STRETCH for auto rows,
   and the layout's `flex-1` wrapper hands a short page all the leftover height.
   So `gap-5` rendered as about 130px and the sessions list looked like three
   cards adrift. Fixed with `content-start` on the page grids and `items-start`
   on the card grids - and worth knowing before phases 3 to 6 build four more
   screens on the same shape.

### Phase 3 - Departments - **SHIPPED**

Built and driven against the real API at 1440px and 390px as both scenario
schools. Zero console errors, zero horizontal page overflow, 238 frontend and
175 backend tests green.

Cards and table, search, a status filter, the scope chip, pagination, and the
row menu. Archive and Restore were added as ruled: the prototype drew an
Archived filter with nothing that could produce an archived department, and now
there is.

Three refusals get a modal that says what to do next rather than a toast that
vanishes: a department with programmes mapped to it cannot be deleted (the
server counts them and writes the sentence), narrowing a school-wide department
to one branch takes it away from every other branch, and a delete is final.

**The shared entity drawer is built**, in `academics/components/`, and phases 4
to 6 inherit it: name, code with Generate, description, the scope control, the
locked-scope case for a branch-tied account, and the server's duplicate refusal
rendered under the field it names. Kind-specific controls arrive as `children`
rather than as five branches inside one file.

**Two things the build turned up:**

1. **A generated code did not follow the name.** Type "Sciences", press
   Generate, get SCI, hit the duplicate refusal, rename to "Technical Studies" -
   and SCI is still sitting there, so the second attempt fails for the same
   reason the first did. The drawer now tracks whether the code in the box is
   OURS or THEIRS: one we generated follows the name, because it was only ever a
   guess at what the name implies, and one the person typed is left alone.

2. **The seed could not reach the blocked-delete state.** Every card read
   "Programmes 0" because `seed_academic_scenarios` never mapped a programme to
   a department, so the refusal this screen exists to explain was unreachable
   and untestable. The seeder now maps Junior and Senior Secondary to Sciences
   and leaves Nursery and Primary unmapped, so both sides of the delete are
   reachable - and it tops up an existing dev database on a re-run rather than
   only a fresh one.

### Phase 4 - Programmes & Levels - **SHIPPED**

Built and driven against the real API at 1440px and 390px. Zero console errors,
zero horizontal page overflow, 238 frontend and 179 backend tests green.

The accordion, with levels nested and their class counts, expand/collapse all,
search across level names as well as programme names, and the scope chip on
both rows. Add, edit and delete for each, plus a department picker on the
programme drawer - lifted into the parent so it travels in the drawer's single
save request rather than a second one.

**The bulk-levels drawer** with its live preview. The preview is the point: the
server refuses the WHOLE batch if any name already exists, deliberately, because
half-creating a run leaves a school unable to tell which of the names it typed
took. A preview that only appeared after the refusal would make the reader guess
which line to delete. It counts a repeat inside the box as a clash too.

**The inherited scope lock**, this phase's real new case. A level inside a
branch-only programme cannot be school-wide - it would be visible where its own
parent is not - so the drawer states the branch and the reason
("Vocational belongs to this branch, so its levels cannot be school-wide")
instead of offering a radio the server would refuse.

**Two things the build turned up:**

1. **The blocked-delete refusals were speaking SQL.** Departments got a written
   sentence because `DepartmentDetailView` guards explicitly; programmes and
   levels were left to the platform's `PROTECTED_REFERENCE` handler, which
   pluralises from MODEL names. A school deleting JSS1 was told *"This record
   cannot be deleted because 2 school class and 5 subject offerings still
   reference it. Remove or reassign them first."* - two things a school has
   never heard of, and an instruction to reassign a join row it cannot see.
   Both now have typed refusals in this module's own voice: *"2 classes sit at
   JSS1. Archive or move them first, then delete the level."* and *"3 levels sit
   inside Junior Secondary. Delete or move them first, then delete the
   programme."* Offerings are phrased as the school's other job - "2 subjects are
   offered at JSS1. Remove JSS1 from those subjects first" - because nobody
   deletes an offering, they stop offering a subject at a level.

2. **The bulk preview showed a code it could not compute.** Three lines all read
   "VOC" while the server would save VOC, VOC2 and VOC3: it suffixes to keep a
   code unique across the school, and the drawer only holds THIS programme's
   levels. The column is gone - the drawer already says codes are generated, and
   a guess there is worse than nothing.

**One question this raised, for you rather than for me.** `SubjectOffering.level`
is `on_delete=PROTECT`, so a level with no classes still cannot be deleted until
someone edits every subject offered at it. An offering is a statement ABOUT that
level ("Mathematics is taught at JSS1") and is meaningless once the level is
gone, so CASCADE is arguably right and would remove a chore with no safety
value. It deletes rows, so it is your call, not mine - the copy above is honest
either way.

### Phase 5 - Classes & Arms

Keep the existing card; put the API behind it and swap the two unservable stats
(section 3.1). Then add the table view, the level, scope and status filters,
archive and restore (archived rows swap Archive for Restore), the class drawer
with its level/arm name composition, and the **generate-arms drawer**.

### Phase 6 - Subjects

New screen. Cards and table, core/elective filter, the offered-at picker grouped
by programme with per-group All/Clear, and delete. Writes offerings through
`PUT /subjects/<id>/offerings/`.

### Phase 7 - Assignments, and the Export buttons

The Assignments submenu exactly as designed - two empty panels that explain why
they are empty. Then wire the six Export buttons to
`POST /v1/exports/from-screen/`, translating each screen's live filters.

Small, and it closes the module.

### Not in this plan

**Academic Calendar.** Its two screens stay on dummy data and keep their current
nav position as a top-level item until its own design lands. The backend work it
needs - an event model, a migration, and routes under the `academics.calendar.*`
keys that already exist - belongs to that pass, not this one.

**Per-user permission exceptions.** `school.user_overrides.view/manage` get
their codes in phase 1 so the registry is complete, but console-fe's exception
screens (and the `permissionLabel` / `permissionModule` helpers they need) are a
separate piece of work.

---

## 4. Order, and why

1. **Seed data before screens.** Six of the seven submenus have a branch-only
   state that only `brightfield-lekki` can show, and a recede-entirely state
   that only `st-monicas` can show. A screen built before the seed is a screen
   built in one state and verified in none.
2. **The permission keys before anything is gated.** Eleven lines, but every
   screen from phase 3 onwards is unreachable without eight of them, and the
   test that pins them is what stops the next eight going missing.
3. **Overview first** because it is the only screen that is pure read - no
   drawer, no modal, no writes - so the service layer and the branch lens get
   proved on the cheapest screen rather than the hardest.
4. **Sessions second, not last.** It carries the heaviest drawer and the modal
   framework. Doing it early means four later screens inherit working machinery;
   doing it late means building the machinery twice.
5. **Departments before Programs, Classes and Subjects**, because it is the
   smallest user of the shared entity drawer.
6. **Exports after the screens they export**, since each button translates its
   own screen's live filters.

**Nothing in phases 1 to 7 is blocked.** Every endpoint they need exists and
answers today. The only absent API in the original reading - term calendar
events - has moved out with the Calendar, so this module has no parked phase.
