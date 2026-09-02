import { useState } from "react";

import { currentSchoolSlug } from "@/utils/school-host";
import { schoolLogoUrl } from "@/utils/school-brand";

// The mark at the top of the sign-in page.
//
// Not components/school-mark, which is the sidebar's: that one is handed a logo
// it has already fetched with a session, and flips to name the school. This one
// runs before any session exists and has to resolve the crest for itself.
//
// A school's own crest where the address names a school and that school has
// uploaded one, and the XVS mark otherwise. Which matters because this is the
// page where somebody decides whether they are in the right place: staff at
// Holy Cross reaching holy-cross.xvs.codexng.com should see their own badge,
// and the bare product address has no school to show.
//
// The fallback is driven by the image failing to load rather than by asking
// first. The endpoint answers 404 for a school with no crest and for a slug
// that is not a school at all, deliberately without distinguishing them, so
// there is nothing to be gained by a probe request that a plain onError does
// not already tell us - and this way the common case is one request, not two.
export default function SignInMark({ className }: { className?: string }) {
  // Read once per mount: the address cannot change without a page load.
  const [slug] = useState(() => currentSchoolSlug());
  const [failed, setFailed] = useState(false);

  const url = failed ? "" : schoolLogoUrl(slug);
  if (!url) {
    return <img src="/image/logo.png" alt="XVS" className={className} />;
  }
  return (
    <img
      src={url}
      alt="School logo"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
