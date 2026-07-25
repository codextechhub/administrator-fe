export type AuthContextGateState =
  | "redirect"
  | "loading"
  | "retry"
  | "logout"
  | "ready";

/**
 * Decide whether tenant-scoped routes are safe to mount.
 *
 * Persisted sessions from before tenant context was introduced can still have
 * a valid token and user while `tenant` is empty. Those sessions must wait for
 * `/me` before any protected query is allowed to run.
 *
 * When `/me` settles without a tenant we distinguish two cases:
 *   - the request errored → likely transient (network/server): offer a retry;
 *   - the request succeeded but carried no tenant → context is gone: log out.
 */
export function getAuthContextGateState({
  shouldRedirect,
  hasTenant,
  isLoading,
  isFetching,
  isError,
}: {
  shouldRedirect: boolean;
  hasTenant: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}): AuthContextGateState {
  if (shouldRedirect) return "redirect";
  if (hasTenant) return "ready";
  if (isLoading || isFetching) return "loading";
  return isError ? "retry" : "logout";
}
