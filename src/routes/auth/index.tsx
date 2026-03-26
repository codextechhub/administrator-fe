import { Navigate, type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import AuthLayout from "@/components/layout/auth-layout";
import Login from "@/pages/auth/login";
import SignUp from "@/pages/auth/signup";
import ResetPassword from "@/pages/auth/reset-password";
import ForgotPassword from "@/pages/auth/forgot-password";

export const authRoutes = [
  {
    Component: AuthLayout,
    children: [
      { index: true, element: <Navigate to={routesPath.AUTH.LOGIN} /> },
      { path: routesPath.AUTH.LOGIN, Component: Login },
      { path: routesPath.AUTH.SIGNUP, Component: SignUp },
      { path: routesPath.AUTH.FORGOT_PASSWORD, Component: ForgotPassword },
      { path: routesPath.AUTH.RESET_PASSWORD, Component: ResetPassword },
    ],
  },
] as RouteObject[];
