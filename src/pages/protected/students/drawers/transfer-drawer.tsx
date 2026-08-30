import { useState } from "react";
import { toast } from "sonner";

import { NativeSelect } from "@/components/ui/native-select";
import { apiErrorMessage } from "@/utils/api-error";
import { useGetClassesQuery } from "@/redux/services/academics/academics-api";
import {
  useAssignClassMutation,
  useGetClassRosterQuery,
} from "@/redux/services/students/students-api";
import {
  TRANSFER_REASONS,
  type StudentDetail,
} from "@/redux/services/students/students-types";

import { DrawerShell, Field, inputClass } from "./drawer-shell";

function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Move a student into a class, or between two.
 *
 * One route for both. Whether this is an assignment or a transfer depends on
 * whether the student already had a class, which the server knows - encoding it
 * again here would be a second opinion that can differ.
 *
 * **The seat count is fetched for the class the user picks, not for all of
 * them.** There is no endpoint returning seats for every class at once (the
 * phase 2 backend ask), and firing one roster request per option to label a
 * dropdown would cost a request per class on every open. The design only shows
 * the destination's seats after a selection anyway, so nothing is lost.
 *
 * **Over capacity is an acknowledgement, not a preference.** The first save
 * sends `allow_over_capacity: false`; the server refuses, and only then does
 * the screen say so and offer to go ahead. A screen that pre-ticked it would be
 * answering a question the server asked the registrar.
 */
export function TransferDrawer({
  student,
  open,
  onClose,
}: {
  student: StudentDetail;
  open: boolean;
  onClose: () => void;
}) {
  const [destination, setDestination] = useState("");
  const [reason, setReason] = useState("");
  const [effective, setEffective] = useState(today());
  const [override, setOverride] = useState(false);

  const { data: classesData } = useGetClassesQuery();
  const classes = (classesData?.data ?? []).filter(
    (c) => c.name !== student.class_name,
  );

  const destinationId = Number(destination) || 0;
  const { data: rosterData, isFetching: seatsLoading } = useGetClassRosterQuery(
    destinationId,
    { skip: !destinationId },
  );
  const used = rosterData?.seats_used;
  const capacity = rosterData?.capacity ?? null;
  const wouldOverfill =
    used != null && capacity != null && used + 1 > capacity;

  const [assign, { isLoading }] = useAssignClassMutation();
  const valid = destinationId > 0 && Boolean(effective);

  function reset() {
    setDestination("");
    setReason("");
    setEffective(today());
    setOverride(false);
  }

  async function save() {
    if (!valid) return;
    try {
      await assign({
        id: student.id,
        school_class: destinationId,
        ...(reason ? { reason } : {}),
        effective_date: effective,
        allow_over_capacity: override,
      }).unwrap();
      toast.success(
        `${student.full_name} moved to ${rosterData?.class_name ?? "the new class"}.`,
      );
      reset();
      onClose();
    } catch (error) {
      const message = apiErrorMessage(error, "We could not move that student.");
      // The server refuses an over-capacity placement until it is acknowledged.
      // Rather than translating its refusal into our own guess, offer the
      // acknowledgement and let the next attempt carry it.
      if (/capacit/i.test(message) && !override) {
        setOverride(true);
        toast.warning(`${message} Save again to go ahead anyway.`);
        return;
      }
      toast.error(message);
    }
  }

  return (
    <DrawerShell
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={student.class_name ? "Transfer class" : "Assign a class"}
      subtitle={`${student.full_name} · ${student.class_name || "no class yet"}`}
      saveLabel={override ? "Move anyway" : "Move student"}
      onSave={save}
      canSave={valid}
      saving={isLoading}
      destructive={override}
    >
      <div className="grid gap-4">
        <Field label="Destination class">
          <NativeSelect
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value);
              setOverride(false);
            }}
            className="h-9"
          >
            <option value="">Select a class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </Field>

        {destinationId > 0 && (
          <p className="rounded-lg bg-gray-04 px-3 py-2 text-xs text-gray-05">
            {seatsLoading
              ? "Checking seats…"
              : capacity == null
                ? `${used ?? 0} students. This class has no capacity set.`
                : `${used} of ${capacity} seats used.`}
          </p>
        )}

        {wouldOverfill && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            That class is at capacity. Moving {student.first_name} in will put it
            over. You can still do it.
          </p>
        )}

        <Field
          label="Reason"
          hint="Optional, and kept on the student's history with your name."
        >
          <NativeSelect
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-9"
          >
            <option value="">Not given</option>
            {TRANSFER_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field label="Effective from">
          <input
            type="date"
            value={effective}
            onChange={(e) => setEffective(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
    </DrawerShell>
  );
}
