import { baseApi } from "../base-api";
import type { Envelope, PaginatedEnvelope } from "../onboarding/onboarding-types";
import { getTenantSlug } from "@/utils/tenant-context";
import type {
  CatalogueModule,
  NewRole,
  SchoolRole,
  SchoolRoleDetail,
} from "./roles-types";

// ─────────────────────────────────────────────────────────────────────────────
// The school's own roles, at /v1/rbac/tenants/<slug>/…
//
// Unlike the profile and staff surfaces, these endpoints DO carry the school in
// the path. That is the platform's existing shape, not a choice made here, and
// it is not a hole: the view refuses any slug that is not the one the session
// asserts, with a 404 rather than a 403 so slugs cannot be probed. The slug is
// read from the same store the base query reads it from, so the path and the
// ?tenant= assertion can never disagree.
//
// All of it is open to a school that has not gone live except DELETE, which
// stays closed - onboarding asks a school to confirm and extend the baseline,
// not to dismantle it.
// ─────────────────────────────────────────────────────────────────────────────
const scope = () => `/rbac/tenants/${getTenantSlug()}`;

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSchoolRoles: builder.query<PaginatedEnvelope<SchoolRole>, void>({
      query: () => ({ url: `${scope()}/roles/`, method: "GET" }),
      extraOptions: { silent: true },
      providesTags: ["Roles"],
    }),

    /** One role, with every permission it holds. Backs the preview drawer. */
    getSchoolRole: builder.query<Envelope<SchoolRoleDetail>, string>({
      query: (key) => ({ url: `${scope()}/roles/${key}/`, method: "GET" }),
      extraOptions: { silent: true },
      providesTags: (_result, _error, key) => [{ type: "Roles", id: key }],
    }),

    /**
     * Everything this school is allowed to grant, grouped by module.
     *
     * Not the global registry: that one is CodeX's and carries keys no school
     * may ever hold. This is the short list, filtered by the same scope column
     * the save is checked against, so the drawer cannot offer a box that
     * ticking would fail.
     */
    getPermissionCatalogue: builder.query<Envelope<CatalogueModule[]>, void>({
      query: () => ({ url: `${scope()}/permission-catalogue/`, method: "GET" }),
      extraOptions: { silent: true },
      providesTags: ["PermissionCatalogue"],
    }),

    createSchoolRole: builder.mutation<Envelope<SchoolRoleDetail>, NewRole>({
      query: (body) => ({ url: `${scope()}/roles/`, method: "POST", body }),
      extraOptions: { silent: true },
      // The onboarding gate reads the role baseline to decide whether the
      // roles step can close, so a role added here can change the checklist.
      invalidatesTags: ["Roles", "Onboarding"],
    }),

    /**
     * Replace what a role can reach.
     *
     * `permission_keys` is a REPLACEMENT, not an addition: the server drops
     * every grant the list does not name. The drawer therefore has to send the
     * full ticked set, never a delta.
     */
    updateSchoolRolePermissions: builder.mutation<
      Envelope<SchoolRoleDetail>,
      { key: string; permission_keys: string[] }
    >({
      query: ({ key, permission_keys }) => ({
        url: `${scope()}/roles/${key}/`,
        method: "PATCH",
        body: { permission_keys },
      }),
      extraOptions: { silent: true },
      invalidatesTags: (_result, _error, { key }) => [
        "Roles",
        { type: "Roles", id: key },
        "Onboarding",
      ],
    }),
  }),
});

export const {
  useGetSchoolRolesQuery,
  useGetSchoolRoleQuery,
  useGetPermissionCatalogueQuery,
  useCreateSchoolRoleMutation,
  useUpdateSchoolRolePermissionsMutation,
} = rolesApi;
