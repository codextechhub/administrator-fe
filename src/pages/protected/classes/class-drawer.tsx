import { useMemo, useState } from "react";
import { SearchSelect } from "@/components/custom/search-select";
import { Input } from "@/components/ui/input";
import { EntityDrawer } from "@/pages/protected/academics/components/entity-drawer";
import {
  blankDraft,
  classCode,
} from "@/pages/protected/academics/components/entity-draft";
import type {
  ClassWrite,
  Level,
  SchoolClass,
} from "@/redux/services/academics/academics-types";

// ─────────────────────────────────────────────────────────────────────────────
// One class: a level, an arm, and a name built from the two.
//
// The shared entity drawer with two extra controls, and one rule of its own:
// the name is composed from the level and the arm as they are chosen, until the
// person types a name themselves - after which their text is left alone. The
// same distinction the code field makes, for the same reason: a value WE
// derived should keep following what it was derived from, and a value they
// typed is an answer.
// ─────────────────────────────────────────────────────────────────────────────

export function ClassDrawer({
  open,
  editing,
  levels,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: SchoolClass | null;
  /** Only the levels visible in the current branch can be picked. */
  levels: Level[];
  saving: boolean;
  onClose: () => void;
  onSave: (body: ClassWrite) => Promise<unknown>;
}) {
  const [level, setLevel] = useState<number | null>(editing?.level ?? null);
  const [arm, setArm] = useState(editing?.arm ?? "");
  const [capacity, setCapacity] = useState(
    editing?.capacity != null ? String(editing.capacity) : "",
  );
  const [nameEdited, setNameEdited] = useState(!!editing);

  const key = open ? String(editing?.id ?? "new") : "shut";
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    if (open) {
      setLevel(editing?.level ?? levels[0]?.id ?? null);
      setArm(editing?.arm ?? "");
      setCapacity(editing?.capacity != null ? String(editing.capacity) : "");
      setNameEdited(!!editing);
    }
  }

  // Blank is a real answer meaning no limit, so it is sent as null rather than
  // omitted - otherwise clearing a capacity would leave the old one in place.
  const capacityValue = capacity.trim() === "" ? null : Number(capacity);
  const capacityIsSane =
    capacityValue === null
    || (Number.isInteger(capacityValue) && capacityValue > 0);

  const levelName = useMemo(
    () => levels.find((l) => l.id === level)?.name ?? "",
    [levels, level],
  );

  const composed = [levelName, arm.trim()].filter(Boolean).join(" ");

  // NOT the composed name: the drawer re-seeds whenever `initial` changes,
  // and a composed one changes on every keystroke. It goes as `derivedName`.
  const initial = editing
    ? {
        name: editing.name,
        code: editing.code,
        description: editing.description ?? "",
        branch: editing.branch ?? null,
      }
    : blankDraft(null);

  // A class must sit at a level, and a school with none in view cannot make one
  // here - so the drawer says where to go rather than offering an empty select.
  const noLevels = levels.length === 0;


  return (
    <EntityDrawer
      open={open}
      editing={!!editing}
      saving={saving}
      initial={initial}
      extraBody={{
        level: level ?? undefined,
        arm: arm.trim(),
        capacity: capacityValue,
      }}
      extrasValid={!noLevels && level != null && capacityIsSane}
      copy={{
        title: editing ? `Edit ${editing.name}` : "Add class",
        subtitle: "Pick a level and an arm, and the name is built for you.",
        nameLabel: "Class name",
        namePlaceholder: "e.g. JSS1 A",
        codePlaceholder: "e.g. JSS1-A",
        scopeHint: "A class is normally run by the branch it sits in.",
      }}
      onClose={onClose}
      onSave={onSave}
      onNameEdited={() => setNameEdited(true)}
      derivedName={nameEdited ? undefined : composed}
      // From the NAME, so a hand-typed one gets a matching code. See
      // classCode for why first-three-letters cannot serve a class.
      deriveCode={(name) => classCode(name, arm)}
      // ABOVE the name, because these two build it: JSS1 plus arm A makes
      // JSS1 A, and the code follows.
      leading={
        <div className="mb-5 grid gap-4 border-b border-border pb-5">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-gray-06">
              Level *
            </label>
            {noLevels ? (
              <p className="rounded-lg border border-border bg-white-05 px-3 py-2.5 text-sm text-gray-05 text-pretty">
                There are no levels in view. Add one on the Programmes &amp;
                Levels screen first, or widen the branch filter.
              </p>
            ) : (
              // A school runs sixteen levels or more; typing "JSS" beats
              // scrolling past Nursery and Primary to reach it.
              <SearchSelect
                aria-label="Level"
                placeholder="Search levels"
                value={level ? String(level) : ""}
                onChange={(e) =>
                  setLevel(e.target.value ? Number(e.target.value) : null)
                }
                options={levels.map((l) => ({
                  value: String(l.id),
                  label: `${l.name} · ${l.program_name}`,
                }))}
              />
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-gray-06">
              Arm or stream
            </label>
            <Input
              value={arm}
              onChange={(e) => setArm(e.target.value)}
              placeholder="e.g. A"
            />
            <p className="mt-1 text-xs text-gray-05">
              Leave blank if this level has only one class. Names like Science or
              Commercial work too.
            </p>
          </div>

          {/* Asked rather than assumed. Nothing in this module enforces it -
              M11 checks it when it places a pupil - so a class created without
              one is a class with no limit, and the room built for thirty takes
              forty-two. Optional, because a school may genuinely not cap a
              class; what it must not be is a question nobody was asked. */}
          <div>
            <label
              htmlFor="class-capacity"
              className="mb-1.5 block text-[13px] font-medium text-gray-06"
            >
              Capacity
            </label>
            <Input
              id="class-capacity"
              type="number"
              min={1}
              inputMode="numeric"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="e.g. 30"
              aria-invalid={!capacityIsSane}
            />
            <p className="mt-1 text-xs text-gray-05">
              {capacityIsSane
                ? "How many pupils this class takes. Leave blank for no limit."
                : "Give a whole number above zero, or leave it blank for no limit."}
            </p>
          </div>
        </div>
      }
    />
  );
}
