import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/lazy-root.tsx.
const Students = lazy(() => import("@/pages/protected/students"));

export const studentsRoutes = [
  { path: routesPath.PROTECTED.STUDENTS.INDEX, Component: Students },
] as RouteObject[];
