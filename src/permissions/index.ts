// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION REGISTRY
//
// Single source of truth. The backend permission keys ("module.resource.action")
// exist ONLY inside REGISTRY below - nowhere else in the codebase.
//
// P.* names describe what the user is doing in the UI, not how the backend
// models the permission. A reader of any other file cannot infer the backend
// key format from the constant name alone.
//
// ── Code format: MM RR AA (6 digits) ─────────────────────────────────────────
//   MM = module group   10=school  20=onboarding  30=academics
//   RR = resource       01 02 03 … (assigned sequentially per module)
//   AA = action         01=view   02=create  03=update  04=delete
//                       08=manage  09=suspend  10=reactivate  11=assign
//                       12=start   13=end
//                       39=view_sensitive
//
// ── Adding a permission ───────────────────────────────────────────────────────
//   1. Pick the next free code in the right MM RR range.
//   2. Add  "MMRRAA": "module.resource.action"  to REGISTRY.
//   3. Add a named constant to P that describes the UI capability.
//   4. Use P.YOUR_CONSTANT everywhere - never the raw key or the code directly.
//
// ── Adding a new module ───────────────────────────────────────────────────────
//   1. Pick the next free MM.
//   2. Start RR at 01 and AA at 01 within that range.
//   3. Add a comment block and constants to P below.
// ─────────────────────────────────────────────────────────────────────────────

const REGISTRY: Record<string, string> = {

  // ── school / dashboard  (MM=10, RR=01) ─────────────────────────────────────
  "100101": "school.dashboard.view",

  // ── school / branches  (MM=10, RR=02) ──────────────────────────────────────
  "100201": "school.branches.view",
  "100202": "school.branches.create",
  "100203": "school.branches.update",
  "100208": "school.branches.manage",

  // ── school / students  (MM=10, RR=03) ──────────────────────────────────────
  "100301": "school.students.view",
  "100302": "school.students.create",
  "100303": "school.students.update",
  "100308": "school.students.manage",
  "100339": "school.students.view_sensitive",

  // ── school / teachers  (MM=10, RR=04) ──────────────────────────────────────
  "100401": "school.teachers.view",
  "100402": "school.teachers.create",
  "100403": "school.teachers.update",
  "100408": "school.teachers.manage",

  // ── school / administrators  (MM=10, RR=05) ────────────────────────────────
  "100501": "school.administrators.view",
  "100502": "school.administrators.create",
  "100503": "school.administrators.update",
  "100509": "school.administrators.suspend",
  "100510": "school.administrators.reactivate",

  // ── school / fees  (MM=10, RR=06) ──────────────────────────────────────────
  "100601": "school.fees.view",
  "100608": "school.fees.manage",

  // ── school / settings  (MM=10, RR=07) ──────────────────────────────────────
  "100701": "school.settings.view",
  "100708": "school.settings.manage",

  // ── school / profile  (MM=10, RR=12) ───────────────────────────────────────
  // The school's own identity record: ownership type, term structure, currency,
  // address, website, motto, registration id and logo. NOT its name, address or
  // code - CodeX allocates those at creation and they stay on the platform
  // endpoint. `.update` is school_admin only; a branch admin may read.
  "101201": "school.profile.view",
  "101203": "school.profile.update",

  // ── school / roles  (MM=10, RR=08) ─────────────────────────────────────────
  // All five are seeded to school_admin and to NOBODY else - a branch admin
  // holds none of them, which is why the onboarding roles card hides its own
  // button rather than opening a screen that would 403.
  "100801": "school.roles.view",
  "100802": "school.roles.create",
  "100803": "school.roles.update",
  "100804": "school.roles.delete",
  "100811": "school.roles.assign",

  // ── school / impersonation  (MM=10, RR=09) ─────────────────────────────────
  // School-scoped proxy: act as another active user in your OWN school. The
  // backend seeds these to school_admin only (see the backend's
  // seed_school_permissions.py, whose table must stay in lockstep with this
  // registry). Deliberately a separate namespace from platform.impersonation.*
  // - a school key can never reach across tenants.
  "100901": "school.impersonation.view",
  "100912": "school.impersonation.start",
  "100913": "school.impersonation.end",

  // ── onboarding / progress  (MM=20, RR=01) ──────────────────────────────────
  // The control room's own keys. Approve, reject and reinstate are deliberately
  // absent: they are CodeX's decisions, taken from the console, and the backend
  // refuses them to any caller outside the platform tenant however the key was
  // acquired.
  "200101": "onboarding.progress.view",

  // ── onboarding / task  (MM=20, RR=02) ──────────────────────────────────────
  "200203": "onboarding.task.update",

  // ── onboarding / go-live  (MM=20, RR=03) ───────────────────────────────────
  "200301": "onboarding.go_live.view",
  "200302": "onboarding.go_live.submit",

  // ── academics / session  (MM=30, RR=01) ────────────────────────────────────
  "300101": "academics.session.view",
  "300102": "academics.session.create",
  "300103": "academics.session.update",
  "300108": "academics.session.manage",

  // ── academics / calendar  (MM=30, RR=02) ───────────────────────────────────
  "300201": "academics.calendar.view",
  "300202": "academics.calendar.create",
  "300203": "academics.calendar.update",
  "300208": "academics.calendar.manage",

  // ── academics / classes  (MM=30, RR=03) ────────────────────────────────────
  "300301": "academics.classes.view",
  "300302": "academics.classes.create",
  "300303": "academics.classes.update",
  "300308": "academics.classes.manage",
  "300311": "academics.classes.assign",

};

