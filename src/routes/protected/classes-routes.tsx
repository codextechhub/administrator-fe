import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import Classes from "@/pages/protected/classes";

export const classesRoutes = [
  {
    path: routesPath.PROTECTED.CLASSES.INDEX,
    Component: Classes,
  },
] as RouteObject[];
