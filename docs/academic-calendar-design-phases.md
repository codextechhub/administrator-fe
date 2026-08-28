# Academic Calendar & Timetables - design breakdown and build phases

Source: `docs/claude-designs/Academic_Calendar.html` (bundled export, 690 KB;
151 KB of markup once unescaped, **178 `sc-if` blocks, all 178 accounted for**).

Backend read against `/Users/mac/Documents/Dev-Projects/GitHub/backend`, module
`apps/schools/vs_calendar`, mounted at three prefixes:
`/v1/academics/calendar/`, `/v1/academics/timetable/`, `/v1/academics/exams/`.

---

## 0. The headline, before anything else

**The backend is finished and the frontend has not made a single call to it.**

`vs_calendar` is 5,600 lines of built, tested, documented module: eight models,
twenty-five routes, a clash engine, a publish gate, five Export Centre datasets,
a scenario seeder, and a test file per surface. It was written against *this*
prototype - its docstrings argue with the FRD in the design's favour and name
the design's own screens ("the design's room card shows it", "the design never
creates an `Exam` explicitly", "the design's period form has no order field").

school-fe, meanwhile, has two Academic Calendar screens
([index.tsx](src/pages/protected/academics/calender/index.tsx),
[calender-details.tsx](src/pages/protected/academics/calender/calender-details.tsx),
306 lines together) that render a hard-coded `dummyData` object. Nothing in
`src/redux/services/` mentions calendar, timetable, room, period or exam.

So this is not a module to design. It is a module to **wire**. That single fact
sets the whole plan: there is almost no bucket-4 work, the risk is not "can the
server do this" but "does the client ask the right question", and the phases are
sized by screen, not by dependency.

---

## 1. What the design contains

### 1.1 Screens

Eight screens behind one shell, plus four overlays. Size is unescaped markup
characters, which is a fairer proxy for work than headings are. "Its own states"
counts distinct `sc-if` flags inside that screen's span, row-scoped ones
included.

| Screen | Flag | Markup | States | Lists |
| --- | --- | --- | --- | --- |
| Hub ("Academic Calendar & Timetables") | `isHub` | 13.9k | 5 | 3 |
| Calendar & Events | `isEvents` | 13.3k | 17 | 5 |
| Term Calendar View | `isTermView` | 6.2k | 4 | 8 |
| Rooms | `isRooms` | 18.1k | 14 | 5 |
| Bell Schedule | `isBells` | 8.7k | 9 | 3 |
| Class Timetables | `isClassTT` | 10.6k | 13 | 5 |
| Teacher Timetables | `isTeacherTT` | 8.0k | 9 | 4 |
| Exam Scheduling | `isExams` | 9.5k | 6 | 2 |
| **The drawer** | `drawerOpen` | **34.1k** | **32** | 9 |
| Confirm modal | `modalOpen` | 2.4k | 4 | 1 |
| Command palette | `paletteOpen` | 2.1k | 1 | 1 |
| Toast | `toastOpen` | 0.7k | 3 | 0 |
| Shell (nav, pills, header, read-only banner) | - | 23.3k | 8 | 3 |

**The drawer is the biggest thing in this design by a factor of two**, and it is
the thing screenshots hide completely. It is not one form. It is seven, sharing
a header, a footer and a scope block:

| Mode | Flag | What it is |
| --- | --- | --- |
| View an event | `dwIsView` | read-only detail, plus an "Exam timetable" cross-link when the event is an exam period |
| Event form | `dwIsEvent` | name, type, dates, branch scope, description, closes-school |
| Room form | `dwIsRoom` | name, code, type, branch (required), capacity, active |
| Period form | `dwIsPeriod` | label, times, type, applies-on day, branch scope |
| Lesson form | `dwIsLesson` | subject, teacher, room, plus "Clear this slot" |
| Duplicate a week | `dwIsDuplicate` | source class, keep-teachers, keep-rooms, live preview of what will be copied, replaced and skipped |
| Exam paper form | `dwIsPaper` | class, subject, date, sitting, room, invigilator |

with eleven validation and warning states across them: `dwNameError`,
`dwDateError`, `dwTimeError`, `dwOutsideWarn`, `dwOverlapWarn`, `dwRoomClash`,
`dwDayReplaces`, `dwLessonClash`, `dwPaperRefused`, `dwPaperWarn`,
`dupNoSources`.

### 1.2 The states no screenshot shows

Per screen, the unhappy and secondary states that are most of the work:

- **Hub** - next-up empty, alerts empty, alert count badge, per-term tick on the
  hero pills.
- **Events** - zero events vs no-match-on-filter (two different empty states with
  different copy and different buttons), filter panel open, facet badge, facet
  chips row, count line, per-row: in-term vs "Outside every term", school-closed
  tag, school-wide chip vs named branch, row menu, and `er.canEdit` (a row a
  branch-scoped user may read but not edit).
- **Term view** - today marker on the timeline, per-day-cell today and closed
  states, month grid of 35 cells each with its own chip list.
- **Rooms** - grid view AND list view, each with its own three empty/no-match/any
  states; branch filter that only appears for multi-branch schools; per-card
  branch line; per-row menu with an activate/deactivate label that flips.
- **Bell schedule** - the "school day" strip with day tabs, `dayOwnSchedule`
  (this day replaces the everyday schedule), empty state whose copy explains
  that timetables depend on this.
- **Class timetables** - `ttNoBells` (a whole blocking empty state pointing at
  the bell schedule), `ttNothingYet` nudge, clash panel, class picker with
  search, picker-empty, and four cell states (non-teaching, filled, filled+clash,
  empty).
- **Teacher timetables** - read-only badge, `twCrossBranch` summary line, picker
  with search and empty, four cell states.
- **Exams** - `exNoPeriod` (blocking empty state pointing at the calendar),
  no-papers empty, clash panel with its own copy about why these save.

### 1.3 The two mock tenants, and what their difference demands

| | Brightfield Schools, Lagos | Sunrise Academy, Ibadan |
| --- | --- | --- |
| Branches | Lekki, Ikeja | none |
| Sessions | 2025/2026 active + 2024/2025 archived | 2025/2026 only |
| Terms | three | **two** |
| Events | 7, one branch-only (`Founder's Day`, Lekki) | 3, all school-wide |
| Rooms | 6 across two branches | 3, no branch |
| Bells | everyday + **a short Friday** (assembly + shifted periods) | everyday only |
| Classes | 4 across two branches | 2 |
| Lessons | 16, seeded to produce exactly three clashes | 3 |
| Timetable status | draft, draft, published, draft | draft + **one class with no timetable row at all** |
| Exam papers | 5, with a room clash and an invigilator clash | **none, and no exam period** |

