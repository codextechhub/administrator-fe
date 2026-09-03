/**
 * Query params consumed by the one-shot landing hooks (useActionParam and
 * useFilterParam) in the current commit.
 *
 * Both hooks do the same thing: read a deep-link param, fire once, then strip it
 * so a refresh or back-navigation doesn't replay the instruction. A screen can
 * land with several at once ("?tab=team&action=new"), which means several effects
 * each stripping one key in the same commit. Neither sees the other's write -
 * react-router hands the updater the params from the last render, not the URL as
 * it stands - so each would put the other's key back, and whichever ran first
 * would lose its strip.
 *
 * Registering the key *before* computing the strip set, and stripping every
 * registered key on each write, makes the outcome the same regardless of order:
 * the last write removes them all. The registry has to be shared across both
 * hooks, not per-module, or a screen mixing the two (Tasks: `?tab=` and
 * `?action=`) reintroduces exactly the race each hook solved on its own.
 */

const consumedKeys = new Set<string>();

/** Announce that this key is being consumed and stripped in this commit. */
export function markParamConsumed(key: string): void {
  consumedKeys.add(key);
}

/**
 * Stop announcing a key once the screen is gone, so a later screen using the
 * same param name is not stripped by a mount that has nothing to do with it.
 */
export function releaseParamKey(key: string): void {
  consumedKeys.delete(key);
}

/** A copy of `params` with every currently-consumed key removed. */
export function withoutConsumedParams(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  consumedKeys.forEach((consumed) => next.delete(consumed));
  return next;
}
