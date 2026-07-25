import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import type { DashboardHandle } from "@/components/layout/dashboard-layout";

// Route-level code splitting: each area page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/lazy-root.tsx.
const Classes = lazy(() => import("@/pages/protected/classes"));
const ClassDetails = lazy(() => import("@/pages/protected/classes/class-details"));

export const classesRoutes = [
  {
    path: routesPath.PROTECTED.CLASSES.INDEX,
    Component: Classes,
    handle: { title: "Classes" } satisfies DashboardHandle,
  },
  {
    path: routesPath.PROTECTED.CLASSES.CLASS_DETAILS,
    Component: ClassDetails,
    handle: { title: "Class Details", hasBack: true } satisfies DashboardHandle,
  },
] as RouteObject[];
