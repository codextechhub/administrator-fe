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
