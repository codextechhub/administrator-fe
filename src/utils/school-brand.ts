// The school's crest, addressed before anyone has signed in.
//
// The logo on the auth payload is a signed media URL bound to its reader, so it
// cannot exist yet on the sign-in page: there is no reader. This one is served
// by slug from a public route instead, and the slug comes off the address the
// page was served from.
//
// Absolute, because the app and the API are different origins: the school app
// sits at <slug>.xvs.codexng.com and the API at api.codexng.com, so a bare path
// would be fetched from the app itself and find nothing.

/** The public crest URL for a school slug, or "" when there is nothing to ask for. */
export function schoolLogoUrl(slug: string): string {
  const clean = (slug || "").trim().toLowerCase();
  if (!clean) return "";
  const base = String(import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");
  if (!base) return "";
  return `${base}/i/public/schools/${encodeURIComponent(clean)}/logo/`;
}
