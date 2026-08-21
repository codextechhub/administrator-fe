import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import type { DashboardHandle } from "@/components/layout/dashboard-layout";

// Route-level code splitting, as everywhere else. `onboarding: true` on each
// handle is what puts the shell into its pre-go-live shape: reduced sidebar,
// status strip, no branch switcher.
const OnboardingWelcome = lazy(
  () => import("@/pages/protected/onboarding/welcome"),
);
const OnboardingControlRoom = lazy(
  () => import("@/pages/protected/onboarding"),
);
const SchoolProfile = lazy(
  () => import("@/pages/protected/onboarding/school-profile"),
);
const GoLive = lazy(() => import("@/pages/protected/onboarding/go-live"));
const OnboardingHelp = lazy(() => import("@/pages/protected/onboarding/help"));
const OnboardingNotLive = lazy(
  () => import("@/pages/protected/onboarding/not-live"),
);

const handle = (title: string, hasBack = false): DashboardHandle => ({
  title,
  hasBack,
  onboarding: true,
});

export const onboardingRoutes = [
  {
    path: routesPath.PROTECTED.ONBOARDING.WELCOME,
    Component: OnboardingWelcome,
    handle: handle("Welcome"),
  },
  {
    path: routesPath.PROTECTED.ONBOARDING.INDEX,
    Component: OnboardingControlRoom,
    handle: handle("Onboarding"),
  },
  {
    path: routesPath.PROTECTED.ONBOARDING.PROFILE,
    Component: SchoolProfile,
    handle: handle("School Profile", true),
  },
  {
    path: routesPath.PROTECTED.ONBOARDING.GO_LIVE,
    Component: GoLive,
    handle: handle("Go-Live", true),
  },
  {
    path: routesPath.PROTECTED.ONBOARDING.HELP,
    Component: OnboardingHelp,
    handle: handle("Get Help", true),
  },
  {
    path: routesPath.PROTECTED.ONBOARDING.NOT_LIVE,
    Component: OnboardingNotLive,
    handle: handle("Not available yet"),
  },
] as RouteObject[];
