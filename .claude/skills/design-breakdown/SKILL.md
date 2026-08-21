---
name: design-breakdown
description: Take a Claude Design export (a .dc.html source or a bundled .html) and turn it into a build plan - every screen and state enumerated, a two-way API audit against the backend (screens with no endpoint, endpoints with no screen), design elements that nothing can serve, and phases sized so each one ships. Use before building any module from a Claude Design prototype, and re-run when a design is revised.
---

# design-breakdown - read a design, produce a plan

A Claude Design prototype is not a picture of one screen. It is a small state
machine: a dozen screens, each with several states, plus overlays, plus two or
three mock tenants chosen so that between them they exercise states one tenant
cannot be in at once. Build from the screenshots and you will build the happy
path and discover the other twenty states one bug report at a time.

This skill reads the prototype as source, enumerates what is actually in it, and
checks each screen against the API that will have to feed it - in both
directions, because an endpoint nobody built a screen for is as much a finding
as a screen nobody built an endpoint for.

**The output is a plan, not code.** Building starts after the user has read it.

## Inputs

`$ARGUMENTS` = path to the design file. Either form works:

- `Foo.dc.html` - the design-project source. Preferred: it is already readable.
- `Foo.html` - the bundled export, which is what the Download button gives you.

If the file lives in a Claude Design project rather than on disk, fetch it with
the `DesignSync` tool (`method: "get_file"`) and write it somewhere local first.
`list_files` on the project also surfaces the design prompt and any update
documents in `uploads/` - **read those too**. They carry the decisions behind
the prototype, and a later "UPDATE" file usually overrides the original brief.

## Steps

### 1. Extract the readable source

A bundled export carries exactly the same markup as the `.dc.html` source, but
JSON-escaped inside a JavaScript string: `value=\"{{ isWelcome }}\"`, with
`/` standing in for every slash. Search it raw and you find nothing, which
reads like "this design has no screens in it" rather than "you did not unescape
it". Unescape first and the two forms become interchangeable.

Write this to a scratch file and run it:

```python
import re

s = open("DESIGN.html", encoding="utf-8", errors="replace").read()

# Bundled export detection: the markup is present, but the plain attribute form
# is not, because every quote in it is escaped.
if "<sc-if" in s and s.count('<sc-if value="') == 0:
    for a, b in (("\\u002F", "/"), ("\\u003C", "<"), ("\\u003E", ">"),
                 ("\\n", "\n"), ('\\"', '"'), ("\\'", "'")):
        s = s.replace(a, b)

body = s[s.find("<x-dc>"):] or s
body = re.sub(r"<svg.*?</svg>", "[i]", body, flags=re.S)
open("/tmp/design-source.html", "w").write(body)
print("markup chars:", len(body), "| sc-if blocks:", body.count("<sc-if"))
```

Sanity-check that block count against the plan you end up writing. If the file
has 128 `sc-if` blocks and your breakdown describes nine states, you have not
read the design - you have read its front page.

### 2. Enumerate screens and states by their flags

There are two shapes and you need both:

```python
import re

body = open("/tmp/design-source.html").read()

# A bare name is a screen or a page-level state.
plain = re.findall(r'<sc-if value="\{\{ (\w+) \}\}"', body)
# A dotted name is a per-row state inside a sc-for - where per-item variation hides.
dotted = sorted(set(re.findall(r'<sc-if value="\{\{ (\w+\.\w+) \}\}"', body)))

seen, order = set(), []
for f in plain:
    if f not in seen:
        seen.add(f)
        order.append((body.find('<sc-if value="{{ %s }}"' % f), f))
order.sort()
for i, (p, f) in enumerate(order):
    end = order[i + 1][0] if i + 1 < len(order) else len(body)
    print("%-22s %8d" % (f, end - p))

print("\nrow-scoped:", dotted)
# Occurrences against occurrences. Comparing unique names against the total
# block count reports a shortfall for every flag used more than once, which is
# most of them - a false alarm that sends you hunting for nothing.
seen_all = re.findall(r'<sc-if value="\{\{ [\w.]+ \}\}"', body)
print("accounted for:", len(seen_all), "of", body.count("<sc-if"))
```

