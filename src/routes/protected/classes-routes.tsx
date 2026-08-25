import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import type { DashboardHandle } from "@/components/layout/dashboard-layout";
import { redirects } from "./academic-routes";

// Route-level code splitting: each area page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/lazy-root.tsx.
const Classes = lazy(() => import("@/pages/protected/classes"));
const ClassDetails = lazy(() => import("@/pages/protected/classes/class-details"));

const S = routesPath.PROTECTED.ACADEMIC_STRUCTURE;

// Classes live UNDER Academic Structure now. They are part of the structure -
// a class is a level plus an arm - not a sibling module of it.
export const classesRoutes = [
  {
    path: S.CLASSES,
    Component: Classes,
    handle: { title: "Classes & Arms", lens: true, pendingSurface: true } satisfies DashboardHandle,
  },
  {
    path: S.CLASS_DETAILS,
    Component: ClassDetails,
    handle: {
      title: "Classes & Arms",
      hasBack: true,
      lens: true,
      pendingSurface: true,
    } satisfies DashboardHandle,
  },
  // See academic-routes' `redirects` for why a redirect declares this.
  ...redirects([["/classes", S.CLASSES]]),
] as RouteObject[];
