import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import type { DashboardHandle } from "@/components/layout/dashboard-layout";

// Route-level code splitting: the desk loads on first visit rather than
// shipping in the main bundle.
const SupportDesk = lazy(() => import("@/pages/protected/support"));
const SupportTicketDetail = lazy(() => import("@/pages/protected/support/detail"));

const S = routesPath.PROTECTED.SUPPORT;

// The school's own support desk.
//
// `pendingSurface` on both, and it is the point rather than a convenience. A
// school still being set up is exactly when it needs to be able to ask for
// help, and the header's headset has always been able to file a ticket from
// anywhere - including before go-live. Without it a school could raise a ticket
// and then have nowhere to read the answer.
export const supportRoutes = [
  {
    path: S.INDEX,
    Component: SupportDesk,
    handle: { title: "Support", pendingSurface: true } satisfies DashboardHandle,
  },
  {
    path: S.DETAIL,
    Component: SupportTicketDetail,
    handle: {
      title: "Support",
      hasBack: true,
      pendingSurface: true,
    } satisfies DashboardHandle,
  },
] as RouteObject[];