The differences are requirements, and there are four of them:

1. **The branch dimension recedes entirely.** Not disabled, not blank: the Scope
   column, the branch filter, the branch field and the room card's branch line
   are *absent* for Sunrise. `hasBranches`, `showScopeFilter`,
   `showRoomBranchFilter`, `dwShowScope` and `rc.showBranch` all guard this. The
   backend does the same thing on its side (`_Scoped.to_representation` drops
   `branch`, `branch_name` and `scope_label` when `multi_branch` is false), so
   the client must not assume the field exists.
2. **A third demo axis: `userScope`.** School-level user, tied to Lekki, tied to
   Ikeja. A tied user gets `dwScopeLocked` instead of `dwScopeEditable` ("Your
   account is tied to this branch, so anything you create belongs to it"), and
   `er.canEdit` false on another branch's rows.
3. **An archived session is read-only across every screen** (`sessionReadOnly`
   banner, `canEdit` false everywhere). Only Brightfield has an archived year,
   so only Brightfield can reach that state.
4. **Sunrise reaches the two blocking empty states** Brightfield cannot:
   `exNoPeriod`, and a class with no timetable row.

---

## 2. What the backend can serve

### 2.1 Bucket 1 - served and wired

**Empty.** Zero endpoints in the `vs_calendar` namespace are called from
school-fe. This bucket exists in the table to be honest about that.

### 2.2 Bucket 2 - served, not wired

Everything else. The endpoint exists, is permissioned, declares
`pending_tenant_surface`, is tested, and no screen calls it.

| Design screen | Endpoint | Notes |
| --- | --- | --- |
| Hub counts, next-up, alerts | `GET /calendar/overview/` | returns `counts` (terms, events_in_term, classes_timetabled, rooms), `term` with `teaching_days_elapsed/total` for the hero percentage, `next_up[4]` with `days_away`, and `alerts[]` with six codes |
| Hub hero pills, read-only banner | `GET /calendar/year/` | terms with `state` = completed/ongoing/pending, and `session.read_only` |
| Session/term pill defaults | `GET /calendar/current/` | **no screen in the design uses it** - see 2.5 |
| Events list + filters | `GET /calendar/events/` | `?search &type &term &scope &from &to &session` - every facet the filter panel has |
| Event create / edit / delete | `POST`, `PATCH`, `DELETE /calendar/events/[<pk>/]` | write returns `data.warnings[]` carrying `EVENT_OUTSIDE_ANY_TERM` and `EVENT_OVERLAP`, which are exactly `dwOutsideWarn` and `dwOverlapWarn` |
| Term view month grid | `GET /calendar/events/?from&to` + `/calendar/year/` | the timeline and the 35-cell grid are both client-side over these two |
| Rooms grid and list | `GET /calendar/timetable/rooms/` | `?search &type &branch &active`; each row carries `usage {lessons, exam_papers, label}` which is `rc.usage` verbatim |
| Room create / edit / delete | `POST`, `PATCH`, `DELETE .../rooms/[<pk>/]` | `RoomInUse` is the delete refusal, worded from the same `usage` counts |
| Bell schedule table + strip | `GET .../periods/` | `?branch &day &is_active`; `day_label` is "Every day" or a weekday, `scope_label` is "School-wide" or the branch |
| Period create / edit / delete | `POST`, `PATCH`, `DELETE .../periods/[<pk>/]` | `PeriodOverlap`, `PeriodTimeInvalid`, `PeriodOrderConflict`; `order_index` is computed server-side, so the form correctly has no order field |
| Class picker | `GET .../classes/` | per class: `lesson_count`, `has_clash`, `status`, `status_label`, `scope_label`. Built for this picker and nothing else uses it |
| The grid | `GET .../classes/<id>/` | `days[].cells[]` with `kind` (LESSON/BREAK/LUNCH/ASSEMBLY) and `slot` or null, plus `has_bell_schedule` (which is `ttNoBells`), `filled`, `lesson_periods`, `warnings[]` |
| Grid replace in one write | `PUT .../classes/<id>/` | **not needed by this design** - see 2.5 |
| Fill / edit / clear one cell | `POST .../slots/`, `PATCH`/`DELETE .../slots/<pk>/` | write returns `warnings[]` with `TEACHER_DOUBLE_BOOKED` / `ROOM_DOUBLE_BOOKED`, which is `dwLessonClash`, and the write **succeeds** - which is what "The grid saves with clashes in it" means |
| Duplicate drawer | `POST .../classes/<id>/duplicate/?preview=1` then without | preview returns `{copied, skipped, replaced, rows[], skipped_rows[]}` - `dupSummary`, `dupShowSkipped`, `dupShowReplace` and `dupRows` map one to one |
| Clear | `POST .../classes/<id>/clear/` | also drops a published grid back to draft |
| Publish | `POST .../classes/<id>/publish/` | refuses with `TimetableHasClashes` / `TimetableIncomplete` |
| Teacher picker | `GET .../teachers/` | `?search`, each with `lesson_count` and `has_clash`. Deliberately **not** branch-narrowed |
| Teacher week | `GET .../teachers/<user_id>/` | `summary {teaching_periods, free_periods, busiest_day, branches[]}` - `twTeaching`, `twFree`, `twBusiest`, `twBranchLine` - and `read_only: true` |
| Exam period + papers | `GET /academics/exams/` | one entry per exam period, each with `slots[]`, `warnings[]`, `paper_count`, and the event's `start_date`/`end_date` |
| Create the exam row | `POST /academics/exams/` | idempotent against the event, precisely so the design never has to ask a school to name the same thing twice |
| Paper create / edit / delete | `POST`, `PATCH`, `DELETE /academics/exams/<id>/slots/[<pk>/]` | class-in-two-sittings is **refused** (`dwPaperRefused`); room and invigilator double-booking **warn** (`dwPaperWarn`) |
| Publish the exam timetable | `POST /academics/exams/<id>/publish/` | |

### 2.3 Bucket 3 - exists but closed

Two items, and they are a surface flag apart from working, not a module apart.

1. **The five timetable permission keys are missing from the frontend
   registry.** The backend seeds `academics.timetable.view / create / update /
   manage / publish` (`seed_school_permissions.py` lines 155-162) and grants them
   to school_admin, branch_admin and teacher. `src/permissions/index.ts` has
   `academics.calendar.*` at RR=02 and stops at `academics.subject` (RR=05). Until
   the five are registered, **no screen in phases 2 to 5 can gate on anything**.
   The next free slot is RR=06, and `publish` needs a new AA code (the registry's
   action table has no publish; 16 is free).
2. **The Export Centre datasets are registered and unreachable.**
   `export_datasets.py` publishes `calendar.events`, `calendar.rooms`,
   `calendar.periods`, `calendar.timetable` and `calendar.exam_papers`. But
   `exports.*` is granted to platform roles only, and `vs_exports` declares no
   `pending_tenant_surface`, so a school admin gets nothing. This is exactly the
   state the six academics export buttons are already in, and
   [export-button.tsx](src/pages/protected/academics/components/export-button.tsx)
   already handles it by rendering nothing. Reusable as-is.

### 2.4 Bucket 4 - absent

**One item, and it is small.**

A **print view** of a class timetable or an exam timetable. The design's two
Export buttons are, by the prototype's own toast, "the print view" - not a CSV
download. Nothing in either repo renders one. It is ours to build (a print
stylesheet over the grid we are already rendering) and it is not blocked on
anyone. Settled in 3.1 ruling B: we build it, in phase 6.

That is the whole of bucket 4. There is no other screen in this design that the
server cannot feed today.

### 2.5 The other direction: what the server can do that no screen asks for

Five findings, and the first one is not cosmetic.

1. **Event audience has no control anywhere in the design, and the seeded data
   uses it.** `CalendarEventAudience` narrows an event to named levels or
   classes; both serializers carry `audience`; there is a dedicated refusal
   (`EventAudienceOutOfScope`); and `seed_timetable_scenarios` creates an
   audience-narrowed closure for Brightfield. The event drawer offers branch
   scope and nothing else, so that event will render as covering the whole
   branch. This is wrong data on screen, not a missing feature. **Ruled on: the
   design is wrong and we build the control, read and write, in phase 1.** See
   3.2.
2. **`ExamSlot.start_time` / `end_time`** are served; the paper drawer offers
   Morning/Afternoon only. Deliberate on the backend's part ("a school that
   publishes only morning and afternoon is not made to invent them"), so this is
   a note, not a gap.
3. **`Period.is_active`** is served, writable and filterable; the period drawer
   has no Active toggle, though the room drawer has one. Probably an oversight
   in the design, and it is one checkbox.
4. **`PUT /timetable/classes/<id>/`** replaces a whole grid in one transaction
   and one audit event. This design edits one cell at a time, so it would go
   unused. Leave it unused: cell-at-a-time is what the design asks for and what
   the clash warnings are shaped around.
5. **Saturday and Sunday** exist in `DayOfWeek`; the period form offers Monday to
   Friday. The model docstring already says which days a form offers is the
   client's choice. Note only.

### 2.6 Elements in the design that nothing can serve

| Element | Where | Status |
| --- | --- | --- |
| **Export** | Class Timetables, Exam Scheduling | a print view, and nothing renders one. **Settled (3.1 B): build it, phase 6** |
| **Exam period picker** | Exam Scheduling | the design takes the *first* exam-period event and shows no picker and no name. `GET /exams/` returns a list, so a school running mocks and end-of-term exams in one term can only ever reach one of them. **Settled (3.1 C): add a picker, phase 5** |
| **"Delete" on a room row** | Rooms, list view | the last four academics screens turned Delete into Archive. Rooms have both a hard `DELETE` and an `is_active` toggle, and the design's row menu offers both. **Settled (3.1 D): keep both, phase 2** |
| `examClass` filter | Exam Scheduling | state exists in the prototype's model with **no control rendered**. Dead. Drop it |
| "Search the school ⌘E" | shell | the palette's own empty copy says "This searches screens, not records", and school-fe's [action palette](src/lib/action-palette) already does exactly that. No new work, and **no record search is to be built from this box** |

---

## 3. Decisions

### 3.1 Rulings taken

All four are settled. Nothing in this plan is waiting on a decision.

**A. Event audience: build it, read and write, in phase 1.** Schools do close one
year group and not another, so the design is wrong to have no control for it and
the model is right to have the table.

> Brightfield's Lekki Branch holds Speech Day on Friday 21 November for the
> primary school only, narrowed to Primary 4 A. As the design draws it, the
> Scope column reads "Lekki Branch" and the drawer says "School closed: Yes".
> Mrs Adeyemi teaches JSS1 A, reads that Friday as closed, and does not come in.
> Thirty JSS1 pupils sit in Block A Room 1 on their own. With the audience on
> screen it reads "Lekki Branch · Primary 4 A", she comes in, and JSS1's
> teaching-day count keeps the day it actually taught.

The read is one line in the Scope cell and one row in the view drawer, from the
`audience` the response already carries. The write is a level-and-class
multi-select in the event drawer, the levels from the programmes list and the
classes from `useGetClassesQuery`, both already in the client, plus
`EventAudienceOutOfScope` rendered verbatim when someone picks a class from
outside the event's branch.

**And the same fact gets an import path, in the backend.** A school setting up
its year loads a calendar in one file rather than typing forty events, and a
narrowed closure has to survive that file or the import produces exactly the
wrong-data case above at scale. Scoped in section 4, phase B1.

**B. Export: a print view, and the Export Centre button beside it.**

> Mrs Okonkwo has published JSS1 A's timetable and wants it on the noticeboard
> and in the parents' WhatsApp group. A print view gives her the grid on A4,
> which is what she wants. An Export Centre CSV gives her 40 rows of
> `day,period,subject,teacher,room`, which is not something you pin to a wall,
> and today it gives her nothing at all because no school role holds
> `exports.run.create`.

Settled: build the print view, and register the Export Centre button beside
it using the existing gated component, so the day a school is granted the export
keys the second option appears without a code change.

**C. Exam period picker: add one, and only when there is more than one exam period.**

> Brightfield's First Term holds two exam periods: "Mock Examinations" (17-19
> November) and "First Term Examinations" (1-12 December). Mrs Okonkwo schedules
> the mocks, then comes back in December to schedule the real papers and the
> screen is still showing her the mocks, with no control anywhere to change it.
> The December papers can be added, and then never seen again.

