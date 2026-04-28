import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import Classes from "@/pages/protected/classes";
import ClassDetails from "@/pages/protected/classes/class-details";

export const classesRoutes = [
  {
    path: routesPath.PROTECTED.CLASSES.INDEX,
    Component: Classes,
  },
  {
    path: routesPath.PROTECTED.CLASSES.CLASS_DETAILS,
    Component: ClassDetails,
  },
] as RouteObject[];
