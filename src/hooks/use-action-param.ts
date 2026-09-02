import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import {
  markParamConsumed,
  releaseParamKey,
  withoutConsumedParams,
} from "./consumed-params";

const ACTION_KEY = "action";

/**
 * Open a flow in response to an `?action=<value>` query param, then strip the
 * param so a refresh or a back-navigation does not reopen it.
 *
 * This is the landing side of the action palette. A `do` action navigates to a
 * list screen with `?action=new`, and the screen calls
 * `useActionParam("new", openDrawer)` to pop its create drawer on arrival.
 * Without it the palette can only ever offer screens, never the jobs people
 * actually open them to do.
 *
 * The twin of this hook already lives in @xvs/finance, and both consume through
 * the same shared registry as useFilterParam - a screen landing with
 * `?status=RETURNED&action=new` must not have the two hooks put each other's
 * key back. See ./consumed-params.ts for why that registry exists.
 *
 * **Guard the callback with whatever guards the button.** A query param is
 * typed as easily as it is clicked, so a handler that opens a drawer the screen
 * would not have offered is a way round the screen's own rules. Every call site
 * here passes the same permission (and the same read-only-year check) that the
 * Add button is wrapped in - see the note at each one.
 */
export function useActionParam(value: string, onMatch: () => void): void {
  const [params, setParams] = useSearchParams();
  // Guard against re-firing (onMatch identity changes each render) until the
  // param is actually cleared; it resets once the param no longer matches.
  const firedRef = useRef(false);

  useEffect(() => () => releaseParamKey(ACTION_KEY), []);

  useEffect(() => {
    if (params.get(ACTION_KEY) !== value) {
      firedRef.current = false;
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;
    onMatch();
    markParamConsumed(ACTION_KEY);
    setParams(withoutConsumedParams(params), { replace: true });
  }, [params, value, onMatch, setParams]);
}
