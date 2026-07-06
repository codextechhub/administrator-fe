import { combineReducers } from "@reduxjs/toolkit";
import { authSliceReducer } from "./auth/auth-slice";
import { baseApi } from "../services/base-api";

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authSliceReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
