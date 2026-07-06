import type { RootStateType } from "@/redux/store";
import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import { type Auth, type SchoolInfo, type User } from "./auth-types";

// Shape of the login / activation response's `data` envelope.
interface AuthPayload {
  user: User | null;
  access: string;
  refresh?: string;
  session_id?: number;
  permissions?: string[];
  school?: SchoolInfo | null;
}

const initialState: Auth = {
   access: "",
   refresh: "",
   session_id: 0,
   user: null,
   permissions: [],
   school: null,
};

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
    },
    updateAuthUser: (state, action: PayloadAction<Partial<User>>) => {
      state.user = { ...(state.user as User), ...action.payload };
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.access = action.payload;
    },
    updatePermissions: (state, action: PayloadAction<string[]>) => {
      state.permissions = action.payload;
    },
  },
});

export const { setAuthUser, setToken, updateAuthUser, updatePermissions } = authSlice.actions;
export const resetAuth = authSlice.actions.reset;

export const authSliceReducer = authSlice.reducer;

export const selectUser = (state: RootStateType) => state.auth.user;
export const selectPermissions = (state: RootStateType) => state.auth.permissions ?? [];
export const selectSchool = (state: RootStateType) => state.auth.school ?? null;
