import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";

// Route-level code splitting: each area page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/lazy-root.tsx.
const AcademicCalender = lazy(() => import("@/pages/protected/academics/calender"));
const CalenderDetails = lazy(
  () => import("@/pages/protected/academics/calender/calender-details"),
);
const AcademicSession = lazy(() => import("@/pages/protected/academics/session"));
const SessionDetails = lazy(
  () => import("@/pages/protected/academics/session/session-details"),
);

export const academicRoutes = [
  {
    path: routesPath.PROTECTED.ACADEMIC.CALENDER,
    Component: AcademicCalender,
  },
  {
    path: routesPath.PROTECTED.ACADEMIC.CALENDER_DETAILS,
    Component: CalenderDetails,
  },
  {
    path: routesPath.PROTECTED.ACADEMIC.SESSION,
    Component: AcademicSession,
  },
  {
    path: routesPath.PROTECTED.ACADEMIC.SESSION_DETAILS,
    Component: SessionDetails,
  },
] as RouteObject[];
