import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import type { DashboardHandle } from "@/components/layout/dashboard-layout";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/lazy-root.tsx.
const Administrators = lazy(() => import("@/pages/protected/administrators"));

export const administratorRoutes = [
  {
    path: routesPath.PROTECTED.ADMINISTRATORS.INDEX,
    Component: Administrators,
    handle: { title: "Administrators" } satisfies DashboardHandle,
  },
] as RouteObject[];
