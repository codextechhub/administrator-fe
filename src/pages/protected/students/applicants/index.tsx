import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import { routesPath } from "@/routes/routesPath";
import { useBranchLens } from "@/hooks/use-branch-lens";
import { apiDetailMessage } from "@/utils/api-error";
import {
  useConfirmApplicantMutation,
  useGetAdmissionPolicyQuery,
  useGetStudentsQuery,
  useRejectApplicantMutation,
} from "@/redux/services/students/students-api";
import type { StudentRow } from "@/redux/services/students/students-types";

import { ConfirmDialog } from "../drawers/confirm-dialog";
import { DrawerShell, Field, inputClass } from "../drawers/drawer-shell";
import { formatDate } from "../format";
import { statusChipClass } from "../status-chip";

/**
 * The front of the lifecycle: who has applied, and the two ends it can reach.
 *
 * Three groups, because they are three different questions. Waiting is a
 * decision to make. Recently enrolled is a job half done - the student is on
 * the roll and still has no class. Closed applications are kept because a
 * family that did not join is a thing a school looks up later, and closing an
 * application is not the same as withdrawing a student who was once here.
 */
export default function Applicants() {
  const navigate = useNavigate();
  const branchLens = useBranchLens();
  const branch =
    branchLens.applies && branchLens.branch !== "all"
      ? (branchLens.branch as number)
      : undefined;

  const [enrolling, setEnrolling] = useState<StudentRow | null>(null);
  const [rejecting, setRejecting] = useState<StudentRow | null>(null);

  const waiting = useGetStudentsQuery({ status: "APPLICANT", branch });
  // On the roll but not yet in a class - the design's "enrolled, not activated"
  // group, read from the state the backend actually keeps.
  const recent = useGetStudentsQuery({ status: "ENROLLED", branch });
  const closed = useGetStudentsQuery({ status: "REJECTED", branch });

  if (waiting.isError) {
    return (
      <PageShell>
        <OutlinedNotice
          icon={UserPlus}
          title="We could not load your applicants"
          body="Something went wrong on our side. Try again in a moment."
          actionLabel="Try again"
          onAction={() => waiting.refetch()}
        />
      </PageShell>
    );
  }

  const open = waiting.data?.pagination.totalItems ?? 0;

  return (
    <PageShell className="content-start gap-6" grid>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-05">
          {waiting.isLoading
            ? "Loading applications…"
            : open === 0
              ? "No applications are waiting."
              : `${open} ${open === 1 ? "application is" : "applications are"} waiting on a decision.`}
        </p>
        <Button
          onClick={() =>
            navigate(`${routesPath.PROTECTED.STUDENTS.ENROL}?applicant=1`)
          }
        >
          Add an applicant
        </Button>
      </div>

      <Group
        title="Waiting on a decision"
        loading={waiting.isLoading}
        rows={waiting.data?.data ?? []}
        empty="Nothing is waiting. New applications appear here."
        render={(s) => (
          <>
            <Button size="sm" onClick={() => setEnrolling(s)}>
              Put on the roll
            </Button>
            <Button size="sm" variant="outline" onClick={() => setRejecting(s)}>
              Close application
            </Button>
          </>
        )}
        onOpen={(id) => navigate(routesPath.PROTECTED.STUDENTS.PROFILE_ID(id))}
      />

      <Group
        title="On the roll, no class yet"
        subtitle="Enrolled, but nobody has placed them. They will not appear on a register until they have a class."
        loading={recent.isLoading}
        rows={(recent.data?.data ?? []).filter((s) => !s.class_name)}
        empty="Everyone who has been enrolled has a class."
        render={(s) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(routesPath.PROTECTED.STUDENTS.PROFILE_ID(s.id))}
          >
            Assign a class
          </Button>
        )}
        onOpen={(id) => navigate(routesPath.PROTECTED.STUDENTS.PROFILE_ID(id))}
      />

      <Group
        title="Closed applications"
        subtitle="Kept on purpose: a family that did not join is something a school looks up later."
        loading={closed.isLoading}
        rows={closed.data?.data ?? []}
        empty="No application has been closed."
        onOpen={(id) => navigate(routesPath.PROTECTED.STUDENTS.PROFILE_ID(id))}
      />

      {enrolling && (
        <ConfirmEnrolment
          student={enrolling}
          onClose={() => setEnrolling(null)}
        />
      )}
      {rejecting && (
        <CloseApplication
          student={rejecting}
          onClose={() => setRejecting(null)}
        />
      )}
    </PageShell>
  );
}