Read the output like this:

- Top-level flags are **screens** (`isWelcome`, `isControl`, …). Their size is a
  fair proxy for how much screen there is to build.
- Flags appearing only inside another screen's span are that screen's **states**.
- Flags named `*Open` are **overlays** - modals, drawers, menus. Easy to miss
  from screenshots, expensive to add after the fact.
- **Dotted flags are the per-row action model.** On this platform they turned
  out to be `t.canSkip`, `t.canMark`, `t.showRefusal` and friends: the
  difference between rendering a list and rendering a working screen.

The final line is your proof you read all of it. If it does not add up, some
condition uses a shape these patterns miss - go and look at it rather than
planning around the part you happened to match.

### 3. Enumerate each screen's own states

For every screen, list the flags inside its span and the `sc-for` collections it
iterates. Write down every state, especially the unhappy ones: duplicate
detected, validation failed, nothing uploaded, partial success, refused by the
server. These are most of the work and none of the screenshots.

### 4. Find the mock tenants

Grep for the sample names and slugs. The design uses two or three deliberately
different ones - a multi-site tenant and a single-site one, one mid-progress and
one finished. **Those differences are requirements**, usually about what recedes
when it does not apply to a given tenant.

### 5. Audit the API in both directions

Read the backend's route map first (`apps/apps/urls.py` on this platform), then
put every screen in exactly one of four buckets:

1. **Served and wired** - an endpoint exists and a screen already calls it.
2. **Served, not wired** - the endpoint exists and the screen does not use it.
3. **Exists but closed** - the endpoint exists and is refused to this caller.
   Here that is usually a missing `pending_tenant_surface` or a permission key
   nobody holds. Cheap: a surface to open, not an engine to write.
4. **Absent** - no endpoint at all. Expensive. Say whether it is ours to build
   or another module's; if another module's, name it and mark the phase blocked.

Then run it the other way: list endpoints in the module's namespace that no
screen calls. Each one is either a gap in the design or dead API.

**Never merge buckets 3 and 4.** They are a surface flag apart and a module
apart respectively, and collapsing them into "no API" is how a two-day phase
gets planned next to a two-month one.

### 6. Find the elements nothing can serve

Search for controls with no data behind them: a search box with no search
endpoint, a count with no counter, a download with no document, a field the
model does not have. List each one. Do not silently drop them and do not
silently build them - each needs a ruling from the user, one line each.

### 7. Write the phases

Ordering rules, in priority order:

1. **Seed data first.** A phase that builds screens you cannot put into their
   states is a phase you cannot verify. The scenario tenants come before the
   screens.
2. **On-design refits of working screens before new screens.** Highest
   visibility, no backend dependency.
3. **Closed-surface work before absent-API work.** Opening a surface over a
   working engine is cheap per screen; a module from nothing is not.
4. **Blocked phases last, and parked rather than started.** Building against
   invented endpoint shapes means building twice.
5. **Every phase ships.** It builds, its tests pass, and its screens have been
   driven in a browser against the real API at 390px and desktop. No phase may
   leave a screen that looks finished and does nothing.

State plainly where the critical path you control ends, so a blocked dependency
does not read as the whole plan being blocked.

### 8. Deliver

Write the plan to `docs/<module>-design-phases.md` with four sections:

1. What the design contains - the screen / state / overlay table.
2. What the backend can serve - the four buckets, plus the unservable elements.
3. The phases - what each one ships.
4. Order, and why.

Then summarise in chat: the biggest screen, the biggest gap, and the one
decision you need from the user before phase one.

## What this skill is careful about

- **A design revision usually overrides the original brief.** Where a prompt and
  an update file disagree, the update wins. Read both before planning.
- **Screen count is not scope.** One 33 KB wizard with eight error states
  outweighs six small screens. Use markup size and state count, not headings.
- **Do not start building.** The plan is the deliverable. The user chooses the
  phase order and rules on the unservable elements.
