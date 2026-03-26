import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import Branches from "@/pages/protected/branches";

export const branchesRoutes = [
  { path: routesPath.PROTECTED.BRANCHES.INDEX, Component: Branches },
] as RouteObject[];
