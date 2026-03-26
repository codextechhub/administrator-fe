import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import AcademicCalender from "@/pages/protected/academics";

export const academicRoutes = [
  {
    path: routesPath.PROTECTED.ACADEMIC_CAL.INDEX,
    Component: AcademicCalender,
  },
] as RouteObject[];
