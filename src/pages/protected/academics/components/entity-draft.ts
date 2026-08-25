// The entity drawer's data, apart from the drawer itself.
//
// Split out because a module that exports both components and plain functions
// breaks Fast Refresh for everything importing it - the same reason
// session-format.ts sits beside session-chips.tsx.

export interface EntityDraft {
  name: string;
  code: string;
  description: string;
  /** Null is school-wide, and is a first-class answer, never "not set". */
  branch: number | null;
}

export interface EntityCopy {
  /** "Add department" / "Edit Sciences". */
  title: string;
  /** One line under it. */
  subtitle: string;
  nameLabel: string;
  namePlaceholder: string;
  codePlaceholder: string;
  /** Sits under the scope control: how this KIND is usually scoped. */
  scopeHint: string;
}

export function blankDraft(branch: number | null = null): EntityDraft {
  return { name: "", code: "", description: "", branch };
}

/**
 * A code from a name: the first three letters, as the server does it.
 *
 * Kept in step with `generate_code` in services/structure.py deliberately. The
 * server generates one anyway when the field is left empty; this is so the
 * Generate button shows the person what they are about to save rather than
 * making them save to find out.
 */
export function codeFromName(name: string): string {
  return (name || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 3);
}

/**
 * A class code, built from the class NAME.
 *
 * Classes cannot use `codeFromName`, and the reason is structural rather than
 * cosmetic: a class name STARTS with its level, so the first three letters are
 * always the parent programme's code - "SSS3 Science" generated "SSS", which is
 * Senior Secondary's own.
 *
 * So the name is split instead: everything but the last word is the level, the
 * last word is the arm, and they are joined with a hyphen. "JSS1 A" gives
 * JSS1-A, "Primary 4 B" gives PRIMARY4-B, and a level with no arm gives just
 * the level. Reading the NAME rather than the level and arm fields means a
 * hand-typed name gets a code that matches what the person actually wrote -
 * deriving from the fields would have answered JSS1-A to somebody who had
 * renamed the class to "Alpha Stream".
 */
export function classCode(name: string): string {
  const clean = (v: string) => (v || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return clean(words[0]).slice(0, 12);
  const arm = clean(words[words.length - 1]);
  const base = clean(words.slice(0, -1).join(""));
  return (arm ? `${base}-${arm}` : base).slice(0, 12);
}
