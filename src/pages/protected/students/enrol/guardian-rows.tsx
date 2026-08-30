import { Trash2 } from "lucide-react";

import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGetGuardiansQuery } from "@/redux/services/students/students-api";
import { RELATIONSHIPS } from "@/redux/services/students/students-types";

import { Field, inputClass } from "../drawers/drawer-shell";

/** A row on the form: either a guardian already at the school, or a new one. */
export interface GuardianDraft {
  kind: "existing" | "new";
  guardianId?: number;
  guardianName?: string;
  guardianMeta?: string;
  full_name: string;
  phone: string;
  email: string;
  relationship: string;
  is_primary: boolean;
}

/**
 * The guardians section of the enrolment form.
 *
 * **Search before create, and the search result says what it already stands
 * for.** A guardian belongs to the school, not to a child. Typing a fresh
 * record for a parent who already has one splits a household: the Guardians
 * screen then shows the same parent twice with one child each, and the sibling
 * link the screen exists to show is gone. So the picker leads with "already
 * guardian of 2 students" - the sentence that stops the second record being
 * created.
 *
 * **Exactly one primary contact.** Ticking one row unticks the others here
 * rather than letting the server sort it out, because a form that lets you tick
 * two and then rejects the save has taught you nothing about the rule.
 */
export function GuardianRows({
  rows,
  onChange,
  error,
}: {
  rows: GuardianDraft[];
  onChange: (rows: GuardianDraft[]) => void;
  error?: string;
}) {
  function patch(index: number, next: Partial<GuardianDraft>) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...next } : r)));
  }

  function setPrimary(index: number) {
    onChange(rows.map((r, i) => ({ ...r, is_primary: i === index })));
  }

  function remove(index: number) {
    const left = rows.filter((_, i) => i !== index);
    // Removing the primary must not leave the student without one.
    if (left.length && !left.some((r) => r.is_primary)) left[0].is_primary = true;
    onChange(left);
  }

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-black-01">Guardians</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange([
                ...rows,
                {
                  kind: "existing",
                  full_name: "",
                  phone: "",
                  email: "",
                  relationship: "",
                  is_primary: rows.length === 0,
                },
              ])
            }
          >
            Find an existing guardian
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange([
                ...rows,
                {
                  kind: "new",
                  full_name: "",
                  phone: "",
                  email: "",
                  relationship: "",
                  is_primary: rows.length === 0,
                },
              ])
            }
          >
            Add a new one
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p
          className={cn(
            "rounded-lg border border-dashed px-3 py-6 text-center text-sm",
            error
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-white-02 bg-white text-gray-05",
          )}
        >
          {error ??
            "No guardian linked yet. Every student needs at least one, and exactly one primary contact."}
        </p>
      ) : (
        <ul className="grid gap-3">
          {rows.map((row, index) => (
            <li
              key={index}
              className="grid gap-3 rounded-xl border border-white-02 bg-white p-3.5"
            >
              {row.kind === "existing" ? (
                <ExistingPicker
                  row={row}
                  takenIds={rows
                    .filter((r, i) => i !== index && r.guardianId)
                    .map((r) => r.guardianId as number)}
                  onPatch={(next) => patch(index, next)}
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Full name">
                    <input
                      value={row.full_name}
                      onChange={(e) => patch(index, { full_name: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field
                    label="Phone"
                    hint="A number the school can reach."
                  >
                    <input
                      value={row.phone}
                      onChange={(e) => patch(index, { phone: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Email (optional)">
                    <input
                      type="email"
                      value={row.email}
                      onChange={(e) => patch(index, { email: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Relationship">
                  <NativeSelect
                    value={row.relationship}
                    onChange={(e) => patch(index, { relationship: e.target.value })}
                    className="h-9"
                  >
                    <option value="">Select a relationship</option>
                    {RELATIONSHIPS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>

                <div className="flex items-end justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm text-black-01">
                    <input
                      type="radio"
                      name="primary-contact"
                      checked={row.is_primary}
                      onChange={() => setPrimary(index)}
                      className="size-4"
                    />
                    Primary contact
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label="Remove this guardian"
                    onClick={() => remove(index)}
                    className="text-gray-05 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && rows.length > 0 && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </section>
  );
}

/**
 * Pick a guardian who is already at this school.
 *
 * The search text lives in `full_name` on the row, so the same field is the
 * query before a pick and the typed name after switching to "add a new one" -
 * one place, and no way for the two to disagree. Typing again clears the pick,
 * so the row can never show one guardian's name while carrying another's id.
 */
function ExistingPicker({
  row,
  takenIds,
  onPatch,
}: {
  row: GuardianDraft;
  takenIds: number[];
  onPatch: (next: Partial<GuardianDraft>) => void;
}) {
  const query = row.guardianId ? "" : row.full_name.trim();
  const { data, isFetching } = useGetGuardiansQuery(
    { search: query },
    { skip: query.length < 2 },
  );
  const matches = (data?.data ?? []).slice(0, 5);

  const wardLine = (g: { phone: string; ward_count: number }) =>
    g.ward_count > 0
      ? `${g.phone} · already guardian of ${g.ward_count} ${g.ward_count === 1 ? "student" : "students"}`
      : `${g.phone} · no students yet`;

  if (row.guardianId) {
    return (
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-black-01">
            {row.guardianName}
          </p>
          <p className="truncate text-xs text-gray-05">{row.guardianMeta}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() =>
            onPatch({
              guardianId: undefined,
              guardianName: "",
              guardianMeta: "",
              full_name: "",
            })
          }
        >
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Field
        label="Search the school's guardians"
        hint="A parent already here should be reused, not typed again - that is what keeps siblings together."
      >
        <input
          value={row.full_name}
          onChange={(e) => onPatch({ full_name: e.target.value })}
          placeholder="Guardian's name"
          className={inputClass}
        />
      </Field>
      {query.length >= 2 &&
        (isFetching ? (
          <p className="text-xs text-gray-05">Searching…</p>
        ) : matches.length === 0 ? (
          <p className="text-xs text-gray-05">
            Nobody here matches "{query}". Use "Add a new one" instead.
          </p>
        ) : (
          matches.map((g) => {
            const taken = takenIds.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                disabled={taken}
                onClick={() =>
                  onPatch({
                    guardianId: g.id,
                    guardianName: g.full_name,
                    guardianMeta: wardLine(g),
                  })
                }
                className={cn(
                  "min-w-0 rounded-lg border px-3 py-2 text-left",
                  taken
                    ? "cursor-not-allowed border-white-02 bg-gray-04 opacity-70"
                    : "border-white-02 bg-white hover:border-primary/40",
                )}
              >
                <p className="truncate text-sm text-black-01">{g.full_name}</p>
                <p className="truncate text-xs text-gray-05">
                  {taken ? "Already added to this form" : wardLine(g)}
                </p>
              </button>
            );
          })
        ))}
    </div>
  );
}
