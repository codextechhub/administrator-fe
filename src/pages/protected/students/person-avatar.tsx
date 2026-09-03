import { skipToken } from "@reduxjs/toolkit/query";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useFetchAuthMediaQuery } from "@/redux/services/media-api";

import { personInitials } from "./person-name";

/**
 * A person's face, or their initials when there is no photograph.
 *
 * **The photograph was being fetched and thrown away.** Every student row and
 * the profile carry `photo_url`, and nothing in this module rendered it - so a
 * school that had uploaded passport photographs saw initials on every screen.
 * Six places drew their own initials circle instead.
 *
 * **The url goes through the media query, not straight into `<img src>`.** The
 * signature on a `photo_url` is a SECOND factor, not the first one: it binds
 * the link to one user so a leaked url is useless to anybody else, but
 * MediaView still requires the JWT, and a browser sends no Authorization
 * header for an image. Pointing an `<img>` at it answers 401, which the browser
 * then blocks outright as a cross-origin non-image - so the circle silently
 * fell back to initials and looked exactly like a student with no photograph.
 * `useFetchAuthMedia` fetches the bytes WITH the token and hands back a local
 * blob, which is the same route the school crest takes.
 *
 * Radix supplies the fallback behaviour: the initials show while the image
 * loads and stay if it fails, so a broken or expired link degrades to what the
 * screens showed before rather than to an empty circle.
 */
export function PersonAvatar({
  name,
  photoUrl,
  className,
  textClassName,
}: {
  name: string;
  /** "" when the school holds no photograph, which is the common case. */
  photoUrl?: string;
  /** Size and shape. Callers set their own, from 28px in a row to 72px above a profile. */
  className?: string;
  /** The initials' type scale, which does not follow the box size on its own. */
  textClassName?: string;
}) {
  // Gated on the url, not on the result: a student whose photograph is removed
  // goes back to `skipToken`, and the blob minted for the url they used to have
  // stays in the media cache for an hour - so reading the query's data alone
  // would leave the old face on screen right where it was just deleted. The
  // same trap useSchoolLogo documents.
  const { data: blobUrl } = useFetchAuthMediaQuery(photoUrl || skipToken);
  const src = photoUrl ? blobUrl : undefined;

  return (
    <Avatar
      // Remounted when the photograph appears or goes away. Radix keeps the
      // image's loading status on the Root and does NOT reset it when the
      // <AvatarImage> unmounts - so removing a student's photograph left the
      // context still saying "loaded", the fallback stayed suppressed, and the
      // circle went blank: no face and no initials either.
      key={src ? "photo" : "initials"}
      className={cn(
        // The ring is the edge. Without it a pale photograph, and the pale
        // initials circle behind it, dissolve into the white row - and a
        // column of faces stops reading as a column of anything.
        "size-9.5 ring-1 ring-white-02",
        className,
      )}
    >
      {src ? <AvatarImage src={src} alt="" className="object-cover" /> : null}
      <AvatarFallback
        className={cn(
          "bg-white-03 font-semibold text-primary",
          textClassName ?? "text-[13px]",
        )}
      >
        {personInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
