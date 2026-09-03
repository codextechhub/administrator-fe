/**
 * The school on the right of the greeting.
 *
 * Drawn here rather than fetched or imported: it is one shape at one size, and
 * an SVG in the markup inherits `currentColor`, so it takes the hero's white
 * without a second copy for a light and a dark panel.
 *
 * **It is a watermark, not a picture.** Everything is white at low opacity, so
 * it sits IN the gradient rather than on top of it - the greeting is the
 * content of that box and the drawing must never compete with it. That is also
 * why there is no colour: an illustration with its own palette inside a branded
 * panel reads as a sticker somebody applied.
 *
 * Institutional rather than cute. A portico with columns, a clock tower and two
 * wings is what a person recognises as a school in one glance, at any size,
 * without a single character of text.
 */

/**
 * `full` is the three buildings; `centre` is the main block alone.
 *
 * One drawing, two windows onto it. A phone has room for a mark and not for a
 * whole frontage - shrinking all three to fit turns the columns and the clock into
 * grey mush - so the small screen gets the portico and the tower at a size
 * where they are still legible as a building.
 */
export function HeroBuildings({
  className,
  crop = "full",
}: {
  className?: string;
  crop?: "full" | "centre";
}) {
  return (
    <svg
      // Cropped to the content, not to a round number: the flag sits at y=4 and
      // the ground at y=124, and a taller box left 26 units of nothing at the
      // bottom - which pushed the clock tower out of the top of the panel when
      // the drawing was scaled to fill it.
      viewBox={crop === "centre" ? "94 0 116 130" : "0 0 340 130"}
      fill="none"
      // Decorative. The greeting beside it already says where the reader is,
      // and a screen reader describing masonry would be noise.
      aria-hidden
      focusable="false"
      className={className}
    >
      {/* ── left wing ── */}
      <g opacity="0.5">
        <path d="M14 66 L52 50 L90 66" stroke="currentColor" strokeWidth="1.5" />
        <rect x="20" y="66" width="64" height="58" stroke="currentColor" strokeWidth="1.5" />
        <rect x="20" y="66" width="64" height="58" fill="currentColor" opacity="0.06" />
        {[0, 1, 2].map((row) =>
          [0, 1].map((col) => (
            <rect
              key={`l-${row}-${col}`}
              x={30 + col * 26}
              y={75 + row * 17}
              width="16"
              height="11"
              fill="currentColor"
              opacity="0.22"
            />
          )),
        )}
      </g>

      {/* ── main block, portico and tower ── */}
      <g opacity="0.85">
        {/* tower */}
        <path d="M152 10 L152 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M152 5 L168 9 L152 13 Z" fill="currentColor" opacity="0.55" />
        <path d="M140 30 L152 14 L164 30" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="142" y="30" width="20" height="26" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="152" cy="41" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M152 38 L152 41 L154.5 42.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />

        {/* pediment */}
        <path d="M104 62 L152 40 L200 62" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        <path d="M104 62 L152 40 L200 62 Z" fill="currentColor" opacity="0.08" />
        <path d="M100 62 H204" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />

        {/* body */}
        <rect x="106" y="62" width="92" height="62" stroke="currentColor" strokeWidth="1.5" />
        <rect x="106" y="62" width="92" height="62" fill="currentColor" opacity="0.06" />

        {/* columns, which is what makes it read as an institution */}
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={`c-${i}`}
            x={116 + i * 22}
            y="70"
            width="7"
            height="54"
            fill="currentColor"
            opacity="0.2"
          />
        ))}
        {/* doorway */}
        <path
          d="M146 124 V104 a6 6 0 0 1 12 0 V124"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </g>

      {/* ── right wing ── */}
      <g opacity="0.5">
        <path d="M212 70 L250 54 L288 70" stroke="currentColor" strokeWidth="1.5" />
        <rect x="218" y="70" width="64" height="54" stroke="currentColor" strokeWidth="1.5" />
        <rect x="218" y="70" width="64" height="54" fill="currentColor" opacity="0.06" />
        {[0, 1, 2].map((row) =>
          [0, 1].map((col) => (
            <rect
              key={`r-${row}-${col}`}
              x={228 + col * 26}
              y={78 + row * 16}
              width="16"
              height="10"
              fill="currentColor"
              opacity="0.22"
            />
          )),
        )}
      </g>

      {/* ── two trees and the ground, so the buildings stand on something ── */}
      <g opacity="0.4">
        <path d="M300 124 V108" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="300" cy="101" r="9" fill="currentColor" opacity="0.3" />
        <path d="M8 124 V112" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="106" r="7" fill="currentColor" opacity="0.3" />
      </g>
      <path
        d="M0 124 H332"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}
