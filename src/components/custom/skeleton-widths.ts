// Deterministic width cycle for loading ghosts. Real data has ragged cell
// widths, so uniform full-width bars read as a progress bar rather than as
// content. The cycle is keyed off the ghost's position — never Math.random(),
// which would make every re-render jitter and would break DOM assertions.
//
// Lives apart from skeletons.tsx so that file exports components only
// (react-refresh/only-export-components).

const GHOST_WIDTHS = [
  "w-4/5",
  "w-1/2",
  "w-11/12",
  "w-3/5",
  "w-2/3",
  "w-2/5",
  "w-5/6",
  "w-3/4",
] as const;

/** Width class for the ghost at `index` in the deterministic cycle. */
export function ghostWidth(index: number): string {
  const len = GHOST_WIDTHS.length;
  return GHOST_WIDTHS[((index % len) + len) % len];
}
