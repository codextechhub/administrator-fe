import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import Administrators from "@/pages/protected/administrators";

export const administratorRoutes = [
  {
    path: routesPath.PROTECTED.ADMINISTRATORS.INDEX,
    Component: Administrators,
  },
] as RouteObject[];
