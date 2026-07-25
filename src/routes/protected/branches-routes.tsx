import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/lazy-root.tsx.
const Branches = lazy(() => import("@/pages/protected/branches"));

export const branchesRoutes = [
  { path: routesPath.PROTECTED.BRANCHES.INDEX, Component: Branches },
] as RouteObject[];
