# AGENTS.md — school-fe

## Pre-ship review (`ship-check`)

When I say **`ship-check`** (or "run the ship-check") on a change, answer these
four questions about the code you just wrote — honestly and specifically, not as
a rubber stamp. Point at real files/lines, name concrete risks, and if the answer
to 1 or 2 is "no", say so and propose the fix. Don't claim "secure/efficient"
without naming *what* makes it so.

1. **Did you build this in the most secure way?**
   - `rbac_permission` (or equivalent authz) on every new view, and the right
     verb (view vs create/update/generate). Entity/tenant scoping via the
     standard resolver — can a caller read/write another tenant's rows by
     changing a pk or `?entity=`?
   - What does the serializer expose? Flag raw `JSONField`/metadata, PII,
     secrets, internal ids. Apply FLS where the field is sensitive.
   - Input validation, mass-assignment, and injection surface.

2. **Did you build this in the most efficient way?**
   - Query cost: N+1 (`select_related`/`prefetch_related`), missing indexes for
     the filter/order columns, unbounded querysets, pagination where lists grow.
   - Transactions/locking correct and no wider than needed; no redundant writes.
   - Is there a simpler implementation that does the same job?

3. **What regressions could this introduce?**
   - Migrations (reversible? data-safe?), changed response shapes, permission
     keys that must be seeded/assigned, signals/side-effects, shared services.
   - List the blast radius explicitly; "none" needs justifying.

4. **What tests do we need before we ship it?**
   - Security-critical first: permission-denied (403) and cross-tenant isolation.
   - Then happy path + every filter/branch + the empty-list response shape
     (`success_response` coerces `[]` → `{}`).
   - Name the tests; if you added some, say which cases are still uncovered.

Finish with a one-line **verdict**: ship / fix-first, and the single most
important thing to do before shipping.


## Wrapping up: report in plain words

When you finish a task — a build, an investigation, a document, a round of
decisions — close with a plain-language breakdown rather than a wall of prose.
Short numbered lines, one point each, ordinary words. Assume I am reading it tired.

Use **only** the sections that actually apply, and **skip the ones that don't** —
an empty heading is worse than no heading, and never pad a section to fill it out.

- **What you now have** — the finished things, one line each. Only if something was
  produced.
- **What you decided** — decisions taken and locked, one line each. Only if
  decisions were actually made.
- **What we found wrong in the code** — real defects and gaps, grouped under short
  themes once there are more than about four. **Only if there are findings** — if
  nothing is wrong, leave this out entirely rather than writing "nothing found".
- **Where to go next** — the order of the next steps, and which of them are
  unblocked right now.

How to write it:

- Plain words beat precise jargon. "Purchases can approve themselves" lands;
  "`skip_if_no_approvers` permits terminal auto-approval" does not.
- Size things honestly in both directions — say when something feared turns out to
  be a one-line fix, and say when something small turns out to be load-bearing.
- Put the worst finding where it cannot be missed, even if that breaks the order.
- Keep file/line references out of the breakdown; they belong in `todo.md` and in
  the detail above it.
- Don't re-explain what I already know from the conversation.

## Fixing problems: root cause, not symptom

When I ask you to fix a problem, treat the reported issue as one *instance* of
a potentially wider defect — fix it holistically:

1. **Trace it to its source.** Ask why the bug exists — a wrong assumption, a
   missing invariant, a fragile pattern — not just where it surfaced.
2. **Fix the class, not the case.** If the same root cause can bite elsewhere
   (other screens, endpoints, callers of the same helper), fix it at the choke
   point they all share, or sweep the other occurrences in the same change.
3. **Name the root.** In the summary/commit, state the underlying cause and
   where else it applied, so the fix is reviewable as a class-fix, not a patch.

A fix that only silences the reported symptom while the source remains is not
done — that includes suppressing errors, special-casing one caller, or adding
a guard where the real problem is upstream. The goal is that future problems
from the same source never happen.

## Responsive views — every screen must work on phone AND desktop

Every screen you build or change must render well at desktop **and** small
widths — a user switching from PC to phone must never get a broken view.
Horizontal page overflow is a bug, full stop.

House conventions (proven app-wide in console-fe; apply them here):
- The DashboardLayout children wrapper needs `grid grid-cols-1 min-w-0` so
  nowrap tables can never stretch a page past the viewport. **Known gap:**
  this repo's `dashboard-layout.tsx` does NOT have that wrapper yet — port it
  from console-fe (`src/components/layout/dashboard-layout.tsx`) on the first
  responsive pass, along with CustomTable's phone-card mode (rows render as
  stacked label/value cards below `md`; dense tables opt out with
  `mobile="scroll"`).
- Toolbars/action rows get `flex-wrap`; tab strips `max-w-full
  overflow-x-auto` with `whitespace-nowrap` buttons; form grids
  `grid-cols-1 sm:grid-cols-N`; count-KPI strips `grid-cols-2 … lg:grid-cols-4`
  (long money values stay 1-col on phones); drawers `w-full sm:max-w-[…]`;
  fixed side rails/sidebars stack below `md`
  (`grid-cols-1 md:grid-cols-[260px_1fr]`).
- In a flex row, a `flex-1` wrapper needs `min-w-0` or descendant `truncate`
  silently stops working.

**Verify, don't assume.** After any screen work run the overflow probe:
`cd .claude && BASE_URL=<vite-url> ROUTES="/your/routes" node ./mobile-audit.mjs`
(one-time: `cd .claude && npm init -y && npm i playwright`; pass EMAIL/PASSWORD
for this app's seeded login). It drives each route logged-in at 390px (phone)
and 820px (tablet), screenshots both to `/tmp/verify-design/shots-responsive/`,
and reports page-level horizontal overflow with the offending elements. **Look
at the phone screenshots** — zero overflow with a crushed side-by-side layout
is still a fail. Desktop remains the design source of truth; phone adapts
(stack, wrap, cards) — never hide or truncate data away.

**Depth policy — phones are view + simple actions, not full parity.** Phone
users browse, read details, approve, and fill simple forms — those flows must
be genuinely good. Complex multi-line creation/editing (fee structures, bulk
editors, multi-row forms) stays desktop-first: on a phone it must be *usable*
(no overflow, nothing broken or unreachable), but don't spend effort
optimizing it or redesigning it phone-first, and never degrade the desktop
experience to make it fit.
