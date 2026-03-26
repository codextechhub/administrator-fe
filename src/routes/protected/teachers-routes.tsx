import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import Teachers from "@/pages/protected/teachers";

export const teachersRoutes = [
  { path: routesPath.PROTECTED.TEACHERS.INDEX, Component: Teachers },
] as RouteObject[];
