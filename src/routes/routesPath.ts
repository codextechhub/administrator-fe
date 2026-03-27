export const routesPath = {
  AUTH: {
    LOGIN: "/login",
    SIGNUP: "/signup",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
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
      SESSION_DETAILS_ID: (id:string) => `/academic/session/${id}`,
      SESSION_DETAILS: "/academic/session/:id",
      CALENDER: "/academic/calender",
    },
    CLASSES: { INDEX: "/classes" },
    FEES: { INDEX: "/school-fees" },
    SETTINGS: { INDEX: "/settings" },
  },
};
