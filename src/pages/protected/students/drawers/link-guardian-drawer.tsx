import { useState } from "react";
import { toast } from "sonner";

import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { apiDetailMessage } from "@/utils/api-error";
import {
  useGetGuardiansQuery,
  useGetStudentGuardiansQuery,
  useLinkGuardianMutation,
} from "@/redux/services/students/students-api";
import {
  RELATIONSHIPS,
  type StudentDetail,
} from "@/redux/services/students/students-types";

import { DrawerShell, Field, inputClass } from "./drawer-shell";

/**
 * Link a guardian to a student.
 *
 * **Search first, create second, and that order is the point.** A guardian
 * belongs to the school, not to a child: typing a new record for a parent who
 * already has one at this school splits a household in two, and the Guardians
 * screen then shows one parent twice with a child each instead of one parent
 * with two children. So the search tab opens by default and says what a match
 * already stands for before it is picked.
 *
 * **A student has exactly one primary contact.** Marking a new link primary
 * MOVES the marker rather than adding a second, which the note says out loud
 * before the save rather than after it.
 */
export function LinkGuardianDrawer({
  student,
  open,
  onClose,
}: {
  student: StudentDetail;
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"search" | "new">("search");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const [relationship, setRelationship] = useState("");
  const [primary, setPrimary] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const query = search.trim();
  const { data: matchesData, isFetching } = useGetGuardiansQuery(
    { search: query },
    // One character is a keystroke, not a search.
    { skip: query.length < 2 },
  );
  const matches = (matchesData?.data ?? []).slice(0, 6);

  const { data: existingData } = useGetStudentGuardiansQuery(student.id);
  const existing = existingData?.data ?? [];
  const alreadyLinked = new Set(existing.map((l) => l.guardian.id));
  const hasPrimary = existing.some((l) => l.is_primary);

  const [link, { isLoading }] = useLinkGuardianMutation();

  const valid =
    mode === "search"
      ? picked != null && !alreadyLinked.has(picked) && Boolean(relationship)
      : name.trim().length > 0 && phone.trim().length > 0 && Boolean(relationship);

  function reset() {
    setMode("search");
    setSearch("");
    setPicked(null);
    setRelationship("");
    setPrimary(false);
    setName("");
    setPhone("");
    setEmail("");
  }

  async function save() {
    if (!valid) return;
    try {
      await link({
        id: student.id,
        relationship,
        is_primary: primary,
        ...(mode === "search"
          ? { guardian_id: picked as number }
          : {
              full_name: name.trim(),
              phone: phone.trim(),
              ...(email.trim() ? { email: email.trim() } : {}),
            }),
      }).unwrap();
      toast.success("Guardian linked.");
      reset();
      onClose();
    } catch (error) {
      toast.error(apiDetailMessage(error, "We could not link that guardian."));
    }
  }

  return (
    <DrawerShell
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Link a guardian"
      subtitle={`To ${student.full_name}.`}
      saveLabel="Link guardian"
      onSave={save}
      canSave={valid}
      saving={isLoading}
    >
      <div className="mb-4 inline-flex rounded-full border border-white-02 bg-white p-0.5">
        {(["search", "new"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setPicked(null);
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm",
              mode === m ? "bg-white-03 font-semibold text-primary" : "text-gray-05",
            )}
          >
            {m === "search" ? "Find an existing guardian" : "Add a new one"}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {mode === "search" ? (
          <>
            <Field
              label="Search the school's guardians"
              hint="Check here first: a parent already at this school should be reused, not typed again."
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Guardian's name"
                className={inputClass}
              />
            </Field>

            {query.length >= 2 && (
              <div className="grid gap-1.5">
                {isFetching ? (
                  <p className="text-xs text-gray-05">Searching…</p>
                ) : matches.length === 0 ? (
                  <p className="text-xs text-gray-05">
                    Nobody at this school matches "{query}". Use "Add a new one".
                  </p>
                ) : (
                  matches.map((g) => {
                    const linked = alreadyLinked.has(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        disabled={linked}
                        onClick={() => setPicked(g.id)}
                        className={cn(
                          "min-w-0 rounded-lg border px-3 py-2 text-left",
                          linked
                            ? "cursor-not-allowed border-white-02 bg-gray-04 opacity-70"
                            : picked === g.id
                              ? "border-primary bg-white-03"
                              : "border-white-02 bg-white hover:border-primary/40",
                        )}
                      >
                        <p className="truncate text-sm text-black-01">
                          {g.full_name}
                        </p>
                        <p className="truncate text-xs text-gray-05">
                          {linked
                            ? "Already linked to this student"
                            : g.ward_count > 0
                              ? `${g.phone} · already guardian of ${g.ward_count} ${g.ward_count === 1 ? "student" : "students"}`
                              : `${g.phone} · no students yet`}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <Field label="Full name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field
              label="Phone"
              hint="A guardian needs a number the school can reach."
            >
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Email (optional)">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </Field>
          </>
        )}

        <Field label="Relationship">
          <NativeSelect
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
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

        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={primary}
            onChange={(e) => setPrimary(e.target.checked)}
            className="mt-0.5 size-4"
          />
          <span className="min-w-0 text-sm text-black-01">
            Primary contact
            <span className="mt-0.5 block text-xs text-gray-05">
              {hasPrimary
                ? "A student has exactly one. Marking this one primary moves the marker off the current contact."
                : "This student has no primary contact yet, so this guardian becomes it."}
            </span>
          </span>
        </label>
      </div>
    </DrawerShell>
  );
}
