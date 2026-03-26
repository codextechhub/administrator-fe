import { createBrowserRouter } from "react-router";
import { authRoutes } from "./auth";
import { protectedRoutes } from "./protected";
import NotFound from "@/pages/not-found";

export const router = createBrowserRouter([
  ...authRoutes,
  ...protectedRoutes,
  { path: "*", Component: NotFound },
]);