// ─────────────────────────────────────────────────────────────────────────────
// Public constants
// Names describe UI capabilities - not backend keys or permission structure.
// ─────────────────────────────────────────────────────────────────────────────
export const P = {

  // ── School Dashboard ───────────────────────────────────────────────────────
  VIEW_SCHOOL_DASHBOARD:   "100101",  // view the school admin dashboard metrics

  // ── Branch Management ──────────────────────────────────────────────────────
  BROWSE_BRANCHES:         "100201",  // view the school's branches list and detail
  ADD_BRANCH:              "100202",  // add a new branch to the school
  MODIFY_BRANCH:           "100203",  // edit branch details
  MANAGE_BRANCH:           "100208",  // transition branch lifecycle / configuration

  // ── Student Management ─────────────────────────────────────────────────────
  BROWSE_STUDENTS:         "100301",  // view the student roster and profiles
  ENROLL_STUDENT:          "100302",  // enroll / add a new student
  MODIFY_STUDENT:          "100303",  // edit an existing student's record
  MANAGE_STUDENTS:         "100308",  // student lifecycle: transfer, withdraw, graduate
  VIEW_STUDENT_SENSITIVE:  "100339",  // read FLS-gated sensitive student fields

  // ── Teacher Management ─────────────────────────────────────────────────────
  BROWSE_TEACHERS:         "100401",  // view the teacher list and profiles
  INVITE_TEACHER:          "100402",  // invite / add a new teacher
  MODIFY_TEACHER:          "100403",  // edit an existing teacher's profile
  MANAGE_TEACHERS:         "100408",  // teacher lifecycle and assignment management

  // ── Administrator Management ───────────────────────────────────────────────
  BROWSE_ADMINISTRATORS:   "100501",  // view school administrators
  INVITE_ADMINISTRATOR:    "100502",  // invite a new school administrator
  MODIFY_ADMINISTRATOR:    "100503",  // edit an administrator's profile
  SUSPEND_ADMINISTRATOR:   "100509",  // suspend an administrator account
  REACTIVATE_ADMINISTRATOR:"100510",  // reactivate a suspended administrator

  // ── Fees ───────────────────────────────────────────────────────────────────
  VIEW_FEES:               "100601",  // view fee structures and balances
  MANAGE_FEES:             "100608",  // create/edit fee structures and adjustments

  // ── Settings ───────────────────────────────────────────────────────────────
  VIEW_SETTINGS:           "100701",  // view school-level settings
  MANAGE_SETTINGS:         "100708",  // edit school-level settings and configuration

  // ── School Profile ─────────────────────────────────────────────────────────
  VIEW_SCHOOL_PROFILE:     "101201",  // read the school's own identity record
  UPDATE_SCHOOL_PROFILE:   "101203",  // edit ownership, term structure, currency, branding

  // ── Roles ──────────────────────────────────────────────────────────────────
  VIEW_ROLES:              "100801",  // view school roles and assignments
  CREATE_ROLE:             "100802",  // add a custom role of the school's own
  MODIFY_ROLE:             "100803",  // change what a role can reach
  DELETE_ROLE:             "100804",  // remove a custom role
  ASSIGN_ROLE:             "100811",  // assign or revoke roles from school users

  // ── Proxy (view the app as another user in this school) ────────────────────
  VIEW_PROXY_SESSIONS:     "100901",  // read the proxy session history / trail
  START_PROXY_SESSION:     "100912",  // search users and start viewing as one
  END_PROXY_SESSION:       "100913",  // end any proxy session in this school

  // ── School Onboarding (the control room, before go-live) ───────────────────
  VIEW_ONBOARDING:         "200101",  // read the control room: checklist, counts, gate
  UPDATE_ONBOARDING_TASK:  "200203",  // mark a step done, skip it, or reopen it
  VIEW_GO_LIVE_REQUESTS:   "200301",  // read this school's go-live request history
  REQUEST_GO_LIVE:         "200302",  // ask CodeX to take the school live

  // ── Academic Sessions ──────────────────────────────────────────────────────
  BROWSE_SESSIONS:         "300101",  // view academic sessions / terms
  CREATE_SESSION:          "300102",  // create a new academic session
  MODIFY_SESSION:          "300103",  // edit an academic session
  MANAGE_SESSIONS:         "300108",  // session lifecycle: activate, archive, close

  // ── Academic Calendar ──────────────────────────────────────────────────────
  BROWSE_CALENDAR:         "300201",  // view the academic calendar and events
  CREATE_CALENDAR_EVENT:   "300202",  // add a calendar event
  MODIFY_CALENDAR_EVENT:   "300203",  // edit a calendar event
  MANAGE_CALENDAR:         "300208",  // manage calendar configuration and bulk events

  // ── Classes ────────────────────────────────────────────────────────────────
  BROWSE_CLASSES:          "300301",  // view classes and their rosters
  CREATE_CLASS:            "300302",  // create a new class
  MODIFY_CLASS:            "300303",  // edit a class
  MANAGE_CLASSES:          "300308",  // class lifecycle and configuration
  ASSIGN_CLASS:            "300311",  // assign teachers/students to a class

} as const;

export type PermissionCode = (typeof P)[keyof typeof P];

// Internal resolver - used only by usePermissions and PermissionGate.
export function resolvePermissionKey(code: PermissionCode): string {
  return REGISTRY[code] ?? "";
}
