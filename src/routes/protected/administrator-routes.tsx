import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/lazy-root.tsx.
const Administrators = lazy(() => import("@/pages/protected/administrators"));

export const administratorRoutes = [
  {
    path: routesPath.PROTECTED.ADMINISTRATORS.INDEX,
    Component: Administrators,
  },
] as RouteObject[];
