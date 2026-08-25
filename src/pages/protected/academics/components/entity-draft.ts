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
 * A class code, built from the class NAME and - when we know it - its arm.
 *
 * Classes cannot use `codeFromName`, and the reason is structural rather than
 * cosmetic: a class name STARTS with its level, so the first three letters are
 * always the parent programme's code - "SSS3 Science" generated "SSS", which is
 * Senior Secondary's own.
 *
 * The ARM is the split point, because it is the only part the level is not.
 * "SSS2 Science" with arm Science gives SSS2-SCIENCE; "Nursery 1" with no arm
 * gives NURSERY1, not NURSERY-1 - splitting on the last word would have read
 * that trailing "1" as an arm, which is exactly what a level number is not.
 *
 * Reading the NAME rather than the level field means a hand-typed name gets a
 * code that matches what the person actually wrote: renaming a class to "Alpha
 * Stream" answers ALPHASTREAM rather than a code built from a level no longer
 * visible anywhere in it.
 */
export function classCode(name: string, arm = ""): string {
  const clean = (v: string) => (v || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const full = (name || "").trim();
  if (!full) return "";

  const armPart = arm.trim();
  if (!armPart) return clean(full).slice(0, 12);

  // The name is composed as "<level> <arm>", so the level is what is left when
  // the arm is taken off the end. A name that no longer ends with the arm has
  // been typed over, and is used whole.
  const base = full.toLowerCase().endsWith(armPart.toLowerCase())
    ? full.slice(0, full.length - armPart.length)
    : full;
  const cleanArm = clean(armPart);
  if (!clean(base)) return cleanArm.slice(0, 12);

  // Both give way, in the order that keeps the code readable. The LEVEL is
  // abbreviated only as far as ten characters, because it is what a person
  // scans for; the ARM takes whatever is left, which is why "SSS2 Commercial"
  // reads SSS2-COMMERC and not S-COMMERCIAL. Truncating the whole string
  // instead produced "ALPHASTREAM-", with the one part that tells two classes
  // apart falling off the end.
  const cleanBase = clean(base).slice(0, 10);
  return `${cleanBase}-${cleanArm.slice(0, 12 - cleanBase.length - 1)}`;
}
