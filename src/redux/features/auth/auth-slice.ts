import type { RootStateType } from "@/redux/store";
import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  type ActiveImpersonation,
  type Auth,
  type AuthContextSnapshot,
  type SchoolInfo,
  type TenantInfo,
  type User,
} from "./auth-types";

// Shape of the login / activation response's `data` envelope.
interface AuthPayload {
  user: User | null;
  access: string;
  refresh?: string;
  session_id?: number;
  permissions?: string[];
  school?: SchoolInfo | null;
  tenant?: TenantInfo | null;
}

const initialState: Auth = {
   access: "",
   refresh: "",
   session_id: 0,
   user: null,
   permissions: [],
   school: null,
   tenant: null,
   impersonation: null,
};

// `/me` re-runs on mount, on token refresh and (since focus-refetch) every time
// the user tabs back - but the context it returns is almost always identical to
// what is already in the store. Assigning unconditionally would hand every
// `selectPermissions` / `selectTenant` consumer a brand-new reference on each of
// those runs, re-rendering the whole protected tree and rewriting redux-persist
// for nothing. Compare first and no-op when nothing actually changed; Immer then
// returns the very same state object.
const samePermissions = (a: string[] | undefined, b: string[]): boolean =>
  !!a && a.length === b.length && a.every((perm, i) => perm === b[i]);

const sameTenant = (
  a: TenantInfo | null | undefined,
  b: TenantInfo | null
): boolean =>
  a === b || (!!a && !!b && a.slug === b.slug && a.name === b.name);

const sameSchool = (
  a: SchoolInfo | null | undefined,
  b: SchoolInfo | null
): boolean =>
  a === b ||
  (!!a && !!b && a.id === b.id && a.name === b.name && a.slug === b.slug && a.logo === b.logo);

// Identity comparison for the same no-op reason as the guards above: `/me`
// re-runs on mount, refresh and focus, and its `user` payload is a brand-new
// object every time. `updated_at` moves whenever anything about the record
// changes, so id + updated_at + the fields the shell renders is enough to know
// the identity is unchanged without deep-comparing an FLS-variable object.
const sameUser = (a: User | null | undefined, b: User | null): boolean =>
  a === b ||
  (!!a &&
    !!b &&
    a.id === b.id &&
    a.updated_at === b.updated_at &&
    a.full_name === b.full_name &&
    a.email === b.email &&
    a.role === b.role &&
    a.branch_name === b.branch_name);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: () => initialState,
    setAuthUser: (state, action: PayloadAction<AuthPayload>) => {
      state.user = action.payload.user;
      state.access = action.payload.access;
      state.refresh = action.payload.refresh || "";
      state.session_id = action.payload.session_id || 0;
      state.permissions = action.payload.permissions ?? [];
      state.school = action.payload.school ?? null;
      state.tenant = action.payload.tenant ?? null;
    },
    updateAuthUser: (state, action: PayloadAction<Partial<User>>) => {
      state.user = { ...(state.user as User), ...action.payload };
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.access = action.payload;
    },
    updatePermissions: (state, action: PayloadAction<string[]>) => {
      if (samePermissions(state.permissions, action.payload)) return;
      state.permissions = action.payload;
    },
    updateTenant: (state, action: PayloadAction<TenantInfo | null>) => {
      if (sameTenant(state.tenant, action.payload)) return;
      state.tenant = action.payload;
    },
    /**
     * Apply a complete effective identity in one dispatch.
     *
     * This is what `/me` hydrates and what a proxy start/exit swaps: the whole
     * context moves together, so applying it field-by-field would briefly leave
     * the shell rendering one user's name beside another user's permissions.
     * Every field keeps its own no-op guard, so the common case (`/me` returning
     * an unchanged context on focus) still touches nothing.
     */
    setAuthContext: (state, action: PayloadAction<AuthContextSnapshot>) => {
      if (!sameUser(state.user, action.payload.user)) state.user = action.payload.user;
      if (!sameSchool(state.school, action.payload.school)) state.school = action.payload.school;
      if (!sameTenant(state.tenant, action.payload.tenant)) state.tenant = action.payload.tenant;
      if (!samePermissions(state.permissions, action.payload.permissions)) {
        state.permissions = action.payload.permissions;
      }
    },
    setImpersonation: (state, action: PayloadAction<ActiveImpersonation | null>) => {
      state.impersonation = action.payload;
    },
  },
});

export const {
  setAuthUser,
  setToken,
  updateAuthUser,
  updatePermissions,
  updateTenant,
  setAuthContext,
  setImpersonation,
} = authSlice.actions;
export const resetAuth = authSlice.actions.reset;

export const authSliceReducer = authSlice.reducer;

export const selectUser = (state: RootStateType) => state.auth.user;
// Shared empty array: a `?? []` literal would mint a new reference on every
// call, so a legacy persisted session with no `permissions` key would re-render
// its consumers on every dispatched action regardless of the reducer guard.
const NO_PERMISSIONS: string[] = [];
export const selectPermissions = (state: RootStateType) =>
  state.auth.permissions ?? NO_PERMISSIONS;
export const selectSchool = (state: RootStateType) => state.auth.school ?? null;
export const selectTenant = (state: RootStateType) => state.auth.tenant ?? null;
export const selectImpersonation = (state: RootStateType) =>
  state.auth.impersonation ?? null;
// While proxying, `permissions` holds the TARGET's grants - so a "can I proxy?"
// check must read the retained actor snapshot, otherwise the exit affordance
// disappears the moment the proxy starts (stranding the admin as the target).
export const selectActorPermissions = (state: RootStateType) =>
  state.auth.impersonation?.actor.permissions ?? selectPermissions(state);
