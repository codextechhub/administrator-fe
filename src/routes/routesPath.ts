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
      HELP: "/onboarding/help",
      // Where every TENANT_NOT_LIVE refusal lands, whichever closed surface
      // produced it. See the 403 branch in redux/services/base-api.ts.
      NOT_LIVE: "/onboarding/not-live",
    },
    // The notification centre. Open during onboarding, which is when a school
    // gets most of its post.
    NOTIFICATIONS: "/notifications",
    BRANCHES: { INDEX: "/branches" },
    STUDENTS: { INDEX: "/students" },
    TEACHERS: { INDEX: "/teachers" },
    ADMINISTRATORS: { INDEX: "/administrators" },
    ACADEMIC: {
      INDEX: "/academic",
      SESSION: "/academic/session",
      SESSION_DETAILS_ID: (id: string) => `/academic/session/${id}`,
      SESSION_DETAILS: "/academic/session/:id",
      CALENDER: "/academic/calender",
      CALENDER_DETAILS_ID: (id: string) => `/academic/calender/${id}`,
      CALENDER_DETAILS: "/academic/calender/:id",
    },
    CLASSES: {
      INDEX: "/classes",
      CLASS_DETAILS_ID: (id: string) => `/classes/${id}`,
      CLASS_DETAILS: "/classes/:id",
    },
    FEES: { INDEX: "/school-fees" },
    SETTINGS: { INDEX: "/settings" },
  },
};
