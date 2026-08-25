import { combineReducers } from "@reduxjs/toolkit";
import { authSliceReducer } from "./auth/auth-slice";
import { lensSliceReducer } from "./academics/lens-slice";
import { baseApi } from "../services/base-api";

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authSliceReducer,
  // Not in persistConfig's whitelist on purpose - see lens-slice.
  academicsLens: lensSliceReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