Settled: add the picker when `GET /exams/` returns more than one,
using the same pattern as the class and teacher pickers, which are already being
built in phase 3. Absent when there is one, which is the common case and the
design's drawing.

**D. Rooms: Deactivate is the archive, and the hard Delete stays for typos.**
The academics module standardised on Archive last week (commit `db9094a`), and
this is where that convention stops short of copying itself over: both controls
are kept, because the two cases are genuinely different.

> Someone types "Block A Rom 1" by mistake on Monday morning. That is a Delete,
> and it should leave nothing behind. Six months later the school stops using
> the Science Lab while it is refitted, and the lab holds ninety lessons and
> four exam papers. That is a Deactivate, and the server already refuses to
> delete it.

Settled: Deactivate is the archive. A room is a physical place that does not
stop existing, and the drawer's own copy already says "An inactive room stops
appearing when anyone picks a room". The hard Delete stays in the row menu for
the typo case, where `RoomInUse` already refuses the dangerous one.

### 3.2 Decisions I am taking without asking

- **Nav.** The single "Academic Calendar" item becomes two sibling modules,
  matching the design's own sidebar:

  ```
  Calendar
    ├─ Overview            (the hub)
    ├─ Events
    └─ Term view
  Timetables
    ├─ Rooms
    ├─ Bell schedule
    ├─ Class timetables
    ├─ Teacher timetables
    └─ Exam scheduling
  ```

  Both sit under the Academics group, after Academic Structure. The hub covers
  both modules (its "Go to" list names all seven screens) and lives under
  Calendar because that is where the design puts it.

