import type { VariantProps } from "class-variance-authority";

import { Badge, badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StudentStatus } from "@/redux/services/students/students-types";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

/**
 * One place decides what a status looks like.
 *
 * The directory, the cards, the profile header and the guardian's ward list all
 * show the same chip, and a status spelled green on one screen and grey on the
 * next reads as two different states rather than one. Keyed on the CODE, never
 * on the label, so a wording change on the backend cannot silently drop a
 * status into the fallback.
 *
 * **It is the shared Badge now, not a private class map.** This module had its
 * own tinted-background table sitting beside a Badge that already owns those
 * pairs and is used on a dozen screens - so a change to the palette landed
 * everywhere except here, and a student's ACTIVE chip drifted from every other
 * ACTIVE chip in the app.
 *
 * SUSPENDED reads amber rather than the red it used to. It was drawn
 * identically to WITHDRAWN and REJECTED, which flattened a reversible pause
 * into the same picture as a record that has left the school for good.
 */
const VARIANT: Record<StudentStatus, BadgeVariant> = {
  APPLICANT: "blue",
  ENROLLED: "teal",
  ACTIVE: "active",
  SUSPENDED: "amber",
  GRADUATED: "inactive",
  TRANSFERRED: "inactive",
  WITHDRAWN: "rejected",
  REJECTED: "rejected",
};

export function StudentStatusBadge({
  status,
  label,
  className,
}: {
  status: StudentStatus;
  /** The server's wording. Falls back to the code so a new status still shows. */
  label?: string;
  className?: string;
}) {
  return (
    <Badge
      variant={VARIANT[status] ?? "inactive"}
      className={cn("rounded-full px-2 py-0.5 text-[11px]", className)}
    >
      {label || status}
    </Badge>
  );
}
