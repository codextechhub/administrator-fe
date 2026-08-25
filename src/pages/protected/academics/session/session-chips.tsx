import { Badge } from "@/components/ui/badge";
import type { SessionStatus } from "@/redux/services/academics/academics-types";
import { statusOf } from "./session-format";

export function SessionStatusChip({
  status,
  className = "",
}: {
  status: SessionStatus | string;
  className?: string;
}) {
  const { label, variant } = statusOf(status);
  return (
    <Badge
      variant={variant as never}
      className={`h-fit rounded-full py-0 text-[11px] uppercase ${className}`}
    >
      {label}
    </Badge>
  );
}