- **The two existing screens are replaced, not refitted.** They render a
  hard-coded object. There is nothing to preserve, and `/academic-calendar` and
  `/academic-calendar/:id` redirect to the new Overview.

- **Both lenses apply.** These screens take the branch pill *and* the session
  pill, like the Academic Structure screens: every row in this module belongs to
  exactly one year. `lens: true` on all eight routes.

- **The lens goes in the API slice, not the call sites.** Same rule as
  [academics-api.ts](src/redux/services/academics/academics-api.ts): one `params`
  helper injects branch and session, because a lens each screen remembers to pass
  is a lens one screen will forget.

- **Clash copy comes from the server.** Every warning arrives as
  `{code, detail}` in `data.warnings` and is rendered verbatim, the same way
  academics renders its refusals. The client never composes a clash sentence.

- **The design says branch throughout.** Nothing to translate for once.

---

## 4. The phases

Every phase ships: it builds, its tests pass, and its screens have been driven
in a browser against the real API at 390px and at desktop. No phase leaves a
screen that looks finished and does nothing.

### Phase 0 - Ground (DONE)

Plumbing only. Nothing a user can see changed, deliberately: the two dummy-data
screens stay exactly where they are until phase 1 replaces them with the real
Overview, so this phase leaves no dead URL and no placeholder.

Shipped:

- **The five timetable permission keys**, at MM=30 RR=06, with AA=16 allocated
  for `publish` (a new action for this registry). Three new assertions in
  [academics-permissions.test.ts](src/permissions/academics-permissions.test.ts)
  pin them, keep calendar and timetable on separate resources, and keep
  `publish` off the `manage` key.
- **`calendar-api.ts`, `calendar-types.ts`, `calendar-params.ts`** - all
  twenty-five endpoints, the four serializer rules written into the types, and
  both lenses applied in one place. Seven new RTK cache tags.
- **`calendar-params.test.ts`** - fourteen assertions on the lens and the
  facets. The failure they guard is a PLAUSIBLE list, not a broken one: a
  dropped session param returns last year's bell schedule, which looks like a
  bell schedule.
- **`routesPath`** entries for all eight screens, split across two prefixes
  (`/academic-calendar` and `/timetables`) because the two halves are gated on
  different backend keys.
- Two backend seeder fixes, below.

**Verified against the running API**, as the school admin of each shape:

- All eleven read endpoints answer 200 with exactly the shapes the types
  declare, including the two that return an object rather than a list.
- The branch dimension recedes for real. At brightfield-lekki every row carries
  `branch` / `branch_name` / `scope_label`; at st-monicas all three are absent
  from events, rooms AND periods, which is the rule the whole type file rests on.
- The audience-narrowed closure now exists and comes back on the wire:
  `Primary Speech Day` narrowed to `Primary 1`, school-wide, closing the school.

**The nav moved to phase 1**, and that is a correction to this plan rather than
a slip. The house pattern is the one the sidebar already records for Academic
Structure: "a nav item that 404s is a door drawn on a wall", so submenus appear
as their screens land. Adding eight nav items in phase 0 would have meant eight
placeholder screens, and a placeholder is a screen that looks finished and does
nothing, which no phase here is allowed to leave.

**What phase 0 found**

1. **The registry gap was real end to end, not just in the client.** Running
   `seed_school_permissions` against the dev database created the five keys for
   the first time and backfilled 96 grants across 22 existing role templates.
   Every school admin in the dev world had been missing them.
2. **`reseed-dev.sh` never ran `seed_timetable_scenarios`.** The seeder has
   existed all along and nothing called it, so a reseed produced a dev world
   where every calendar and timetable screen would answer with empty lists -
   which reads as "the module is broken" rather than "it was never seeded".
   Added to the script.
3. **The audience-narrowed closure had never once been seeded**, in any tenant.
   The seeder reached a Level by finding a SchoolClass whose name starts with
   "Primary" and following it up; `seed_academic_scenarios` creates the Primary
   *levels* but no arms under them, so the lookup found nothing, the command ran
   clean, printed nothing, and left the audience table empty. The one state that
   file exists to make reachable was the one state it never reached. Fixed by
   reading the Level directly, which is what an audience row targets anyway.
4. **Two of the three demo schools have nobody carrying the teacher role**, so
   no class timetable can be seeded for them. See the blocker below.

**Blocker for phases 3 to 5, and it is a seeding gap rather than a code one.**
`brightfield-lekki` and `st-monicas` have zero teachers; `holy-cross` has one.
The seeder says so honestly and skips their grids. Two consequences:

- The multi-branch and single-branch grid states cannot be reached at all, so
  the two shapes the whole design turns on cannot be compared on a grid screen.
- One teacher cannot be double-booked with themselves, so the
  TEACHER_DOUBLE_BOOKED clash - the headline state of the class timetable, the
  teacher timetable AND the publish gate - has nothing behind it anywhere.

