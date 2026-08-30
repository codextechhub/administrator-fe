// The action registry: every action a school user can type into the palette.
//
// Derived from what this app actually serves, not from what it might one day
// serve. Each entry was checked against three things and agrees with all three:
//   1. src/routes/protected/*.tsx  - the route is registered, so `to` resolves.
//   2. src/components/app-sidebar.tsx and the screen's own gate - the `gate`
//      here is the same key the screen checks, so the palette never offers a
//      door that answers 403 on arrival.
//   3. src/components/layout/app-search.tsx - the destination list this replaces.
//
// Deliberately absent:
// - Finance and Settings. The sidebar draws both, but their `url` is "#" and
//   there is no route behind either, so an action would navigate nowhere.
// - /onboarding/welcome and /onboarding/not-live. One is the screen before you
//   enter, the other is where a refusal lands. Neither is somewhere a person
//   asks to go.
// - /onboarding/import/:batchId/validation. It needs a batch id, and there is
//   no batch to name from a search box.
//
// ── Labels ───────────────────────────────────────────────────────────────────
// Labels lead with a verb because the matcher expands the leading verb through
// its synonym groups (see VERB_GROUPS in match.ts): "View students" is reached
// by "open students", "show students", "list students" and "see students"
// without any of those being written down. A bare noun label would match none
// of them. The noun after the verb is always the app's own word for the screen,
// so a result reads as the sidebar item or page title it opens.

import { P } from "@/permissions";
import { routesPath } from "@/routes/routesPath";
import type { ActionDef } from "./types";

const R = routesPath.PROTECTED;

