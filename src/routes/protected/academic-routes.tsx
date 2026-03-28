import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import AcademicCalender from "@/pages/protected/academics/calender";
import AcademicSession from "@/pages/protected/academics/session";
import SessionDetails from "@/pages/protected/academics/session/session-details";
import CalenderDetails from "@/pages/protected/academics/calender/calender-details";

export const academicRoutes = [
  {
    path: routesPath.PROTECTED.ACADEMIC.CALENDER,
    Component: AcademicCalender,
  },
  {
    path: routesPath.PROTECTED.ACADEMIC.CALENDER_DETAILS,
    Component: CalenderDetails,
  },
  {
    path: routesPath.PROTECTED.ACADEMIC.SESSION,
    Component: AcademicSession,
  },
  {
    path: routesPath.PROTECTED.ACADEMIC.SESSION_DETAILS,
    Component: SessionDetails,
  },
] as RouteObject[];
