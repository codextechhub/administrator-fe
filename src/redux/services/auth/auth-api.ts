import { resetAuth, setAuthUser, updatePermissions } from "@/redux/features/auth/auth-slice";
import { baseApi } from "../base-api";
import { routesPath } from "@/routes/routesPath";
import { recordActivity } from "@/utils/session-activity";
import { resetSessionInvalidation, setAuthCookies } from "@/utils/token-refresh";
import { endSession } from "@/utils/end-session";
import type { LoginResponse } from "./auth-types";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { email: string; password: string }>({
      query: (user) => ({
        url: `/user/auth/login/`,
        method: "POST",
        body: user,
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          const {data} = result;

          // Identity check: this portal is for school accounts only. A Codex
          // staff login succeeds at the backend (it's the shared endpoint),
          // but we refuse to open a session here — write NO cookies and NO
          // Redux state, and fire-and-forget a logout to blacklist the token
          // pair the backend just issued. The login page inspects the
          // fulfilled payload's user_type and renders the console-redirect
          // error.
          if (data?.data?.user?.user_type === "CX_STAFF") {
            const refresh = data?.data?.refresh;
            if (refresh) {
              fetch(`${baseUrl}/user/auth/logout/`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  accept: "application/json",
                  Authorization: `Bearer ${data?.data?.access}`,
                },
                body: JSON.stringify({ refresh }),
              }).catch(() => {
                // Best-effort revocation — the pair simply ages out if it fails.
              });
            }
            return;
          }

          // A fresh, valid session — re-enable token refresh in case a prior
          // session in this JS context invalidated it.
          resetSessionInvalidation();
          setAuthCookies(data?.data?.access || "", data?.data?.refresh || "");
          recordActivity();
          dispatch(setAuthUser(data?.data));
        } catch {
          // Login failed — the mutation hook surfaces the error to the page;
          // nothing to clean up because nothing was written yet.
        }
      },
    }),
    logout: builder.mutation({
      query: (token) => ({
        url: `/user/auth/logout/`,
        method: "POST",
         body: token,
        credentials: "include" as const
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          await queryFulfilled;
        } catch {
          // Server-side revocation failed — proceed with client-side cleanup anyway.
        } finally {
          endSession();
          dispatch(resetAuth());
          window.location.href = routesPath.AUTH.LOGIN;
        }
      },
    }),
    forgotPassword: builder.mutation<{ message: string }, { email: string }>({
      query: (payload) => ({
        url: `/user/auth/password/reset/request/`,
        method: "POST",
        body: payload,
      }),
    }),
    passwordResetPreview: builder.query<{ message: string; data: { email: string; full_name: string } }, string>({
      query: (activation_key) => ({
        url: `/user/auth/reset-password/${activation_key}/preview/`,
        method: "GET",
      }),
    }),
    passwordResetConfirm: builder.mutation<{ message: string }, { activation_key: string; password: string; confirm_password: string }>({
      query: ({ activation_key, ...body }) => ({
        url: `/user/auth/password/reset/${activation_key}/confirm/`,
        method: "POST",
        body,
      }),
    }),
    activationPreview: builder.query<{ message: string; data: { email: string; full_name: string } }, string>({
      query: (activation_key) => ({
        url: `/user/auth/activate/${activation_key}/preview/`,
        method: "GET",
      }),
    }),
    activateAccount: builder.mutation<{ message: string }, { activation_key: string; password: string; confirm_password: string }>({
      query: ({ activation_key, ...body }) => ({
        url: `/user/auth/activate/${activation_key}/`,
        method: "POST",
        body,
      }),
    }),
    getMe: builder.query<{ message: string; data: { user: unknown; permissions: string[] } }, void>({
      query: () => ({ url: `/user/auth/me/`, method: "GET" }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(updatePermissions(data.data.permissions));
        } catch {
          // /me failed (e.g. transient 5xx) — keep the persisted permissions;
          // the 401 interceptor handles a genuinely dead session.
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  usePasswordResetPreviewQuery,
  usePasswordResetConfirmMutation,
  useActivationPreviewQuery,
  useActivateAccountMutation,
  useGetMeQuery,
} = authApi;
