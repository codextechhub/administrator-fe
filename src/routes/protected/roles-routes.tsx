import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import type { DashboardHandle } from "@/components/layout/dashboard-layout";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/lazy-root.tsx.
const Roles = lazy(() => import("@/pages/protected/roles"));
const RoleChangeRequests = lazy(() => import("@/pages/protected/roles/change-requests"));

export const rolesRoutes = [
  {
    path: routesPath.PROTECTED.ROLES.INDEX,
    Component: Roles,
    handle: { title: "Roles & Permissions" } satisfies DashboardHandle,
  },
  {
    path: routesPath.PROTECTED.ROLES.CHANGE_REQUESTS,
    Component: RoleChangeRequests,
    handle: { title: "Role Change Requests", hasBack: true } satisfies DashboardHandle,
  },
] as RouteObject[];
