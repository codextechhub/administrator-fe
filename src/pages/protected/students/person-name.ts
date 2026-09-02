/**
 * Two letters from a name, stripped of the honorific it may carry.
 *
 * "Mrs. Patricia Okafor" gives PO, not MP. The honorific is the school's own
 * courtesy title rather than part of the name, and an avatar reading "MP" for
 * every married woman on the list is worse than no avatar at all.
 *
 * Its own module because both record headers and the person card use it, and a
 * component file that also exports a helper breaks fast refresh.
 */
export function personInitials(name: string) {
  const bare = name.replace(/^(Mr\.|Mrs\.|Miss|Ms\.|Dr\.|Alhaji|Chief)\s+/i, "");
  const parts = bare.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}
