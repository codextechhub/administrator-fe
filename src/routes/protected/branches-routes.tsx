import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import type { DashboardHandle } from "@/components/layout/dashboard-layout";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/lazy-root.tsx.
const Branches = lazy(() => import("@/pages/protected/branches"));

export const branchesRoutes = [
  {
    path: routesPath.PROTECTED.BRANCHES.INDEX,
    Component: Branches,
    handle: { title: "Branches" } satisfies DashboardHandle,
  },
] as RouteObject[];