export const ACTIONS: ActionDef[] = [
  // ── Overview ───────────────────────────────────────────────────────────────
  {
    id: "view-dashboard",
    label: "View dashboard",
    aliases: ["overview", "home"],
    section: "Overview",
    group: "Overview",
    kind: "view",
    gate: { perm: P.VIEW_SCHOOL_DASHBOARD },
    run: { to: R.OVERVIEW.INDEX },
  },
  {
    id: "view-branches",
    label: "View branches",
    // "campuses" and "sites" are what a user may TYPE, not what we write.
    // The house rule bans the word from our own copy; it does not ban us from
    // recognising it when somebody reaches for it. These are match keys and
    // are never rendered, so they stay.
    aliases: ["campuses", "sites"],
    section: "Overview",
    group: "Branches",
    kind: "view",
    gate: { perm: P.BROWSE_BRANCHES },
    run: { to: R.BRANCHES.INDEX },
  },
  {
    // The bell's screen. Not in the sidebar, and it has no permission of its
    // own: the notifications page gates nothing, because a school's own post is
    // not a capability it can be missing.
    id: "view-notifications",
    label: "View notifications",
    aliases: ["alerts", "inbox", "bell"],
    section: "Overview",
    group: "Notifications",
    kind: "view",
    gate: null,
    run: { to: R.NOTIFICATIONS },
  },

  // ── Academics ──────────────────────────────────────────────────────────────
  {
    id: "view-academic-structure",
    label: "View academic structure",
    aliases: ["structure", "overview", "programmes", "programs", "levels"],
    section: "Academics",
    group: "Academic structure",
    kind: "view",
    gate: { perm: P.BROWSE_STRUCTURE },
    run: { to: R.ACADEMIC_STRUCTURE.INDEX },
  },
  {
    id: "view-academic-session",
    label: "View academic session",
    aliases: ["sessions", "terms", "school year"],
    section: "Academics",
    group: "Academic structure",
    kind: "view",
    // The sidebar's Academic Structure group opens on any academics key, but
    // this child is gated on sessions alone - and so is the child link.
    gate: { perm: P.BROWSE_SESSIONS },
    run: { to: R.ACADEMIC_STRUCTURE.SESSIONS },
  },
  {
    id: "view-departments",
    label: "View departments",
    aliases: ["faculties", "faculty", "department"],
    section: "Academics",
    group: "Academic structure",
    kind: "view",
    gate: { perm: P.BROWSE_STRUCTURE },
    run: { to: R.ACADEMIC_STRUCTURE.DEPARTMENTS },
  },
  {
    id: "view-programmes",
    label: "View programmes and levels",
    aliases: ["programs", "programmes", "levels", "year groups"],
    section: "Academics",
    group: "Academic structure",
    kind: "view",
    gate: { perm: P.BROWSE_STRUCTURE },
    run: { to: R.ACADEMIC_STRUCTURE.PROGRAMS },
  },
  {
    id: "view-subjects",
    label: "View subjects",
    aliases: ["subject", "curriculum", "offered at"],
    section: "Academics",
    group: "Academic structure",
    kind: "view",
    gate: { perm: P.BROWSE_SUBJECTS },
    run: { to: R.ACADEMIC_STRUCTURE.SUBJECTS },
  },
  {
    id: "view-academic-calendar",
    label: "View academic calendar",
    // "calender" stays an alias: the old URL spelled it that way for months, so
    // it is what somebody who has used the app may still type.
    aliases: ["calendar", "calender", "events", "holidays"],
    section: "Academics",
    group: "Academic calendar",
    kind: "view",
    gate: { perm: P.BROWSE_CALENDAR },
    run: { to: R.ACADEMIC_CALENDAR.INDEX },
  },
  {
    id: "view-classes",
    label: "View classes",
    aliases: ["class list", "class rosters"],
    section: "Academics",
    group: "Academic structure",
    kind: "view",
    gate: { perm: P.BROWSE_CLASSES },
    run: { to: R.ACADEMIC_STRUCTURE.CLASSES },
  },

  // ── Onboarding ─────────────────────────────────────────────────────────────
  {
    id: "view-control-room",
    label: "View control room",
    aliases: ["control room", "onboarding", "checklist", "setup"],
    section: "Onboarding",
    group: "Control room",
    kind: "view",
    gate: { perm: P.VIEW_ONBOARDING },
    run: { to: R.ONBOARDING.INDEX },
  },
  {
    id: "view-school-profile",
    label: "View school profile",
    aliases: ["school details", "ownership", "term structure", "currency"],
    section: "Onboarding",
    group: "School profile",
    kind: "view",
    // A branch admin may read the profile and not edit it, so the action is
    // gated on the read key. The screen hides its own Save behind the update
    // key (see school-profile.tsx).
    gate: { perm: P.VIEW_SCHOOL_PROFILE },
    run: { to: R.ONBOARDING.PROFILE },
  },
  {
    id: "view-roles",
    label: "View roles and permissions",
    aliases: ["rbac", "permissions", "role templates"],
    section: "Onboarding",
    group: "Roles and invitations",
    kind: "view",
    // Only school_admin holds school.roles.view. A branch admin holds none of
    // the roles keys and the screen answers them a refusal panel, so the
    // action is hidden rather than offered and then refused.
    gate: { perm: P.VIEW_ROLES },
    run: { to: R.ONBOARDING.ROLES },
  },
  {
    // The same screen as above, opened on its second tab. Two actions rather
    // than one because they are two different permissions and two different
    // jobs: a branch admin can reach the invitations tab and not the roles one.
    id: "view-staff-invitations",
    label: "View staff invitations",
    aliases: ["invite", "invitations", "invite staff", "onboard admin"],
    section: "Onboarding",
    group: "Roles and invitations",
    kind: "view",
    gate: { perm: P.BROWSE_ADMINISTRATORS },
    run: { to: R.ONBOARDING.STAFF },
  },
  {
    id: "upload-datasets",
    label: "Upload datasets",
    aliases: ["import", "csv", "spreadsheet", "bulk upload"],
    section: "Onboarding",
    group: "Upload datasets",
    kind: "do",
    // Matches the control room card's own openPermission: the screen's first
    // request is the template list, and a reader who cannot read that has
    // nothing to choose from.
    gate: { perm: P.BROWSE_IMPORT_TEMPLATES },
    run: { to: R.ONBOARDING.IMPORT },
  },
  {
    id: "view-go-live",
    label: "View go-live",
    aliases: ["go live", "launch", "readiness", "request go-live"],
    section: "Onboarding",
    group: "Go-live",
    kind: "view",
    // The sidebar's own gate. Submitting needs REQUEST_GO_LIVE on top, which
    // the screen checks for itself before drawing the form.
    gate: { perm: P.VIEW_GO_LIVE_REQUESTS },
    run: { to: R.ONBOARDING.GO_LIVE },
  },
  {
    id: "get-help",
    label: "Get help",
    aliases: ["support", "raise ticket", "contact codex", "report a problem"],
    section: "Onboarding",
    group: "Help",
    kind: "do",
    // Open to everyone: a person who cannot reach a single other screen is
    // exactly the person who needs to say so.
    gate: null,
    // Opens the header's panel rather than navigating. Support is one surface
    // now that the sidebar has no Help item, and the panel keeps the screen
    // being reported on visible behind it.
    run: { command: "help" },
  },

  // ── Account ────────────────────────────────────────────────────────────────
  {
    id: "proxy-user",
    label: "Proxy user",
    aliases: ["view as another user", "impersonate", "act as"],
    section: "Account",
    group: "Account",
    kind: "do",
    // The header gates this on the ORIGINAL actor's keys, not the effective
    // ones, so the control stays put during a live proxy session. Phase 4 must
    // feed the palette the same actor permissions (selectActorPermissions) for
    // this gate to agree with the menu it mirrors.
    gate: { perm: P.START_PROXY_SESSION },
    run: { command: "proxy" },
  },
  {
    id: "logout",
    label: "Logout",
    aliases: ["sign out", "log out"],
    section: "Account",
    group: "Account",
    kind: "do",
    gate: null,
    run: { command: "logout" },
  },
];

// ── Readiness, which is not a permission ─────────────────────────────────────
//
// ActionDef has no field for "only before go-live" / "only after", and that is
// correct: readiness is tenant state, not a capability, and a gate that mixed
// the two would be a gate nobody could reason about. The distinction still
// exists in the app, so it is recorded here for the palette UI to apply.
//
// LIVE_ONLY_ACTION_IDS is the load-bearing half. A pending school reaches
// onboarding and nothing else: DashboardLayout draws the closed wall over every
// other page, and the server answers 403 TENANT_NOT_LIVE behind it. Offering
// "View students" to a school still being set up sends the reader to that wall.
// The palette UI MUST drop these while the tenant is pending.
export const LIVE_ONLY_ACTION_IDS: readonly string[] = [
  "view-dashboard",
  "view-branches",
  "view-academic-session",
  "view-academic-calendar",
  "view-classes",
];

// PENDING_ONLY_ACTION_IDS is the softer half, and only tidiness. These screens
// keep working after go-live (the control room becomes a read-only record of
// the setup, and Get Help is a support form at any time), but the sidebar stops
// drawing them, so a live school has no other route to them. Today's header
// search hides them after go-live; whether the palette should is a judgement
// call for the UI, not a fact about reachability.
export const PENDING_ONLY_ACTION_IDS: readonly string[] = [
  "view-control-room",
  "view-school-profile",
  "view-roles",
  "view-staff-invitations",
  "upload-datasets",
  "view-go-live",
  "get-help",
];
