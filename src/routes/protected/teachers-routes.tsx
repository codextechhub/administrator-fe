import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/lazy-root.tsx.
const Teachers = lazy(() => import("@/pages/protected/teachers"));

export const teachersRoutes = [
  { path: routesPath.PROTECTED.TEACHERS.INDEX, Component: Teachers },
] as RouteObject[];
