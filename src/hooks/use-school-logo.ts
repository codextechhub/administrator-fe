/**
 * Resolves the signed-in school's logo to a ready-to-render blob URL.
 *
 * The logo on the auth payload (school.logo) is an auth-gated /media/ URL that a
 * browser-native <img src> or <link rel=icon> can't fetch (no Authorization
 * header → 401). This hook runs the URL through fetchAuthMedia, which fetches
 * the bytes with the access token and hands back a local blob: URL. RTK Query
 * caches/dedupes it, so the sidebar and favicon share a single request.
 *
 * Returns undefined while loading or when the school has no logo - callers fall
 * back to the bundled default.
 */

import { skipToken } from "@reduxjs/toolkit/query";
import { useFetchAuthMediaQuery } from "@/redux/services/media-api";
import { useAppSelector } from "@/redux/store";
import { selectSchool } from "@/redux/features/auth/auth-slice";

export function useSchoolLogo(): string | undefined {
  const school = useAppSelector(selectSchool);
  const { data: blobUrl } = useFetchAuthMediaQuery(school?.logo ?? skipToken);
  // Gated on the school's logo, not on the query result. A school that removes
  // its logo goes from "fetch this URL" to `skipToken`, and the blob minted for
  // the URL it used to have stays in the media cache for an hour - so returning
  // the query's data alone left the old crest in the sidebar and the browser tab
  // until the next reload, on the very screen where it had just been deleted.
  return school?.logo ? blobUrl : undefined;
}
