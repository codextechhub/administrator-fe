import { Navigate, type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import AuthLayout from "@/components/layout/auth-layout";
import Guest from "@/middleware/guest";
import Login from "@/pages/auth/login";
import ResetPassword from "@/pages/auth/reset-password";
import ForgotPassword from "@/pages/auth/forgot-password";
import ActivateAccount from "@/pages/auth/activate";

export const authRoutes = [
  {
    path: routesPath.AUTH.ACCOUNTS,
    Component: AuthLayout,
    children: [
      // Sign-in page: an already-authenticated user is bounced to the app, so
      // /accounts can't be reopened (e.g. via Back) once signed in.
      {
        Component: Guest,
        children: [{ index: true, Component: Login }],
      },
      // Email-link / out-of-band flows stay reachable even with a live session.
      { path: "forgot-password", Component: ForgotPassword },
      { path: "reset-password/:activation_key", Component: ResetPassword },
      { path: "activate/:activation_key", Component: ActivateAccount },
    ],
  },
  // Legacy /login → /accounts, and bare "/" → /accounts.
  { path: "/login", element: <Navigate to={routesPath.AUTH.ACCOUNTS} replace /> },
  { path: "/", element: <Navigate to={routesPath.AUTH.ACCOUNTS} replace /> },
] as RouteObject[];