`seed_dev_data` creates teachers, but only for its own three schools
(greenfield-academy, royal-crest-college, unity-heights-school), not for the
onboarding cast. Closing this means adding teacher users and role assignments to
the scenario schools, in the backend, before phase 3 can be verified. Phases 1
and 2 are unaffected: neither needs a teacher.

### Phase 1 - The calendar half (DONE)

Hub, Events, Term view, the event drawer in both its phase-1 modes, the confirm
modal and the toasts. The two dummy-data screens are gone, and with them the
last hard-coded data in the module.

Shipped:

- **Hub** (`/academic-calendar`): the year with its term pills, the teaching-day
  progress bar, four counts, next-up, the Go-to grid, and the alerts panel over
  all six alert codes. Only the alert TITLES are ours; the sentence under each
  is the server's, because it counts and names the actual rows.
- **Events** (`/academic-calendar/events`): the table, both empty states, a
  filter panel with type / term / scope plus removable chips, the row menu, the
  count line, "Outside every term" as a real answer rather than a gap, and the
  audience line under the scope.
- **Term view** (`/academic-calendar/term-view`): the year as one bar with the
  terms positioned by date so the gaps between them show, today's marker, and a
  month grid that fetches the window it draws rather than slicing the year.
- **The event drawer**: its own file rather than a sixth caller of the academics
  `EntityDrawer` - that one's spine is name + code, and an event has no code and
  four fields it has never heard of. It borrows that drawer's hard-won rules
  (touched-not-blurred, refusals under the field they name, re-seeded during
  render, scope stated when it is not a choice) and adds two of its own: a
  warning is not a refusal, and changing the branch clears the audience.
- **The audience control**, which the design does not have. Levels grouped by
  programme, single classes below them, and a class whose level is already
  picked shown as covered rather than hidden.
- **Nav**: `Calendar` with Overview / Events / Term view, gated on
  `academics.calendar.view`. Timetables joins as its screens land.

**Verified against the running API**, driven in a browser as a real admin:

- Every screen renders real seeded data with **zero console or page errors**.
- The write path works end to end. Creating an event dated outside every term
  saved, showed the success toast AND a separate warning toast carrying the
  server's sentence, and the row rendered with "Outside every term" and its
  audience. That is the "a warning is not a refusal" rule, working.
- The narrowed closure reads correctly at last: the Events row shows
  "School-wide / Primary 1" and the drawer says "Who it covers: Primary 1".
- Zero horizontal overflow at 390px and 820px on all three screens.

**Two things the phone pass caught, both fixed:**

1. Next-up put the event name in a `flex-1` box between a chip and two dates,
   so on a phone it truncated to "Indep…" and "M…" - the one thing on the row a
   reader needs. It is two lines at every width now.
2. The month grid had a fixed 38rem and scrolled sideways inside its box. That
   kept the page from overflowing, which is the rule, but left a phone showing
   Sunday to Wednesday. A month you have to drag to read is not one you can
   browse. Below `sm` all seven columns now fit and each day carries a coloured
   dot per event instead of its name, because a 50px column cannot hold
   "Inter-house Sports" at any readable size. The name is one tap away.

**And one wording fix:** the branch block and the audience block were both
headed "Applies to". Two adjacent headings with the same words meaning
different things - where, and who - is a form nobody can fill in confidently.
The second is "Who it covers".

**And a tree that died with them.** `src/components/event-calendar/` - 17 files,
140K, a drag-and-drop calendar - was only ever reachable from the dummy screens.
It has been removed, along with `@dnd-kit/core`, `@dnd-kit/modifiers` and
`@dnd-kit/utilities`, which nothing else in the app imported. (`modifiers` was
never imported by anything at all, including that tree.)

Checked before removing: the design has no drag-and-drop anywhere. The only
"drop" in 150K of markup is the word "dropdown" in a comment, and the class
timetable grid says "Click an empty cell to fill it", which is what phase 3
builds. If a draggable timetable is ever wanted it is `npm i @dnd-kit/core
@dnd-kit/utilities` and a new component, not a resurrection of this one.

The win is the source tree and the lint count, not the bundle: 12 of the repo's
30 eslint errors were in those files, and the bundle is byte-for-byte unchanged
because nothing imported the tree, so tree-shaking had already excluded it.

### Phase 2 - Rooms and the bell schedule (DONE)

Two flat lists that depend on nothing, and the bell schedule is what unblocks
phase 3.

Shipped:

- **Rooms** (`/timetables/rooms`): cards and table, the filter panel with type
  and status plus chips, both empty states, the drawer, and the two controls
  ruling D kept apart - Deactivate takes a room out of use and leaves everything
  scheduled in it alone; Delete removes it outright and the server refuses that
  for any room holding anything. Each card carries the server's own usage line
  ("3 lessons · 2 exam papers"), and the delete refusal is worded from the same
  counts, so the card and the refusal cannot disagree.
- **Bell schedule** (`/timetables/bell-schedule`): the day tabs, the school-day
  strip, the table, the empty state that explains it is a prerequisite, and the
  drawer with its overlap and time refusals.
- **Nav**: a `Timetables` group beside `Calendar`, gated on
  `academics.timetable.view` - so a reader holding the calendar key and not the
  timetable one gets the first group and not the second.

**Verified against the running API**: every screen renders seeded data with zero
console or page errors, and no horizontal overflow at 390px or 820px.

**A backend gap this phase found and closed.** A duplicate room name answered
the platform's generic "A record with these details already exists" - no field,
no row, no branch - on a drawer holding a Name box AND a Code box. The person
could not tell which was wrong. `vs_academics` solved this for the catalogue
long ago with `services/uniqueness.py`; the room surface never caught up.

It is deliberately not the same helper. The catalogue's message states the rule
it enforces, and the rule differs: a department name is unique across the
school, a room name only within its branch. Borrowing the sentence would tell a
school that "Block A Room 1" cannot exist at two branches, which is false and is
the ordinary case. So `vs_calendar` raises its own two refusals with its own
words, under the same error codes so the drawer can put each under the right box:

> Science Lab already exists at Holy Cross College Main Branch. Room names only
> have to be unique within a branch, so pick a different one here.

The existing test asserted only a 4xx status, which is exactly why the generic
message survived. It now asserts the code, the field, the branch and the rule,
and there are two more beside it for the code refusal and for the
editing-a-row-without-renaming-it case.

