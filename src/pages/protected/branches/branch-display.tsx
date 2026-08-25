import { Badge } from "@/components/ui/badge";
import type { SchoolBranch } from "@/redux/services/branches/branches-types";

/**
 * The bits the branch list and its drawer both draw.
 *
 * Their own module rather than exported from the list, because the drawer
 * imports them and the list imports the drawer: a cycle that resolves to
 * undefined at runtime and takes the drawer with it.
 */

/** What a school can read from the address fields it actually has. */
export function locationOf(branch: SchoolBranch): string {
  const parts = [branch.address, branch.state, branch.country]
    .map((part) => part?.trim())
    .filter(Boolean);
  // A branch with no address on file says so rather than
  // rendering an empty row that reads as a loading bug.
  return parts.length ? parts.join(", ") : "No address on file";
}

const STATUS_LABEL: Record<
  string,
  { text: string; tone: "success" | "rejected" | "pending" }
> = {
  ACTIVE: { text: "Active", tone: "success" },
  PENDING: { text: "Pending", tone: "pending" },
  SUSPENDED: { text: "Suspended", tone: "rejected" },
  INACTIVE: { text: "Inactive", tone: "rejected" },
  CLOSED: { text: "Closed", tone: "rejected" },
};

/** A branch's status, when it is worth saying. */
export function StatusChip({ status }: { status: string }) {
  const known = STATUS_LABEL[status];
  // An active branch is the normal case and needs no chip announcing it.
  if (!known || status === "ACTIVE") return null;
  return (
    <Badge variant={known.tone} className="text-xs py-0.5 h-fit rounded-lg">
      {known.text}
    </Badge>
  );
}
