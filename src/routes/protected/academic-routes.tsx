import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import type { DashboardHandle } from "@/components/layout/dashboard-layout";

// Route-level code splitting: each area page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/lazy-root.tsx.
const AcademicStructureOverview = lazy(
  () => import("@/pages/protected/academics/structure"),
);
const AcademicSession = lazy(() => import("@/pages/protected/academics/session"));
const SessionDetails = lazy(
  () => import("@/pages/protected/academics/session/session-details"),
);
const Departments = lazy(() => import("@/pages/protected/academics/departments"));
const Programs = lazy(() => import("@/pages/protected/academics/programs"));
const Subjects = lazy(() => import("@/pages/protected/academics/subjects"));
const Assignments = lazy(() => import("@/pages/protected/academics/assignments"));
const AcademicCalendar = lazy(() => import("@/pages/protected/academics/calender"));
const CalendarDetails = lazy(
  () => import("@/pages/protected/academics/calender/calender-details"),
);

const S = routesPath.PROTECTED.ACADEMIC_STRUCTURE;
const C = routesPath.PROTECTED.ACADEMIC_CALENDAR;

/** Old paths that now point somewhere else. See the note beside the list. */
export function redirects(pairs: [from: string, to: string][]): RouteObject[] {
  return pairs.map(([from, to]) => ({
    path: from,
    element: <Navigate to={to} replace />,
    handle: { pendingSurface: true } satisfies DashboardHandle,
  }));
}

// `lens: true` puts the branch and session pills in the header. Only the
// Academic Structure screens read those lenses, so only they ask for them - a
// session pill over the student roster would be a filter that does nothing.
export const academicRoutes = [
  {
    path: S.INDEX,
    Component: AcademicStructureOverview,
    handle: { title: "Academic Structure", lens: true, pendingSurface: true } satisfies DashboardHandle,
  },
  {
    path: S.SESSIONS,
    Component: AcademicSession,
    handle: { title: "Sessions & Terms", lens: true, pendingSurface: true } satisfies DashboardHandle,
  },
  {
    path: S.SESSION_DETAILS,
    // Detail screens keep their parent's title and only add a back button.
    Component: SessionDetails,
    handle: {
      title: "Sessions & Terms",
      hasBack: true,
      lens: true,
      pendingSurface: true,
    } satisfies DashboardHandle,
  },

  {
    path: S.DEPARTMENTS,
    Component: Departments,
    handle: {
      title: "Departments",
      lens: true,
      pendingSurface: true,
    } satisfies DashboardHandle,
  },

  {
    path: S.PROGRAMS,
    Component: Programs,
    handle: {
      title: "Programmes & Levels",
      lens: true,
      pendingSurface: true,
    } satisfies DashboardHandle,
  },

  {
    path: S.SUBJECTS,
    Component: Subjects,
    handle: {
      title: "Subjects",
      lens: true,
      pendingSurface: true,
    } satisfies DashboardHandle,
  },

  {
    path: S.ASSIGNMENTS,
    Component: Assignments,
    handle: {
      title: "Assignments",
      lens: true,
      pendingSurface: true,
    } satisfies DashboardHandle,
  },

  // The academic calendar is its own module now, not a child of academics
  // management. Its screens are unchanged pending their own design pass, so no
  // lens: nothing on them reads one yet.
  {
    path: C.INDEX,
    Component: AcademicCalendar,
    handle: { title: "Academic Calendar" } satisfies DashboardHandle,
  },
  {
    path: C.DETAILS,
    Component: CalendarDetails,
    handle: { title: "Academic Calendar", hasBack: true } satisfies DashboardHandle,
  },

  // The module moved. Anything bookmarked at the old paths lands where the
  // screen actually lives rather than on a blank route.
  //
  // `pendingSurface` on a REDIRECT is not a permission decision - it is what
  // stops the layout answering first. The closed-school notice renders above the
  // outlet, so without this a pending school following an old bookmark gets
  // "this part of XVS opens when your school goes live" and the redirect never
  // runs. A redirect shows nothing and grants nothing; whatever it lands on
  // makes its own decision.
  ...redirects([
    ["/academic", S.INDEX],
    ["/academic/session", S.SESSIONS],
    ["/academic/calender", C.INDEX],
  ]),
] as RouteObject[];
