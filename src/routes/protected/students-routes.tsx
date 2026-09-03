import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import type { DashboardHandle } from "@/components/layout/dashboard-layout";

// Route-level code splitting: each page loads on first visit rather than
// shipping in the main bundle. The Suspense fallback lives in routes/lazy-root.
const StudentDirectory = lazy(() => import("@/pages/protected/students"));
const StudentProfile = lazy(() => import("@/pages/protected/students/profile"));
const EnrolStudent = lazy(() => import("@/pages/protected/students/enrol"));
const Promotion = lazy(() => import("@/pages/protected/students/promotion"));
const Guardians = lazy(() => import("@/pages/protected/students/guardians"));
const GuardianDetail = lazy(
  () => import("@/pages/protected/students/guardians/detail"),
);
const ClassesAndTransfers = lazy(
  () => import("@/pages/protected/students/classes"),
);
const Applicants = lazy(() => import("@/pages/protected/students/applicants"));

const S = routesPath.PROTECTED.STUDENTS;

/**
 * Student Management.
 *
 * **No `pendingSurface`.** Absence means closed, and closed is right: the whole
 * module answers 403 TENANT_NOT_LIVE to a school still onboarding, because
 * enrolling a child and running a promotion are operations of a live school.
 * The frontend mirrors the backend rather than guessing, so a pending school is
 * redirected to the not-live screen by base-api instead of being shown an
 * empty directory that looks broken.
 *
 * **Both lenses.** The roll and the class are per-year - a school had 85
 * students in 2026/2027 and has 73 in 2027/2028, and a child in SSS1 A last
 * year is in SSS2 A this one - so the year filters as much as the branch does.
 * Status carries no year, and the screens say so where it shows.
 */
export const studentsRoutes = [
  {
    path: S.INDEX,
    Component: StudentDirectory,
    handle: {
      title: "Student Directory",
      lens: true,
    } satisfies DashboardHandle,
  },
  {
    path: S.APPLICANTS,
    Component: Applicants,
    handle: {
      title: "Applicants",
      hasBack: true,
      lens: true,
    } satisfies DashboardHandle,
  },
  {
    path: S.ENROL,
    Component: EnrolStudent,
    handle: {
      title: "Enrol a student",
      hasBack: true,
      lens: true,
    } satisfies DashboardHandle,
  },
  {
    // Ranked routing puts the static children of /students above this, so
    // /students/applicants can never be read as a student called "applicants".
    path: S.PROFILE,
    Component: StudentProfile,
    handle: {
      title: "Student Profile",
      hasBack: true,
      lens: true,
    } satisfies DashboardHandle,
  },
  {
    path: S.ASSIGN,
    Component: ClassesAndTransfers,
    handle: {
      title: "Classes & Transfers",
      lens: true,
    } satisfies DashboardHandle,
  },
  {
    path: S.GUARDIANS,
    Component: Guardians,
    handle: {
      title: "Guardians",
      lens: true,
    } satisfies DashboardHandle,
  },
  {
    path: S.GUARDIAN_DETAILS,
    Component: GuardianDetail,
    handle: {
      title: "Guardian",
      hasBack: true,
      lens: true,
    } satisfies DashboardHandle,
  },
  {
    path: S.PROMOTION,
    Component: Promotion,
    handle: {
      title: "Promotion",
      lens: true,
    } satisfies DashboardHandle,
  },
] as RouteObject[];
