import { type RouteObject } from "react-router";
import { overviewRoutes } from "./overview-routes";
import { branchesRoutes } from "./branches-routes";
import { studentsRoutes } from "./students-routes";
import { teachersRoutes } from "./teachers-routes";
import { administratorRoutes } from "./administrator-routes";
import { academicRoutes } from "./academic-routes";
import { classesRoutes } from "./classes-routes";

export const protectedRoutes = [
  ...overviewRoutes,
  ...branchesRoutes,
  ...studentsRoutes,
  ...teachersRoutes,
  ...administratorRoutes,
  ...academicRoutes,
  ...classesRoutes,
] as RouteObject[];
