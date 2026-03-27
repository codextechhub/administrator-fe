import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import AcademicCalender from "@/pages/protected/academics/calender";
import AcademicSession from "@/pages/protected/academics/session";

export const academicRoutes = [
  {
    path: routesPath.PROTECTED.ACADEMIC.CALENDER,
    Component: AcademicCalender,
  },
  {
    path: routesPath.PROTECTED.ACADEMIC.SESSION,
    Component: AcademicSession,
  },
] as RouteObject[];
