import { useEffect } from "react";

import { DEFAULT_FAVICON, setFavicon } from "@/utils/favicon";

/**
 * Point the tab icon at a school's crest, on the pages that have no session.
 *
 * The signed-in half of the app already does this from the auth payload, via
 * useSchoolLogo in the Authenticated middleware. The pages that run before or
 * without a session - sign-in, the pay page, the gateway return - cannot use
 * that, and were left showing the XVS mark in the tab while the page itself
 * wore the school's crest.
 *
 * It loads the image before pointing the tab at it. A <link rel="icon"> aimed
 * at a 404 does not fall back, it just leaves whatever was there, so a school
 * with no crest would keep the previous tab's icon rather than getting the XVS
 * one. Deciding on a load event costs one cached request and is the difference
 * between a correct default and an arbitrary one.
 */
export function useBrandFavicon(href: string | undefined | null): void {
  useEffect(() => {
    if (!href) {
      setFavicon(DEFAULT_FAVICON);
      return;
    }
    let cancelled = false;
    const probe = new Image();
    probe.onload = () => {
      if (!cancelled) setFavicon(href);
    };
    probe.onerror = () => {
      if (!cancelled) setFavicon(DEFAULT_FAVICON);
    };
    probe.src = href;
    return () => {
      cancelled = true;
    };
  }, [href]);
}
