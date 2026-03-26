import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import Students from "@/pages/protected/students";

export const studentsRoutes = [
  { path: routesPath.PROTECTED.STUDENTS.INDEX, Component: Students },
] as RouteObject[];
