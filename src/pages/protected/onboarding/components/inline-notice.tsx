import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A bordered banner that sits inside a screen and says one thing.
 *
 * Distinct from `OutlinedNotice`, which replaces a whole screen when there is
 * nothing to show. This is for a screen that has plenty to show and one thing
 * to say about it: what a file got wrong, what this step cannot do yet, what
 * happens next.
 *
 * Extracted when the import screen became the second place to want it - the
 * failed go-live block hand-rolls the same shape - so the two do not drift into
 * two different ideas of what a warning looks like.
 */
const TONES = {
  info: {
    border: "border-border",
    icon: "text-primary",
  },
  success: {
    border: "border-green-01",
    icon: "text-green-01",
  },
  warning: {
    border: "border-yellow-01",
    icon: "text-yellow-01",
  },
  danger: {
    border: "border-red-01",
    icon: "text-red-01",
  },
} as const;

export function InlineNotice({
  tone = "info",
  icon: Icon,
  title,
  children,
  className,
}: {
  tone?: keyof typeof TONES;
  icon: LucideIcon;
  title: string;
  /** The detail under the title. Optional: a title alone is often enough. */
  children?: ReactNode;
  className?: string;
}) {
  const style = TONES[tone];
  return (
    <div
      className={cn(
        "bg-white rounded-md border px-4 py-3.5 flex items-start gap-3 min-w-0",
        style.border,
        className,
      )}
    >
      <Icon className={cn("size-4 shrink-0 mt-0.5", style.icon)} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-black-01 font-mont text-pretty">
          {title}
        </p>
        {children && (
          <div className="mt-1 text-[13px] text-gray-01 text-pretty">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
