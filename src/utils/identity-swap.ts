// ─────────────────────────────────────────────────────────────────────────────
// Identity-swap gate
//
// Starting or exiting a proxy session replaces the effective user underneath a
// fully mounted app. Screens rendered for the OLD identity can refire their
// queries faster than React unmounts them (router.navigate resolves before the
// commit), and those requests would go out under the NEW identity's headers -
// producing misleading 403 toasts and false PROXY_ACTION_FAILED rows in the
// backend audit trail. The responses would be thrown away by the post-swap
// cache reset anyway.
//
// So: while a swap is running, the base query short-circuits every request that
// belongs to the outgoing identity (see `blockedDuringIdentitySwap`) with a
// synthetic abort error, which the interceptor already treats as silent. The
// caller resets the api cache AFTER the gate lifts, so every mounted screen
// refetches exactly once under the settled identity.
//
// Module-level state on purpose: the base query is not a React tree and has no
// store slice of its own to read this from.
// ─────────────────────────────────────────────────────────────────────────────

let swapDepth = 0;

/** True while an identity swap is in flight. */
export const isIdentitySwapInProgress = (): boolean => swapDepth > 0;

/**
 * Run `work` with the gate raised. Re-entrant (depth counted) so a nested swap
 * - e.g. an aborted start that immediately restores the actor - cannot lower
 * the gate while the outer swap is still running. Always lowers, even if
 * `work` throws.
 */
export const runWithIdentitySwap = async <T>(work: () => Promise<T>): Promise<T> => {
  swapDepth += 1;
  try {
    return await work();
  } finally {
    swapDepth -= 1;
  }
};

/** Test-only reset so a failed run cannot leak the gate into the next test. */
export const resetIdentitySwapForTests = (): void => {
  swapDepth = 0;
};
