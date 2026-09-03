import type { StudentStatus } from "@/redux/services/students/students-types";

/**
 * One place decides what a status looks like.
 *
 * The directory, the cards, the profile header and the guardian's ward list all
 * show the same chip, and a status spelled green on one screen and grey on the
 * next reads as two different states rather than one. Keyed on the CODE, never
 * on the label, so a wording change on the backend cannot silently drop a
 * status into the fallback.
 */
const CHIP: Record<StudentStatus, string> = {
  APPLICANT: "bg-primary/10 text-primary",
  ENROLLED: "bg-lime-600/10 text-lime-700",
  ACTIVE: "bg-green-700/10 text-green-800",
  SUSPENDED: "bg-red-500/10 text-red-600",
  GRADUATED: "bg-gray-500/10 text-gray-600",
  TRANSFERRED: "bg-gray-500/10 text-gray-600",
  WITHDRAWN: "bg-red-500/10 text-red-600",
  REJECTED: "bg-red-500/10 text-red-600",
};

const BASE =
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function statusChipClass(status: StudentStatus) {
  return `${BASE} ${CHIP[status] ?? "bg-gray-500/10 text-gray-600"}`;
}
