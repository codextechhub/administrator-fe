import { baseApi } from "../base-api";
import type {
  PaginatedResponse,
  ProxySession,
  ProxyTarget,
} from "./impersonation-types";

// ─────────────────────────────────────────────────────────────────────────────
// Proxy ("impersonation") session management.
//
// Every endpoint here is authorised as the ORIGINAL signed-in admin, never as
// the proxied target — `api-endpoints.ts` keeps them out of the
// X-Impersonation-Session header path, which is what prevents proxy chaining.
//
// Scope is the caller's OWN school: the backend pins the target pool to the
// actor's tenant, so `?tenant=` (injected centrally) can never widen it.
// ─────────────────────────────────────────────────────────────────────────────
export const impersonationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Search active users in this school. The backend rejects queries shorter
    // than 2 characters, so callers must `skip` until then.
    getProxyTargets: builder.query<
      PaginatedResponse<ProxyTarget>,
      { search: string; page?: number; page_size?: number }
    >({
      query: (params) => ({
        url: `/admin/impersonations/targets/`,
        method: "GET",
        params,
      }),
    }),

    startProxySession: builder.mutation<
      { message: string; data: ProxySession },
      { target_user: number }
    >({
      query: (body) => ({
        url: `/admin/impersonations/start/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProxySessions"],
    }),

    endProxySession: builder.mutation<
      { message: string; data: ProxySession },
      { session_id: number }
    >({
      query: (body) => ({
        url: `/admin/impersonations/end/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProxySessions"],
    }),

    // The audit read surface for past sessions (requires
    // school.impersonation.view). No screen consumes this yet — it exists so the
    // trail is one hook away when the school audit view lands.
    getProxySessions: builder.query<
      PaginatedResponse<ProxySession>,
      { status?: string; page?: number; page_size?: number } | void
    >({
      query: (params) => ({
        url: `/admin/impersonations/`,
        method: "GET",
        params: (params ?? {}) as Record<string, string | number>,
      }),
      providesTags: ["ProxySessions"],
    }),
  }),
});

export const {
  useGetProxyTargetsQuery,
  useStartProxySessionMutation,
  useEndProxySessionMutation,
  useGetProxySessionsQuery,
} = impersonationApi;
