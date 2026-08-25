import { Badge } from "@/components/ui/badge";

/**
 * Where a catalogue row applies.
 *
 * School-wide gets a chip and a branch gets plain text, deliberately. A list
 * where every row wears a chip is a list of chips; the chip is doing work here
 * precisely because it marks the rows that are NOT specific to somewhere.
 *
 * Renders nothing when the label is absent, which is what a single-branch school
 * gets: the serializer drops every branch-shaped field for them.
 */
export function ScopeCell({
  label,
  shared,
}: {
  label?: string | null;
  shared: boolean;
}) {
  if (!label) return null;
  return shared ? (
    <Badge variant="blue" className="h-fit rounded-full py-0 text-[11px]">
      {label}
    </Badge>
  ) : (
    <span className="min-w-0 truncate">{label}</span>
  );
}