function Group({
  title,
  subtitle,
  rows,
  loading,
  empty,
  render,
  onOpen,
}: {
  title: string;
  subtitle?: string;
  rows: StudentRow[];
  loading?: boolean;
  empty: string;
  render?: (s: StudentRow) => React.ReactNode;
  onOpen: (id: number) => void;
}) {
  return (
    <section className="min-w-0">
      <h3 className="text-sm font-semibold text-black-01">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-gray-05">{subtitle}</p>}

      {loading ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-white-02 bg-white px-4 py-8 text-center text-sm text-gray-05">
          {empty}
        </p>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((s) => (
            <li
              key={s.id}
              className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-white-02 bg-white p-4"
            >
              <div className="flex min-w-0 items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpen(s.id)}
                  className="min-w-0 text-left"
                >
                  <p className="truncate text-sm font-semibold text-black-01 hover:text-primary">
                    {s.full_name}
                  </p>
                  <p className="truncate text-xs text-gray-05">
                    {s.level_name || "No level recorded"}
                  </p>
                </button>
                <span className={statusChipClass(s.status)}>{s.status_label}</span>
              </div>

              <p className="truncate text-xs text-gray-05">
                {s.primary_guardian || "No guardian linked"}
              </p>
              <p className="truncate text-xs text-gray-05">
                {s.enrolment_date ? formatDate(s.enrolment_date) : "No date recorded"}
              </p>

              {render && (
                <div className="mt-1 flex flex-wrap gap-2">{render(s)}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Put an applicant on the roll.
 *
 * It does not place them in a class, and the drawer says so. That is the model:
 * an enrolled student with no class is the "unassigned" state the whole module
 * tracks, and the placement is a separate move with its own reason and audit
 * line. Pretending otherwise here would mean inventing a seat.
 */
function ConfirmEnrolment({
  student,
  onClose,
}: {
  student: StudentRow;
  onClose: () => void;
}) {
  const { data: policyData } = useGetAdmissionPolicyQuery();
  const policy = policyData?.data;
  const [number, setNumber] = useState("");
  const [confirm, { isLoading }] = useConfirmApplicantMutation();

  const required = Boolean(policy?.required);
  const valid = !required || number.trim().length > 0;

  async function save() {
    try {
      await confirm({
        id: student.id,
        ...(number.trim() ? { student_number: number.trim() } : {}),
      }).unwrap();
      toast.success(`${student.full_name} is now enrolled.`);
      onClose();
    } catch (error) {
      toast.error(apiDetailMessage(error, "We could not enrol that applicant."));
    }
  }

  return (
    <DrawerShell
      open
      onClose={onClose}
      title="Put on the roll"
      subtitle={`${student.full_name} becomes an enrolled student.`}
      saveLabel="Enrol"
      onSave={save}
      canSave={valid}
      saving={isLoading}
    >
      <div className="grid gap-4">
        <Field
          label={required ? "Admission number" : "Admission number (optional)"}
          hint={
            policy?.hint ||
            (required
              ? undefined
              : "Leave blank to issue one later. The school has set no format.")
          }
        >
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className={inputClass}
          />
        </Field>

        <p className="rounded-lg bg-gray-04 px-3 py-2 text-xs text-gray-05">
          This puts {student.first_name} on the roll. It does not place them in a
          class - do that next, so the move carries its own reason and appears on
          their history.
        </p>
      </div>
    </DrawerShell>
  );
}

/** Close an application, which is not the same as withdrawing a student. */
function CloseApplication({
  student,
  onClose,
}: {
  student: StudentRow;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [reject, { isLoading }] = useRejectApplicantMutation();

  async function save() {
    try {
      await reject({ id: student.id, reason: reason.trim() }).unwrap();
      toast.success(`${student.full_name}'s application is closed.`);
      setConfirming(false);
      onClose();
    } catch (error) {
      setConfirming(false);
      toast.error(apiDetailMessage(error, "We could not close that application."));
    }
  }

  return (
    <>
      <DrawerShell
        open={!confirming}
        onClose={onClose}
        title="Close this application"
        subtitle={`${student.full_name} will not be enrolled.`}
        saveLabel="Continue"
        onSave={() => setConfirming(true)}
        canSave={reason.trim().length > 0}
        saving={isLoading}
        destructive
      >
        <div className="grid gap-4">
          <Field
            label="Reason"
            hint="Kept on the record so the school can see the decision later."
          >
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-white-02 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>
          <p className="rounded-lg bg-gray-04 px-3 py-2 text-xs text-gray-05">
            The record is kept. Closing an application is not withdrawing a
            student - {student.first_name} was never on the roll, and the school
            needs the two apart.
          </p>
        </div>
      </DrawerShell>

      <ConfirmDialog
        open={confirming}
        onCancel={() => setConfirming(false)}
        onConfirm={save}
        title={`Close ${student.full_name}'s application?`}
        body="The record is kept so the decision can be looked up later, but they will not be enrolled."
        confirmLabel="Close application"
        busy={isLoading}
      />
    </>
  );
}
