import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook} from "react-redux";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";
import localStorage from "redux-persist/es/storage";
import { baseApi } from "./services/base-api";
import rootReducer, { type RootState } from "./features/root-reducer";

const persistConfig = {
  key: "root",
  storage: localStorage,
  whitelist: ["auth"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  // import.meta.env.NODE_ENV does not exist under Vite — only MODE/DEV/PROD.
  // Using it left DevTools enabled in production builds.
  devTools: import.meta.env.DEV,
  // Both dev tripwires are back on (RTK no-ops them in production builds). The
  // serializable check ignores redux-persist's own lifecycle actions, which
  // legitimately carry non-serializable payloads — the documented allow-list.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
});

// Tracks window focus/online state so queries can use skipPollingIfUnfocused /
// refetchOnFocus. Existing queries are unaffected (those behaviors are opt-in).
setupListeners(store.dispatch);

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export type RootStateType = ReturnType<typeof rootReducer>;
export const persistor = persistStore(store);
