import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { personInitials } from "./person-name";

/**
 * A person's face, or their initials when there is no photograph.
 *
 * **The photograph was being fetched and thrown away.** Every student row and
 * the profile carry `photo_url`, and nothing in this module rendered it - so a
 * school that had uploaded passport photographs saw initials on every screen.
 * Six places drew their own initials circle instead.
 *
 * `photo_url` is a SIGNED url: the authorisation is in the query string, so a
 * plain <img> loads it. That is why this needs none of the token-fetching the
 * school logo needs - see useSchoolLogo, which exists because the logo is a
 * bare /media/ path that a browser cannot authenticate.
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
  return (
    <Avatar className={cn("size-9.5", className)}>
      {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
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
