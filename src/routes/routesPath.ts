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
