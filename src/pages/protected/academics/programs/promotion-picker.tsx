import type { Level } from "@/redux/services/academics/academics-types";

/** The three answers, as one control. */
export type Promotion =
  | { kind: "unset" }
  | { kind: "terminal" }
  | { kind: "promotes"; to: number };

const UNSET = "unset";
const TERMINAL = "terminal";

/**
 * Read a level's saved promotion back into the control's value.
 *
 * From `promotion`, the single word the server computes, rather than from
 * next_level and is_terminal together - combining them here is the mistake the
 * server field exists to stop anyone making.
 */
export function promotionOf(level: Level | null): Promotion {
  if (!level) return { kind: "unset" };
  if (level.promotion === "promotes" && level.next_level != null) {
    return { kind: "promotes", to: level.next_level };
  }
  return level.promotion === "terminal" ? { kind: "terminal" } : { kind: "unset" };
}

/** What the drawer sends. Only ever one of the two, never both. */
export function promotionBody(value: Promotion) {
  if (value.kind === "promotes") {
    return { next_level: value.to, is_terminal: false };
  }
  return { next_level: null, is_terminal: value.kind === "terminal" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Where a level's pupils go at the end of the year.
//
// One control for three answers, because the third one used to be invisible: a
// level with no target was either the end of the school or a level nobody had
// wired, and the two were the same empty value. A school that wires half its
// chain and is interrupted then graduates every unwired year group at once.
//
// So "Not set yet" is an option a reader can see sitting there, rather than the
// absence of one.
// ─────────────────────────────────────────────────────────────────────────────

export function PromotionPicker({
  value,
  onChange,
  /** The other levels of this programme, in order. */
  siblings,
  /** Omitted when adding, since a new level has no id to exclude. */
  editingId,
}: {
  value: Promotion;
  onChange: (next: Promotion) => void;
  siblings: Level[];
  editingId?: number;
}) {
  const options = siblings.filter((l) => l.id !== editingId);
  const selected =
    value.kind === "promotes" ? String(value.to) : value.kind;

  return (
    <div className="mt-4">
      <label
        htmlFor="level-promotion"
        className="mb-1.5 block text-[13px] font-medium text-gray-06"
      >
        Promotes to
      </label>
      <select
        id="level-promotion"
        value={selected}
        onChange={(e) => {
          const next = e.target.value;
          if (next === UNSET) return onChange({ kind: "unset" });
          if (next === TERMINAL) return onChange({ kind: "terminal" });
          onChange({ kind: "promotes", to: Number(next) });
        }}
        className="w-full rounded-lg border border-white-02 px-3 py-2.5 text-sm outline-none focus:border-primary"
      >
        <option value={UNSET}>Not set yet</option>
        {options.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
        <option value={TERMINAL}>Pupils leave the school</option>
      </select>
      <p className="mt-1 text-xs text-gray-05 text-pretty">
        {value.kind === "unset"
          ? "Say where this level's pupils go at the end of the year. Left unset, they cannot be promoted."
          : value.kind === "terminal"
            ? "This is the last level. Its pupils finish here rather than moving up."
            : "Pupils move into this level when the year ends."}
      </p>
    </div>
  );
}
