import { cn } from "@/lib/utils";

/**
 * A short list of options as buttons rather than a dropdown.
 *
 * The design uses this for gender, and it is the right control for two or
 * three choices: both options are visible without opening anything, and
 * picking one is a single tap instead of open-scan-tap. A native select earns
 * its place when the list is long enough that showing it would crowd the form,
 * which two options never are.
 */
export function ChoiceButtons<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T | "";
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
  /** Names the group, since the buttons only name themselves. */
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const picked = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={picked}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-10.5 rounded-lg border px-4.5 text-[13.5px] font-medium",
              picked
                ? "border-primary bg-white-03 text-primary"
                : "border-white-02 bg-white text-gray-06 hover:border-primary/30",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
