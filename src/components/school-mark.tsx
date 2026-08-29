import { cn } from "@/lib/utils";
import { markFontSize, markLabel } from "./school-mark-label";

// ─────────────────────────────────────────────────────────────────────────────
// The school's logo at the top of the sidebar, which turns over on hover to
// name the school.
//
// The header used to set the name and the reader's role beside the logo, in a
// block wide enough to need its own truncation. The console shows its mark
// alone and says who it is on hover, and this is the same: a logo the school
// chose is a better piece of identity than its name in 14px, and the name is
// one hover away for anyone who wants it.
//
// **A school's name is arbitrary text, which is the whole difficulty.** The
// console's back face is a fixed hand-drawn wordmark that always fits. "Holy
// Cross College" fits here too; "Government Comprehensive Secondary School,
// Ikeja" does not, at any size that is still readable. So the back face has a
// rule rather than a hope - see `markLabel`.
// ─────────────────────────────────────────────────────────────────────────────

/** Height of the logo, in px. The flip box is sized from it. */
const MARK_SIZE = 30;
/** Width of the flip box. Constant, so the header cannot shift as it turns. */
const MARK_WIDTH = 190;

export function SchoolMark({
  logo,
  name,
  slug,
  /**
   * Turn the flip off where there is no room for the name to appear - the
   * collapsed icon rail being the case that matters. The logo still renders.
   */
  animate = true,
  className,
}: {
  logo?: string | null;
  name?: string | null;
  slug?: string | null;
  animate?: boolean;
  className?: string;
}) {
  const src = logo ?? "/image/logo.png";
  const label = markLabel(name, slug);

  if (!animate) {
    return (
      <img
        src={src}
        // The link around this carries the accessible name; a repeat here
        // makes a screen reader say the school twice.
        alt=""
        className={cn("w-auto", className)}
        style={{ height: MARK_SIZE }}
      />
    );
  }

  return (
    <span
      className={cn("school-mark", className)}
      style={{ height: MARK_SIZE, width: MARK_WIDTH }}
      // The name in full, for a school whose back face shows the slug and for
      // anyone reading with a pointer but not a hover.
      title={name || undefined}
    >
      <span className="school-mark__card">
        <span className="school-mark__face">
          <img
            src={src}
            alt=""
            className="h-full w-auto"
            style={{ height: MARK_SIZE }}
          />
        </span>

        <span className="school-mark__face school-mark__face--back px-1">
          {/* One line, never two. The band that reveals the name sweeps left to
              right, so a second line would be written at the same time as the
              first - which is not how anybody writes. `markLabel` caps the
              length so one line is always enough. */}
          <span
            className="school-mark__ink whitespace-nowrap text-center leading-none text-primary"
            style={{
              fontFamily: "var(--font-script)",
              fontSize: markFontSize(label),
              fontWeight: 600,
            }}
          >
            {label}
          </span>
        </span>
      </span>
    </span>
  );
}