**One thing the screenshots caught.** On the "All" tab the school-day strip drew
every row on file end to end - the everyday schedule followed by Friday's own -
and summarised it as a day running 08:00 to 10:00, which is not a day this
school or any other has. The table below lists rows; the strip answers "what
does a day look like", and those stop being the same question the moment one day
overrides the others. On All it now draws the everyday schedule and says so.

### Phase 3 - Class timetables (DONE)

The biggest phase, and the one the bell schedule existed to unblock.

Shipped:

- **The grid** (`/timetables/classes`): periods down the side, five days across,
  four cell states, non-teaching rows styled from their kind, and a period a day
  does not run rendered as a gap rather than as an empty slot that invites a
  click the server would refuse.
- **The class picker**: search, per-class lesson count, publish state and clash
  marker. "Not started" is an absent record, not a status.
- **The lesson drawer**: subject required, teacher and room optional, and the
  rule the whole screen turns on written into it - a clash SAVES, both cells go
  red, and only publishing is blocked.
- **The clash panel**, listing the server's own sentences, each naming who is
  double-booked and where.
- **Clear** with a confirm that says how many lessons go and whether the grid
  drops back to draft, and **Publish** with the server's refusal shown verbatim.
- **The duplicate drawer** with a live server-computed preview: copied,
  replaced, skipped, and the rows themselves.
- `TimetableGrid` is deliberately one component with a `variant`, because phase
  4 is the same document read the other way round.

**Verified against the running API**, driven in a browser:

- Zero console or page errors. 285 frontend tests pass, lint and build clean.
- **The publish gate refuses**, in the server's words: "6 clashes are
  unresolved. Fix them and publish again."
- **Clashes render as pairs.** One teacher booked into three classes at the same
  period produces six warnings sharing slots, and every involved cell is red.
- The duplicate preview reports 3 copied, 3 replaced, and lists each row with
  its day, period, subject, teacher and room.
- No horizontal overflow at 390px or 820px. The grid scrolls inside its own box
  on a phone, which is what the depth policy asks of complex editing: usable,
  not redesigned.

