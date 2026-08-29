export const routesPath = {
  AUTH: {
    ACCOUNTS: "/accounts",
    LOGIN: "/accounts",
    FORGOT_PASSWORD: "/accounts/forgot-password",
    RESET_PASSWORD: "/accounts/reset-password/:activation_key",
    RESET_PASSWORD_ID: (activation_key: string) =>
      `/accounts/reset-password/${activation_key}`,
    ACTIVATE: "/accounts/activate/:activation_key",
    ACTIVATE_ID: (activation_key: string) =>
      `/accounts/activate/${activation_key}`,
  },
  PROTECTED: {
    OVERVIEW: { INDEX: "/overview" },
    // The onboarding surface. Reachable before the school goes live, and the
    // only part of the app that is - everything below answers 403 TENANT_NOT_LIVE
    // to a school that is still being set up.
    ONBOARDING: {
      INDEX: "/onboarding",
      WELCOME: "/onboarding/welcome",
      PROFILE: "/onboarding/profile",
      // One screen, two tabs. The checklist opens it from two different cards,
      // so the tab is in the URL rather than in component state.
      ROLES: "/onboarding/roles",
      STAFF: "/onboarding/roles?tab=invitations",
      IMPORT: "/onboarding/import",
      // Its own screen, as the design draws it: deciding between fixing rows
      // and proceeding with warnings needs the rows on the page.
      IMPORT_VALIDATION: (batchId: number | string) =>
        `/onboarding/import/${batchId}/validation`,
      GO_LIVE: "/onboarding/go-live",
      // Where every TENANT_NOT_LIVE refusal lands, whichever closed surface
      // produced it. See the 403 branch in redux/services/base-api.ts.
      NOT_LIVE: "/onboarding/not-live",
    },
    // The notification centre. Open during onboarding, which is when a school
    // gets most of its post.
    NOTIFICATIONS: "/notifications",
    BRANCHES: { INDEX: "/branches" },
    // Academic Structure. One module, one URL prefix: the overview and every
    // screen that hangs off it. Sessions and classes moved under here from
    // /academic/session and /classes when the module was reorganised - they are
    // parts of the structure, not siblings of it.
    ACADEMIC_STRUCTURE: {
      INDEX: "/academic-structure",
      SESSIONS: "/academic-structure/sessions",
      SESSION_DETAILS: "/academic-structure/sessions/:id",
      SESSION_DETAILS_ID: (id: string | number) =>
        `/academic-structure/sessions/${id}`,
      DEPARTMENTS: "/academic-structure/departments",
      PROGRAMS: "/academic-structure/programs",
      CLASSES: "/academic-structure/classes",
      CLASS_DETAILS: "/academic-structure/classes/:id",
      CLASS_DETAILS_ID: (id: string | number) =>
        `/academic-structure/classes/${id}`,
      SUBJECTS: "/academic-structure/subjects",
      ASSIGNMENTS: "/academic-structure/assignments",
    },
    // The academic calendar is its OWN module now, not a child of academic
    // management. Spelled correctly here; the old /academic/calender paths
    // redirect.
    //
    // The design splits what used to be one item into two sibling modules, and
    // the split is not cosmetic: the calendar is what a school DATES, and the
    // timetables are what runs inside those dates. They are gated on different
    // backend keys (`academics.calendar.*` and `academics.timetable.*`), so a
    // teacher who may read the holiday list may hold neither, either, or both.
    //
    // `INDEX` is the hub, which covers both modules - its own "Go to" list
    // names all seven screens - and lives here because that is where the design
    // puts it.
    ACADEMIC_CALENDAR: {
      INDEX: "/academic-calendar",
      EVENTS: "/academic-calendar/events",
      TERM_VIEW: "/academic-calendar/term-view",
    },
    // The timetable half. A separate prefix rather than more children of
    // /academic-calendar, because a school reaching Rooms is not reaching the
    // calendar and should not have to hold a calendar key to get there.
    TIMETABLES: {
      ROOMS: "/timetables/rooms",
      BELL_SCHEDULE: "/timetables/bell-schedule",
      CLASSES: "/timetables/classes",
      TEACHERS: "/timetables/teachers",
      EXAMS: "/timetables/exams",
    },
  },
};
