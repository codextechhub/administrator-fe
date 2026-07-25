import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/lazy-root.tsx.
const Dashboard = lazy(() => import("@/pages/protected/dashboard"));

export const overviewRoutes = [
  { path: routesPath.PROTECTED.OVERVIEW.INDEX, Component: Dashboard },
] as RouteObject[];