**A correction to this plan.** Phases 3 to 5 were recorded as unverifiable for
want of teachers. That was wrong. Holy Cross has one teacher and three classes,
and the seeder books that person into all three at the same period - which is
precisely a teacher double-booking. The headline state of this phase, the next
one and the publish gate is reachable today. What is still NOT reachable is the
single-branch shape of a grid (St Monica's has no lessons), and that is a
smaller gap than the one recorded.

**Two things the screenshots caught.**

1. `DuplicateSummary` was typed from the plan rather than from the wire, and the
   plan was wrong. The server sends `{day_of_week, period, subject, teacher,
   room}`, not `{day, period, subject, detail}`, so the preview rendered a
   leading "·" with no day and dropped the teacher and room entirely - on the
   one control whose whole job is to say what a copy will do. The types now
   match the service, and `skipped_rows` renders too.
2. A school with a short Friday gets two grid rows both labelled "Period 1",
   told apart by their times alone, which is how somebody schedules a lesson
   into the wrong one. Rows that share a label now name the days they run. The
   first attempt tagged every row that any day skipped, which put "Monday,
   Tuesday, Wednesday, Thursday only" on eight of eleven rows and buried the two
   that needed it; the rule is now "only where a label repeats", with a test
   pinning both halves.

**Not reachable in the seeded data, so rendered but not driven:** the
`has_bell_schedule` blocking state, since all three demo schools have bells.

### Phase 4 - Teacher timetables (DONE)

Cheap, as predicted: the same grid renderer, read-only, plus a picker and four
figures.

Shipped:

- **One teacher's week** at `/timetables/teachers`, drawn by the phase-3 grid
  with `variant="teacher"` - the second line of a filled cell names the class
  instead of the teacher, and no cell is pressable, because there is nothing
  here to write to.
- **The picker is not narrowed by the branch lens**, and it is the one place in
  this module that deliberately ignores it: a list filtered to the branch being
  looked at would hide half a cross-branch teacher's week from the person
  checking whether they are over-booked.
- **The four figures**, and the cross-branch line beneath them naming the sites
  a person teaches at.
- **`RowPicker`**: the class picker and the teacher picker turned out to be one
  control with a different subtitle, so they are now one component and two
  callers rather than two files that would drift.

**Verified against the running API**: zero console errors, no overflow at 390px
or 820px, and the read-only week renders with its clashes.

**Two things the wire disagreed with, both fixed.**

1. **A teacher's cells are not a class's cells.** They carry no `start_time` or
   `end_time`, and they hang their warnings on each cell instead of reporting
   them once at grid level. `GridCell` had both times as required, so the shared
   renderer read `.slice()` off an absent value - defended against, but only by
   accident. The type now says which fields each grid sends, and `toRows` leaves
   the time blank rather than printing a bare " - ".
2. **The same clash rides on both cells of its pair.** Collected naively, the
   panel reported one double-booking twice. `warningsFromDays` deduplicates on
   code and sentence, with a test pinning it.

**And a number that needed reconciling.** The picker says Ngozi Eze holds 9
lessons; the summary says 3 teaching periods. Both are right: the backend keys a
teacher's grid by (day, period), so three lessons at 9am on Monday occupy one
cell and only one can be drawn. Two figures disagreeing by a factor of three on
one screen is not something to leave to the reader, so the screen now says it -
and only when it is true, because the hidden lessons are exactly the clashes
already listed above it.

### Phase 5 - Exam scheduling (DONE)

The last of the real work, and the screen where the rules face the other way.

Shipped:

- **The blocking empty state**: no exam period means nowhere to put a paper,
  because a schedule hangs off a dated event on the calendar. It sends the
  reader to Events rather than drawing an empty table.
- **The period header, status chip and paper count**, with the dates marked
  "from the calendar" because they are the event's and are never copied.
- **The papers table** ordered by date and by sitting - and sittings rank by
  time of day, never by name, or "afternoon" sorts before "morning" and inverts
  every day holding both.
- **The paper drawer**, with the split stated in it: a room used twice or an
  invigilator in two rooms saves with a warning; a class sitting two papers at
  once is refused.
- **The clash panel** with its own copy, and **Publish** with the server's
  refusal.
- **The exam period picker (ruling C)**, rendered only when there is more than
  one - reusing phase 4's `RowPicker`.

**Verified against the running API**: zero unexpected console errors, no
overflow at 390px or 820px, and the phone renders the papers as stacked cards.

**The last instance of a defect I had already fixed once.** A class sitting two
papers in one sitting answered the platform's generic "A record with these
details already exists" - on a form carrying six fields. The room surface had
the same gap and was closed in phase 2; this is the sweep that should have gone
with it. `_validate` is the choke point both create and update already run
through, so the refusal now lives there and cannot drift between them:

> JSS1 B is already sitting Basic Science in the 09 Nov 2026 morning sitting. A
> class can only sit one paper at a time - move one of them to another sitting.

And, for the third time in this module, **the test is why it survived**: it
asserted only that the status was a 4xx, which the generic message satisfied.
It now asserts the code, the field, the class and the paper it collided with,
with a second test for editing a paper without moving it.

**A note on the demo data.** The seeder's docstring says St Monica's has no
exam period so the empty state is reachable. It does have one, so that state is
rendered but not driven - the same kind of drift as the audience closure phase 0
found.

### The refusal sweep (DONE)

Three of this module's refusals turned out to be the platform's generic "A
record with these details already exists", each protected by a test that
asserted only a 4xx status. After the third, the pattern was worth chasing
rather than fixing one at a time.

**The method.** Every status-only assertion in the package
(`assertIn(response.status_code, (...))` - six of them), plus every unique and
check constraint in `models.py` walked one by one and fired against the running
API to see what a caller actually gets.

**Three findings, and the worst was not a message at all.**

1. **An exam paper with the end time before the start answered 500** and logged
   a server exception, for what is an ordinary typo. `ck_examslot_times` refused
   it and nothing caught the IntegrityError. The bell schedule has answered the
   same mistake with a sentence since it was written; the exam surface had never
   caught up. Now `EXAM_TIMES_INVALID`, 422, with the same words.
2. **A cell that already holds a lesson answered the generic message** - and
   this is the most reachable refusal in the module. Two people editing one
   class's week hit it, and so does anyone who clicks a cell that was filled
   while they were looking at it. On a grid it meant a cell simply refused to
   fill and said nothing. Now `CELL_ALREADY_FILLED`, naming the lesson that is
   already there, because deciding whether to replace it is the next thing the
   person does. Fixed in `validate_slot`, which create and update both already
   run through.
3. **Naming the same level twice in an audience was refused as a duplicate.**
   "The whole of JSS1, and JSS1" is one narrowing, not a conflict - redundant,
   not invalid. The write now deduplicates.

**Three cleared.** A non-teacher named as a teacher, a write into an archived
year, and a branch-tied caller placing a room elsewhere all carry written
sentences already. The four period-order constraints were driven and are
unreachable through the API: the order is computed from the times and
overlapping times are refused first.

Four tests added, each asserting the code, the field and the words rather than
the status. `vs_calendar` is now at 153.

**The pattern worth remembering:** every one of these was a real, deliberate
refusal wearing a message nobody wrote, and in every case the test passed
because a generic refusal is still a 4xx. A status-only assertion on a refusal
is not a test of the refusal - it is a test that something went wrong.

### The same sweep on `vs_academics` (DONE)

The method transferred: every status-only assertion in the package (seven), and
every unique and check constraint in `models.py` (twenty-two), fired against the
running API.

`vs_academics` already had `services/uniqueness.py`, which gives names and codes
written refusals across departments, programmes, levels, classes and subjects.
**That helper is the reason the module looked clean, and the reason the gaps
were where they were: it knows about names and codes, and three constraints are
about neither.**

**Four findings, all the same shape.**

1. **Two terms in a year sharing a NAME** answered the generic message. Every
   other rule in `validate_terms` names the term it is about; this one had not
   caught up.
2. **Two terms sharing a NUMBER** likewise - and the more confusing of the two,
   because the numbers are what every consumer reads a year by.
3. **Two levels in a programme sharing a POSITION.** The level's name and code
   have carried written refusals since `uniqueness.py` was added; its position
   was left behind.
4. **A session sent the same branch twice** was refused as a duplicate. Naming a
   branch twice means naming it once - redundant, not invalid. Now deduplicated
   on the resolved branch rather than on the id, because a caller may name one
   branch by id and the same branch by slug.

All four now name the row they collided with. Terms are fixed in
`validate_terms`, which is the one place both create and update already pass
through.

**Cleared:** every name and code across the catalogue (uniqueness.py), session
and term dates, the terminal-level rule, subject offerings (already
deduplicated), and the one-active-session constraint - which is not a refusal at
all, it reassigns.

**One thing found that is not a refusal, and then fixed.** Four query-budget
tests were failing before this sweep, each by exactly one query. The single
cause: `PermissionRegistryRevision.current()`, a primary-key read of a one-row
table on every permission evaluation, added by the in-progress RBAC liveness
work in the tree. It buys an emergency permission revocation that reaches every
worker after the write commits, which process memory cannot do.

**The budgets were raised to meet it, not the other way round.** An attempt to
memoise the revision per request was tried and reverted: `vs_rbac`'s own
liveness tests refuse it, and they are right to. The whole point is that a
warm user object loses its authority the moment the registry changes, and a
per-request memo is exactly what would keep the old authority alive. The query
is the feature.

The per-module counts those tests really assert - five queries for the tree,
ten for the overview, and neither growing with the size of the school - were
never affected: the extra query is RBAC's, not this module's. `_BudgetMixin`
now says so in its docstring, so the next person to see one of these fail by a
small amount reads the captured queries before changing a number.

### Phase 6 - Export - **done**

The print view for the class grid and the exam table, plus the gated Export
Centre buttons beside them.

**What shipped.** A Print button on both screens calling `window.print()`, and
the existing gated `ExportButton` next to it - `calendar.timetable` on the class
grid (params `school_class`, `branch`) and `calendar.exam_papers` on the exam
table (param `branch`). Both screen bindings were already registered in
`export_datasets.py`, so a school granted the export keys sees the second button
appear without a code change, which is what ruling A asked for.

**One print block, in `src/index.css`, not per-screen print utilities.** The
rule is `body * { visibility: hidden }` then `.print-area, .print-area *
{ visibility: visible }`: it prints one region and everything the region
contains, without every screen having to name what to suppress. Around that:
`.print-hide` for chrome inside the region (toolbars, the on-screen header, the
clash panel, the publication note), `.print-only` for a document heading that
exists only on paper, `.print-drop-last` to remove a table's Action column, and
`.print-blank` for an empty cell's "Add".

**Four things the first PDF got wrong, and why each one mattered:**

1. *Invisible is not absent.* The sidebar and toolbar were `visibility: hidden`,
   so they still occupied their boxes: the timetable printed shifted right and
   down, with Friday off the edge of the sheet. Chrome is now `display: none`.
2. *"Add" printed in every empty cell.* A `print:invisible` Tailwind utility
   lost to `.print-area *`, because Tailwind v4 utilities sit in a layer that
   plain stylesheet rules outrank. The class carries `!important` and says so.
3. *The header printed twice*, once from the screen and once from the print-only
   document heading.
4. *The print line said the grid "has not been published"* beside a Published
   badge. It now states the clash count alone. A published grid can acquire a
   clash later, so the old sentence was false exactly when somebody was printing
   to find out what was wrong.

**Verified** by driving both screens logged in and rendering real PDFs through
Chrome's own print pipeline, not by reading the CSS. That pipeline has one trap
worth recording: `page.pdf()` uses print media *unless* `emulateMedia` has been
set, and a leftover `{media: "screen"}` from an earlier step silently produced an
exam PDF containing the whole application chrome - a harness fault that reads
exactly like the app ignoring the print rules.

### Phase B1 - The calendar import dataset (backend, parallel track)

A different repo and a different reviewer, so it runs alongside phases 2 to 5
rather than inside them. It must land **after** phase 1's audience write, so the
file format and the form agree on what an audience is.

**This is the first school-importable dataset in the platform, and that is the
main thing to know about it.** `vs_import_data/datasets.py` classifies every
dataset as platform-only or school-owned, and `TENANT_DATASETS` is **an empty
frozenset today**. Every existing dataset (schools, branches, CX users, bank
statements) is CodeX's. `platform_only()` fails closed, so the set being empty
is what currently makes the school import screen show an empty table.

Adding `calendar_events` to that set is the first time the answer is ever "yes,
a school may import this". The module's own docstring records what went wrong
the last time datasets were unclassified: a school administrator uploaded a
branches CSV and created a branch, a branch administrator and a branch-scoped
role, all of which the branch API refuses at the front door. So this change is
reviewed as a permissions change, not as a spreadsheet feature.

What it takes, in the order it has to happen:

1. `DatasetTypeChoices.CALENDAR_EVENTS`, and a migration for the changed
   choices.
2. Classify it in `datasets.py` by adding it to `TENANT_DATASETS`, with the
   reasoning written beside it the way `branches` has its own.
   `test_every_dataset_type_is_classified` fails until this is deliberate.
3. The template in `seed_import.py`. Columns, and the shape is the deliverable:

   | Column | Required | Notes |
   | --- | --- | --- |
   | `name` | yes | |
   | `event_type` | yes | one of the six labels, matched case-insensitively, not the stored code |
   | `start_date` | yes | `YYYY-MM-DD` |
   | `end_date` | yes | same as start for a one-day event, never blank |
   | `branch` | no | branch name; blank means the whole school. **Refused, not ignored, for a single-branch school** |
   | `closes_school` | no | yes/no, default no |
   | `description` | no | |
   | `applies_to` | no | semicolon-separated level or class names: `Primary 4 A; JSS1`. Blank means everybody, which is the common case |

   `applies_to` resolves names against the event's own branch scope and against
   the batch's session, level first then class, and a name that matches neither
   is a row error naming the name. It must never silently import as "everybody",
   because that is the Mrs Adeyemi case arriving by spreadsheet.
4. `import_calendar_events_row` in `import_executor.py` plus its dispatcher
   branch. **A new pattern: this is the first handler that must scope to the
   batch's own tenant.** The three existing handlers are platform-side and one
   of them deliberately forces the platform tenant as its target, which is
   correct for a CodeX operator and catastrophic for anyone else. The template
   therefore has no school column and the handler must not accept one.
5. Row rules in `validation_service.py`: dates inside the session, event type
   recognised, branch resolvable and permitted, `applies_to` resolvable, and the
   overlap warning the API already returns.
6. A reverser in `reversers.py` plus its `reverse_row` branch, because rollback
   is a first-class feature of this engine and every other dataset has one. An
   event's audience rows cascade, so reversing an event is one delete.
7. Tests: the school-may-import case, the cross-tenant refusal, the
   single-branch `branch` refusal, an `applies_to` name that resolves to
   nothing, and a rollback.

**And it turns a frontend screen on.**
[import.tsx](src/pages/protected/onboarding/import.tsx) reads the template list
through the API and today renders an empty table by design. The day this lands
it renders a row, and the whole upload, map, validate, import path becomes
reachable from school-fe for the first time. That path needs driving end to end
before this is called done, and it is not currently in anyone's phase.

---

## 5. Order, and why

1. **Phase 0 first because the permission registry blocks everything after it.**
   Five keys the backend grants and the frontend has never heard of. Any screen
   built before them is built ungated, and ungated screens are the ones that stay
   ungated.
2. **Phase 1 before phase 2 because it is the only phase that removes something
   wrong.** Two screens are lying to users with hard-coded data right now.
   Everything else in this plan is an absence, which is honest; those two are not.
3. **Phase 2 before phase 3 because a grid with no bell schedule has no rows.**
   This is a real dependency, not an aesthetic one: the design gives it a whole
   blocking empty state.
4. **Phase 4 after phase 3 because it is the same renderer.** Building it first
   would mean building the grid twice.
5. **Phase 5 last of the real work** because it is the only screen whose
   prerequisite is a *calendar event of a particular type*, so it needs phase 1
   finished to be testable at all, and because Sunrise's empty state is the one
   demo shape that proves it.
6. **Phase 6 last** because it is the only work here with no endpoint behind it
   at all, and because a print view of a grid needs the grid, which is phase 3.
   It is the smallest phase in the plan.
7. **Phase B1 starts once phase 1 is merged and then runs on its own clock.** It
   is the other repo, it blocks nothing here, and nothing here blocks it after
   phase 1. Do not start it earlier: the file format has to describe an audience
   the form has already settled, or the two disagree and one of them is rewritten.

**Nothing in this plan is parked, and nothing waits on anyone outside it.** All
four rulings are taken, every endpoint phases 0 to 5 need already exists, and
the only work with no server behind it is a print stylesheet in phase 6.

**One thing in this plan is not a wiring job.** Phase B1 opens the school import
surface for the first time in the platform's life. Everything else here connects
a finished server to a screen; that one changes who is allowed to write what, and
should be reviewed by whoever owns `vs_import_data` rather than by whoever
reviews the calendar screens.
