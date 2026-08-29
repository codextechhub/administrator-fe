// The rule for what the sidebar mark writes on its back face.
//
// Split from the component for the reason the repo splits every draft type out
// of its drawer: a rule worth arguing about should be testable without pulling
// a component tree in, and react-refresh only works when a file exports
// components alone.

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
