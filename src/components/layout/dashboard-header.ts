/**
 * The runtime channel for the header title.
 *
 * DashboardLayout is an eager LAYOUT ROUTE: it renders once above the lazy page
 * chunks, so a page cannot pass it a title as a prop. Routes declare a static
 * one in `handle.title`, which covers this app's own screens because each of
 * them is one route with one name.
 *
 * It does not cover the finance and procurement areas. Those are dozens of
 * screens under two route parents, and the parent declares "Finance" for all of
 * them: without this the header read "Finance" on the dashboard, on Chart of
 * Accounts, on AR Invoices and on every other screen in the area, so the one
 * piece of chrome that says where you are said nothing. @xvs/finance already
 * computes the right name from its own nav and calls `useDashboardTitle` with
 * it; this is the end of that wire.
 *
 * An override is stamped with the location key it was set under and ignored the
 * moment the location changes, so a title cannot bleed into the next screen
 * even if a page forgets to clean up.
 */

import { createContext, useContext, useEffect } from "react";

/** A runtime override, valid only for the location it was set under. */
export type HeaderOverride = {
  key: string;
  title?: string;
};

/**
 * The override wins while the caller is still on the location that set it.
 * Once `locationKey` moves on the override is dead and the route's own handle
 * takes over immediately, with no stale-title flash in between.
 */
export function resolveHeaderTitle(
  handleTitle: string | undefined,
  override: HeaderOverride | null,
  locationKey: string,
): string | undefined {
  const live = override && override.key === locationKey ? override : null;
  return live?.title ?? handleTitle;
}

export type DashboardHeaderApi = {
  setTitle: (title?: string) => void;
};

// Outside the layout (unit tests, isolated renders) the setter is inert rather
// than throwing, so a page component stays mountable on its own.
const INERT: DashboardHeaderApi = { setTitle: () => {} };

export const DashboardHeaderContext = createContext<DashboardHeaderApi | null>(null);

export function useDashboardHeader(): DashboardHeaderApi {
  return useContext(DashboardHeaderContext) ?? INERT;
}

/**
 * Name the header from page state. Pass `undefined` while the data a title
 * depends on is still loading, and the route's `handle.title` shows through.
 */
export function useDashboardTitle(title?: string): void {
  const { setTitle } = useDashboardHeader();
  useEffect(() => {
    setTitle(title);
    return () => setTitle(undefined);
  }, [setTitle, title]);
}
