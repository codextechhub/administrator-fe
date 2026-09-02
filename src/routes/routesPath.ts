export const routesPath = {
  // Reachable with no session and no account at all. Not AUTH: nobody here is
  // signing in, and there is nothing to sign in to. The signed token in the
  // path is the caller's whole authority, so these paths must stay outside
  // both the Guest gate and the Authenticated one.
  PUBLIC: {
    PAY_INVOICE: "/pay/:token",
    PAY_INVOICE_ID: (token: string) => `/pay/${token}`,
    // Where the payment provider returns a payer once they are done. The
    // backend sends this address to the provider, so the two must agree.
    PAYMENT_RETURN: "/payments/return",
  },
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

    // ------------------------------------------------------------------
    // @xvs/finance route contract.
    //
    // The shared finance and procurement package reads these constants to
    // build its own navigation, so they are part of the host contract rather
    // than this app's own routing taste. The paths mirror the console's so a
    // deep link means the same thing in both products.
    //
    // Declaring a constant does NOT mount a screen: these become reachable
    // only once the package's pages are added to the router.
    // ------------------------------------------------------------------
    FINANCE: {
      INDEX: "/finance",
      SETUP: "/finance/setup",
      LEDGER: "/finance/ledger",
      RECEIVABLES: "/finance/receivables",
      RECEIPTS_ALLOCATION: "/finance/receipts-allocation",
      RECORD_PAYMENT: "/finance/receipts-allocation?action=new",
      COLLECTIONS: "/finance/collections",
      PAYMENTS: "/finance/payments",
      BANKING: "/finance/banking",
      BANK_RECON: "/finance/bank-reconciliation",
      EXPENSES: "/finance/expenses",
      PAYROLL: "/finance/payroll",
      BUDGETS: "/finance/budgets",
      REPORTS: "/finance/reports",
      AUDIT: "/finance/audit",
      SETTINGS: "/finance/settings",
    },
    PROCUREMENT: {
      INDEX: "/procurement",
      VENDORS: "/procurement/vendors",
      REQUISITIONS: "/procurement/requisitions",
      PURCHASE_ORDERS: "/procurement/purchase-orders",
      GOODS_RECEIPTS: "/procurement/goods-receipts",
      VENDOR_INVOICES: "/procurement/vendor-invoices",
      VENDOR_PAYMENTS: "/procurement/vendor-payments",
      APPROVALS: "/procurement/approvals",
      SOURCING: "/procurement/sourcing",
      CONTRACTS: "/procurement/contracts",
      INVENTORY: "/procurement/inventory",
      ANALYTICS: "/procurement/analytics",
      SETTINGS: "/procurement/settings",
    },
    WORKFLOW: {
      TEMPLATES: "/workflow/templates",
      INSTANCE_DETAIL_PATH: "/workflow/instances/:id",
      INSTANCE_DETAIL: (id: string) => `/workflow/instances/${id}`,
    },
    AUDIT: { EVENTS: "/audit/events" },
    EXPORT: {
      QUEUES: "/export/queues",
      FILES: "/export/files",
      RUN_PATH: "/export/runs/:id",
      RUN: (id: string | number) => `/export/runs/${id}`,
      SAVED: "/export/saved",
      NEW: "/export/new",
      EDIT_PATH: "/export/:id/edit",
      EDIT: (id: string | number) => `/export/${id}/edit`,
    },
    DATA_IMPORTS: {
      BATCHES: {
        VIEW: (id: string) => `/data-imports/batches/${id}/view`,
      },
    },
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
    // Student Management. One prefix for the whole module: the directory is
    // its front door and everything else hangs off it, the way Academic
    // Structure is organised.
    //
    // The profile is a route rather than a drawer because it is a page in its
    // own right - six tabs, its own actions - and because a registrar sends
    // a colleague a link to a child's record.
    STUDENTS: {
      INDEX: "/students",
      PROFILE: "/students/:id",
      PROFILE_ID: (id: string | number) => `/students/${id}`,
      APPLICANTS: "/students/applicants",
      GUARDIANS: "/students/guardians",
      GUARDIAN_DETAILS: "/students/guardians/:id",
      GUARDIAN_DETAILS_ID: (id: string | number) => `/students/guardians/${id}`,
      ENROL: "/students/enrol",
      ASSIGN: "/students/classes",
      PROMOTION: "/students/promotion",
      IMPORT: "/students/import",
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
