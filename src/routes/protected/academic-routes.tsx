import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import type { DashboardHandle } from "@/components/layout/dashboard-layout";

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
    handle: { title: "Academic Calender" } satisfies DashboardHandle,
  },
  {
    path: routesPath.PROTECTED.ACADEMIC.CALENDER_DETAILS,
    Component: CalenderDetails,
    // Detail screens kept their parent's title and only added a back button.
    handle: {
      title: "Academic Calender",
      hasBack: true,
    } satisfies DashboardHandle,
  },
  {
    path: routesPath.PROTECTED.ACADEMIC.SESSION,
    Component: AcademicSession,
    handle: { title: "Academic Session" } satisfies DashboardHandle,
  },
  {
    path: routesPath.PROTECTED.ACADEMIC.SESSION_DETAILS,
    Component: SessionDetails,
    handle: { title: "Session Details", hasBack: true } satisfies DashboardHandle,
  },
] as RouteObject[];
