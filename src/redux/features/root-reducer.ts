import { combineReducers } from "@reduxjs/toolkit";
import { authSliceReducer } from "./auth/auth-slice";
import { lensSliceReducer } from "./academics/lens-slice";
import { baseApi } from "../services/base-api";
// Shipped by @xvs/finance. The package holds the selected ledger entity in
// redux, so a host that mounts its screens must mount its reducer too - the
// same obligation as its RTK tag types and permission codes.
import { entitySliceReducer } from "@xvs/finance/redux/features/finance/entity-slice";

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authSliceReducer,
  // Not in persistConfig's whitelist on purpose - see lens-slice.
  academicsLens: lensSliceReducer,
  financeEntity: entitySliceReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
