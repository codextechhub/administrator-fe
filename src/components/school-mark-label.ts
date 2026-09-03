/**
 * The rule for what the sidebar mark writes on its back face.
 *
 * Split from the component for the reason the repo splits every draft type out
 * of its drawer: a rule worth arguing about should be testable without pulling
 * a component tree in, and react-refresh only works when a file exports
 * components alone.
 */

/**
 * The longest name that still reads at 11px across two lines in the box.
 *
 * Past this the name is not shortened, it is REPLACED by the slug. Truncating
 * would be worse: "Government Comprehensive Secondar…" is a phrase cut in the
 * middle of a word, and it is not the school's name, and it is not shorter than
 * the thing the school already answers to. The slug is what is in their address
 * bar every day - `holy-cross` - so it is short, exact, and already familiar.
 */
const NAME_LIMIT = 34;

/**
 * What to write on the back of the mark.
 *
 * Exported for its test: the rule is a judgement about a real range of school
 * names, and it should be possible to argue with it by reading cases.
 */
export function markLabel(name?: string | null, slug?: string | null): string {
  const trimmed = (name ?? "").trim();
  const fallback = (slug ?? "").trim();
  if (!trimmed) return fallback;
  if (trimmed.length <= NAME_LIMIT) return trimmed;
  return fallback || trimmed;
}

/**
 * How big to set the name, given how much of it there is.
 *
 * A rule rather than a measurement, because measuring means rendering the text
 * once to read its width and then rendering it again - a flash of the wrong
 * size on every mark, to save a lookup with five entries in it.
 *
 * The numbers are for Great Vibes across the 200px back face. It is a narrow
 * copperplate, so it carries a much larger point size than a text face would at
 * the same width - which is the point, since the name is meant to be READ as it
 * is written rather than squinted at. Every band is measured against the real
 * face in a browser; see the check in the commit that set them.
 */
export function markFontSize(label: string): number {
  const n = label.trim().length;
  if (n <= 14) return 27;
  if (n <= 20) return 24;
  if (n <= 26) return 21;
  if (n <= 30) return 18;
  return 15;
}
