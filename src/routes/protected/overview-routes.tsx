import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import Dashboard from "@/pages/protected/dashboard";

export const overviewRoutes = [
  { path: routesPath.PROTECTED.OVERVIEW.INDEX, Component: Dashboard },
] as RouteObject[];
