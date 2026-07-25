import { createBrowserRouter } from "react-router";
import { authRoutes } from "./auth";
import { protectedRoutes } from "./protected";
import LazyRoot from "./lazy-root";
import NotFound from "@/pages/not-found";
import RouteError from "@/pages/route-error";
import Authenticated from "@/middleware/authenticated";

export const router = createBrowserRouter([
  {
    Component: LazyRoot,
    // ErrorBoundary catches uncaught render/loader errors (including chunk
    // load failures) so users see a recoverable screen instead of
    // react-router's default stack trace.
    ErrorBoundary: RouteError,
    children: [
      ...authRoutes,
      { element: <Authenticated />, children: protectedRoutes },
      { path: "*", Component: NotFound },
    ],
  },
]);
