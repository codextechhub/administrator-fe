// Non-hook accessor for the caller's asserted tenant slug.
//
// Every tenant-owned backend request must carry ?tenant=<slug>. The base query
// injects it centrally by reading the live store here (bound in store.ts after
// creation — no import cycle, this module imports nothing from the store at
// runtime). Empty string before login / on a legacy token: the backend then
// 400s with the "tenant required" message, which the auth flow handles.

type AuthState = {
  auth?: {
    tenant?: { slug?: string } | null;
  };
};

let readState: (() => AuthState) | null = null;

export const bindTenantStore = (getState: () => AuthState): void => {
  readState = getState;
};

export const getTenantSlug = (): string => {
  return readState?.()?.auth?.tenant?.slug || "";
};
