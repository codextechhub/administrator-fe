import { createBrowserRouter } from "react-router";
import { authRoutes } from "./auth";
import { protectedRoutes } from "./protected";
import NotFound from "@/pages/not-found";
import Authenticated from "@/middleware/authenticated";

export const router = createBrowserRouter([
  ...authRoutes,
  { element: <Authenticated />, children: protectedRoutes },
  { path: "*", Component: NotFound },
]);
