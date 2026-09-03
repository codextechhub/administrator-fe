import { motion, useReducedMotion } from "motion/react";

/**
 * Decorative background for the login page's blue panel: a swarm of small
 * shapes that begin scattered and settle into a neat centered grid formation,
 * then breathe with a gentle infinite float. Purely presentational - the
 * container is aria-hidden and pointer-events-none so it never interferes with
 * the form. All motion is transform/opacity only (GPU-composited).
 */

const SHAPE_COUNT = 28;

// Grid formation: a 4 (rows) x 7 (cols) block, centred horizontally and sitting
// a little above the vertical centre so it reads as "arranged". Percentages are
// relative to the panel box.
const GRID_COLS = 7;
const GRID_ROWS = 4;
const GRID_LEFT = 26; // % - left edge of the formation
const GRID_TOP = 34; // % - top edge of the formation
const GRID_GAP_X = 8; // % between columns
const GRID_GAP_Y = 10; // % between rows

type ShapeKind = "circle" | "square" | "diamond";

interface Shape {
  /** Ordered (settled) position, in panel %. */
  ox: number;
  oy: number;
  /** Scattered (start) position, in panel %. */
  sx: number;
  sy: number;
  size: number; // px
  kind: ShapeKind;
  /** Tailwind classes for fill / border styling. */
  className: string;
  /** Idle-float amplitude (px) and duration (s), varied per shape. */
  floatY: number;
  floatDuration: number;
  settleDelay: number;
}

// A tiny deterministic PRNG (mulberry32) so every reload produces the identical
// scatter - the arrangement should feel authored, not random each visit.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0x5f3a19c7);

const KINDS: ShapeKind[] = ["circle", "square", "diamond"];

// Accent shapes tie the panel to the product palette; the rest are subtle
// white washes so the panel stays calm and premium.
const ACCENT_CLASSES = [
  "bg-[#4A659D]/70",
  "bg-[#8fa8d9]/60",
  "bg-[#8fa8d9]/50",
];
const FILL_CLASSES = [
  "bg-white/10",
  "bg-white/[0.14]",
  "bg-white/20",
  "bg-white/25",
];
const BORDER_CLASSES = [
  "border border-white/20",
  "border border-white/15",
];

const SHAPES: Shape[] = Array.from({ length: SHAPE_COUNT }, (_, i) => {
  const col = i % GRID_COLS;
  const row = Math.floor(i / GRID_COLS) % GRID_ROWS;

  const ox = GRID_LEFT + col * GRID_GAP_X;
  const oy = GRID_TOP + row * GRID_GAP_Y;

  const sx = 4 + rand() * 92; // scattered across the panel
  const sy = 4 + rand() * 92;

  const size = 8 + Math.round(rand() * 12); // 8–20px
  const kind = KINDS[Math.floor(rand() * KINDS.length)];

  // ~3 accent shapes, ~6 border-only outlines, the rest white fills.
  let className: string;
  if (i % 9 === 4) {
    className = ACCENT_CLASSES[i % ACCENT_CLASSES.length];
  } else if (i % 4 === 3) {
    className = BORDER_CLASSES[i % BORDER_CLASSES.length];
  } else {
    className = FILL_CLASSES[Math.floor(rand() * FILL_CLASSES.length)];
  }

  const floatY = 6 + rand() * 3; // 6–9px
  const floatDuration = 6 + rand() * 3; // 6–9s
  const settleDelay = i * 0.045;

  return {
    ox,
    oy,
    sx,
    sy,
    size,
    kind,
    className,
    floatY,
    floatDuration,
    settleDelay,
  };
});

function radiusFor(kind: ShapeKind): string {
  if (kind === "circle") return "9999px";
  return "4px"; // rounded square (diamonds are rotated squares)
}

export default function ArrangingShapes() {
  const reduce = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {SHAPES.map((s, i) => {
        const baseStyle: React.CSSProperties = {
          position: "absolute",
          left: `${s.ox}%`,
          top: `${s.oy}%`,
          width: s.size,
          height: s.size,
          borderRadius: radiusFor(s.kind),
          rotate: s.kind === "diamond" ? "45deg" : undefined,
        };

        // Reduced motion: render statically at the ordered position.
        if (reduce) {
          return (
            <div
              key={i}
              className={s.className}
              style={{ ...baseStyle, opacity: 0.9 }}
            />
          );
        }

        // Outer wrapper handles the scatter→settle spring (x/y offset from the
        // ordered anchor). Inner wrapper runs the independent idle float, so the
        // two animations layer instead of fighting.
        return (
          <motion.div
            key={i}
            style={baseStyle}
            initial={{
              x: `${s.sx - s.ox}%`,
              y: `${s.sy - s.oy}%`,
              opacity: 0,
              scale: 0.6,
            }}
            animate={{ x: "0%", y: "0%", opacity: 0.9, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 60,
              damping: 14,
              delay: s.settleDelay,
            }}
          >
            <motion.div
              className={s.className}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: radiusFor(s.kind),
              }}
              animate={{ y: [0, -s.floatY, 0] }}
              transition={{
                duration: s.floatDuration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2 + (i % 5) * 0.3,
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
