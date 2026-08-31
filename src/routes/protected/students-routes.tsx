import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import type { DashboardHandle } from "@/components/layout/dashboard-layout";

// Route-level code splitting: each page loads on first visit rather than
// shipping in the main bundle. The Suspense fallback lives in routes/lazy-root.
const StudentDirectory = lazy(() => import("@/pages/protected/students"));
const StudentProfile = lazy(() => import("@/pages/protected/students/profile"));
const EnrolStudent = lazy(() => import("@/pages/protected/students/enrol"));
const Guardians = lazy(() => import("@/pages/protected/students/guardians"));
const GuardianDetail = lazy(
  () => import("@/pages/protected/students/guardians/detail"),
);
const ClassesAndTransfers = lazy(
  () => import("@/pages/protected/students/classes"),
);
const Applicants = lazy(() => import("@/pages/protected/students/applicants"));

const S = routesPath.PROTECTED.STUDENTS;

// ─────────────────────────────────────────────────────────────────────────────
// Student Management.
//
// **No `pendingSurface`.** Absence means closed, and closed is right: the whole
// module answers 403 TENANT_NOT_LIVE to a school still onboarding, because
// enrolling a child and running a promotion are operations of a live school.
// The frontend mirrors the backend rather than guessing, so a pending school is
// redirected to the not-live screen by base-api instead of being shown an
// empty directory that looks broken.
//
// **`lenses: "branch"`.** These screens filter by branch and have no session
// dimension to move: a student's status, branch, guardians and documents are
// all current-state, and only the class placement is recorded per year. A
// session pill here would relabel the header and change nothing beneath it.
// See section 2.0 of docs/students-design-phases.md.
// ─────────────────────────────────────────────────────────────────────────────
export const studentsRoutes = [
  {
    path: S.INDEX,
    Component: StudentDirectory,
    handle: {
      title: "Student Directory",
      lens: true,
      lenses: "branch",
    } satisfies DashboardHandle,
  },
  {
    path: S.APPLICANTS,
    Component: Applicants,
    handle: {
      title: "Applicants",
      hasBack: true,
      lens: true,
      lenses: "branch",
    } satisfies DashboardHandle,
  },
  {
    path: S.ENROL,
    Component: EnrolStudent,
    handle: {
      title: "Enrol a student",
      hasBack: true,
      lens: true,
      lenses: "branch",
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
      lenses: "branch",
    } satisfies DashboardHandle,
  },
  {
    path: S.ASSIGN,
    Component: ClassesAndTransfers,
    handle: {
      title: "Classes & Transfers",
      lens: true,
      lenses: "branch",
    } satisfies DashboardHandle,
  },
  {
    path: S.GUARDIANS,
    Component: Guardians,
    handle: {
      title: "Guardians",
      lens: true,
      lenses: "branch",
    } satisfies DashboardHandle,
  },
  {
    path: S.GUARDIAN_DETAILS,
    Component: GuardianDetail,
    handle: {
      title: "Guardian",
      hasBack: true,
      lens: true,
      lenses: "branch",
    } satisfies DashboardHandle,
  },
] as RouteObject[];
