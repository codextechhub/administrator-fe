import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/page-shell";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { routesPath } from "@/routes/routesPath";
import {
  useGetStudentClassHistoryQuery,
  useGetStudentDocumentsQuery,
  useGetStudentGuardiansQuery,
  useGetStudentHistoryQuery,
  useGetStudentQuery,
  useGetStudentSubjectsQuery,
} from "@/redux/services/students/students-api";
import type {
  StudentDetail,
  StudentStatus,
} from "@/redux/services/students/students-types";

import { StudentDrawers, type DrawerRequest } from "../drawers";
import { formatDate, formatDateTime, titleCaseCode } from "../format";
import { statusChipClass } from "../status-chip";
import { Lifecycle } from "./lifecycle";
import { EmptyRing } from "../empty-ring";
import { Rows, type Row } from "./rows";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "guardians", label: "Guardians" },
  { key: "academic", label: "Academic" },
  { key: "medical", label: "Medical" },
  { key: "documents", label: "Documents" },
  { key: "history", label: "History" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/**
 * One student's record. Read-only in this phase.
 *
 * **Each tab fetches only when it is opened.** Six endpoints behind six tabs,
 * and a registrar opening a profile to check a phone number should not pull an
 * audit trail, a document checklist and a subject list to do it.
 *
 * Actions - Edit, Change status, Transfer, Link guardian - arrive with the
 * drawer bundle in phase 2. The header deliberately shows none of them yet
 * rather than showing buttons that do nothing.
 */
export default function StudentProfile() {
  const { id } = useParams();
  const studentId = Number(id);
  const [tab, setTab] = useState<TabKey>("overview");
  const [drawer, setDrawer] = useState<DrawerRequest | null>(null);

  const { data, isLoading, isError, refetch } = useGetStudentQuery(studentId, {
    skip: !Number.isFinite(studentId),
  });
  const student = data?.data;

  if (isError) {
    return (
      <PageShell>
        <OutlinedNotice
          icon={UserRound}
          title="We could not load this student"
          body="The record may have been removed, or something went wrong on our side."
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="content-start gap-5" grid>
      <header className="rounded-lg bg-white px-6 py-5.5">
        {isLoading || !student ? (
          <div className="grid gap-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-start gap-4.5">
              {/* The face of the record. A profile that opens with a line of
                  text reads like a row that happened to fill the page; the
                  avatar is what makes it a person's record. */}
              <span
                aria-hidden
                className="grid size-18 shrink-0 place-content-center rounded-full bg-white-03 text-2xl font-semibold text-primary"
              >
                {initials(student.full_name)}
              </span>

              <div className="min-w-55 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-[22px] font-semibold text-black-01">
                    {student.full_name}
                  </h2>
                  <span className={statusChipClass(student.status)}>
                    {student.status_label}
                  </span>
                </div>
                {/* Dot-separated rather than comma'd: these are four unrelated
                    facts, not a sentence, and the dots stop them reading as
                    one run-on line. */}
                <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-[13px]">
                  <span
                    className={
                      student.student_number ? "text-gray-01" : "text-gray-02"
                    }
                  >
                    {student.student_number || "No admission number"}
                  </span>
                  <Dot />
                  <span
                    className={
                      student.class_name ? "text-gray-01" : "text-amber-700"
                    }
                  >
                    {student.class_name || "Unassigned"}
                  </span>
                  {student.level_name && (
                    <>
                      <Dot />
                      <span className="text-gray-05">{student.level_name}</span>
                    </>
                  )}
                  {student.session_name && (
                    <>
                      <Dot />
                      <span className="text-gray-05">
                        {student.session_name}
                      </span>
                    </>
                  )}
                  {/* Absent at a single-branch school, not null - so this
                      renders nothing there rather than an empty slot. */}
                  {student.branch_name && (
                    <>
                      <Dot />
                      <span className="text-gray-05">
                        {student.branch_name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Lifecycle status={student.status} />

            {/* Wraps rather than scrolls: four actions on a phone belong on two
                rows, not behind a sideways drag. */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDrawer({ kind: "edit", studentId: student.id })}
              >
                Edit record
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDrawer({ kind: "status", studentId: student.id })}
              >
                Change status
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDrawer({ kind: "transfer", studentId: student.id })}
              >
                {student.class_name ? "Transfer class" : "Assign a class"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDrawer({ kind: "guardian", studentId: student.id })}
              >
                Link a guardian
              </Button>
            </div>
          </>
        )}
      </header>

      {/* A segmented control on its own surface, not pills floating on the
          page. Six tabs sitting loose read as six links; sitting in a tray
          they read as one control with one of them chosen. Scrolls sideways
          below `sm` rather than wrapping to two rows, because a tab strip that
          reflows moves the tab under the reader's finger. */}
      <div
        role="tablist"
        aria-label="Student record sections"
        className="flex max-w-full gap-1 overflow-x-auto rounded-lg bg-white p-1.5"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "h-9 shrink-0 whitespace-nowrap rounded-md px-3.5 text-[13.5px]",
              tab === t.key
                ? "bg-white-03 font-semibold text-primary"
                : "text-gray-06 hover:bg-gray-03",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview loading={isLoading} student={student} />}
      {tab === "guardians" && <GuardiansTab studentId={studentId} />}
      {tab === "academic" && <AcademicTab studentId={studentId} student={student} />}
      {tab === "medical" && <MedicalTab loading={isLoading} student={student} />}
      {tab === "documents" && <DocumentsTab studentId={studentId} />}
      {tab === "history" && <HistoryTab studentId={studentId} />}

      <StudentDrawers request={drawer} onClose={() => setDrawer(null)} />
    </PageShell>
  );
}

// ── Overview ────────────────────────────────────────────────────────────────

function Overview({
  student,
  loading,
}: {
  student?: StudentDetail;
  loading?: boolean;
}) {
  if (loading || !student) return <PanelSkeleton />;

  const bio: Row[] = [
    { label: "Full name", value: student.full_name },
    {
      label: "Date of birth",
      value: student.date_of_birth
        ? `${formatDate(student.date_of_birth)}${student.age != null ? ` · ${student.age} years old` : ""}`
        : "-",
    },
    { label: "Gender", value: titleCaseCode(student.gender) || "-" },
    { label: "Nationality", value: student.nationality || "-" },
    { label: "State of origin", value: student.state_of_origin || "-" },
  ];
  const contact: Row[] = [
    { label: "Home address", value: student.address || "-" },
    { label: "Student phone", value: student.phone || "Not recorded" },
    { label: "Student email", value: student.email || "Not recorded" },
  ];
  const admission: Row[] = [
    { label: "Admission number", value: student.student_number || "Not issued" },
    { label: "Admission date", value: formatDate(student.enrolment_date) },
    { label: "Session", value: student.session_name || "-" },
    ...(student.branch_name
      ? [{ label: "Branch", value: student.branch_name }]
      : []),
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Biography">
        <Rows rows={bio} />
      </Panel>
      <Panel title="Contact">
        <Rows rows={contact} />
      </Panel>
      <Panel title="Admission">
        <Rows rows={admission} />
      </Panel>
    </div>
  );
}

// ── Guardians ───────────────────────────────────────────────────────────────

function GuardiansTab({ studentId }: { studentId: number }) {
  const navigate = useNavigate();
  const { data, isLoading } = useGetStudentGuardiansQuery(studentId);
  const links = data?.data ?? [];

  if (isLoading) return <PanelSkeleton />;
  if (links.length === 0) {
    return (
      <EmptyRing>No guardian linked</EmptyRing>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {links.map((link) => (
        <Panel
          key={link.id}
          title={link.guardian.full_name}
          badge={link.is_primary ? "Primary contact" : undefined}
        >
          <Rows
            rows={[
              { label: "Relationship", value: link.relationship_label },
              { label: "Phone", value: link.guardian.phone || "Not recorded" },
              { label: "Email", value: link.guardian.email || "Not recorded" },
              {
                label: "Occupation",
                value: link.guardian.occupation || "Not recorded",
              },
            ]}
          />
          <div className="mt-3 border-t border-white-02 pt-3">
            {link.siblings.length > 0 && (
              <p className="text-xs text-gray-05">
                Also guardian of{" "}
                {/* Each sibling is a link. A registrar reading "also guardian
                    of Tobi (JSS1 A)" is one click from Tobi, and making them
                    search for a name they can already see is the kind of
                    friction that ends in the wrong Tobi. */}
                {link.siblings.map((sib, i) => (
                  <span key={sib.id}>
                    {i > 0 && ", "}
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          routesPath.PROTECTED.STUDENTS.PROFILE_ID(sib.id),
                        )
                      }
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      {sib.name}
                    </button>
                    {sib.class ? ` (${sib.class})` : ""}
                  </span>
                ))}
              </p>
            )}
            <button
              type="button"
              onClick={() =>
                navigate(
                  routesPath.PROTECTED.STUDENTS.GUARDIAN_DETAILS_ID(
                    link.guardian.id,
                  ),
                )
              }
              className="mt-2 text-xs text-primary underline-offset-2 hover:underline"
            >
              Open {link.guardian.full_name}
            </button>
          </div>
        </Panel>
      ))}
    </div>
  );
}

// ── Academic ────────────────────────────────────────────────────────────────

function AcademicTab({
  studentId,
  student,
}: {
  studentId: number;
  student?: StudentDetail;
}) {
  const { data: subjectsData, isLoading: subjectsLoading } =
    useGetStudentSubjectsQuery(studentId);
  const { data: trailData, isLoading: trailLoading } =
    useGetStudentClassHistoryQuery(studentId);

  const subjects = subjectsData?.data ?? [];
  const trail = trailData?.data ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Placement">
        <Rows
          rows={[
            { label: "Current class", value: student?.class_name || "Unassigned" },
            { label: "Level", value: student?.level_name || "-" },
            { label: "Session", value: student?.session_name || "-" },
          ]}
        />
      </Panel>

      <Panel
        title="Class history"
        note="The promotion trail across sessions."
      >
        {trailLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : trail.length === 0 ? (
          <p className="text-sm text-gray-05">
            No class history yet. It fills in as the student is placed and
            promoted.
          </p>
        ) : (
          <ul className="grid gap-2">
            {trail.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
              >
                <span className="text-black-01">{t.class_name}</span>
                <span className="text-xs text-gray-05">
                  {t.session_name}
                  {/* A null end date is the current placement, not missing
                      data - so it says so rather than showing a blank. */}
                  {t.ended_at ? "" : " · current"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Subjects" className="lg:col-span-2">
        {subjectsLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : subjects.length === 0 ? (
          <p className="text-sm text-gray-05">
            {student?.class_name
              ? "No subjects are recorded against this level yet."
              : "Assign a class to see the subjects this student takes."}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <li
                key={s.id}
                className="rounded-full bg-gray-04 px-2.5 py-1 text-xs text-black-01"
              >
                {s.name}
                {s.is_core && (
                  <span className="ml-1.5 text-gray-05">core</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

// ── Medical ─────────────────────────────────────────────────────────────────

function MedicalTab({
  student,
  loading,
}: {
  student?: StudentDetail;
  loading?: boolean;
}) {
  if (loading || !student) return <PanelSkeleton />;

  // These five are gated on school.students.view_sensitive. The server drops
  // them entirely for a caller without it, so `undefined` means "not allowed to
  // see" while "" means "nothing recorded" - two different sentences, and
  // collapsing them would tell a nurse a child has no allergies when the truth
  // is that she is not cleared to know.
  const permitted = student.blood_group !== undefined;
  if (!permitted) {
    return (
      <Empty>
        Medical details are restricted. You do not hold the permission that
        allows reading them.
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Medical">
        <Rows
          rows={[
            { label: "Blood group", value: student.blood_group || "Not recorded" },
            { label: "Allergies", value: student.allergies || "Not recorded" },
            { label: "Conditions", value: student.conditions || "Not recorded" },
          ]}
        />
      </Panel>
      <Panel title="Emergency contact">
        <Rows
          rows={[
            { label: "Name", value: student.emergency_contact_name || "Not recorded" },
            { label: "Phone", value: student.emergency_contact_phone || "Not recorded" },
          ]}
        />
      </Panel>
    </div>
  );
}

// ── Documents ───────────────────────────────────────────────────────────────

function DocumentsTab({ studentId }: { studentId: number }) {
  const { data, isLoading } = useGetStudentDocumentsQuery(studentId);
  const docs = data?.data ?? [];

  if (isLoading) return <PanelSkeleton />;

  return (
    <Panel title="Documents">
      <ul className="grid gap-2.5">
        {docs.map((d) => (
          <li
            key={d.document_type}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-white-02 pb-2.5 last:border-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-black-01">{d.label}</p>
              <p className="text-xs text-gray-05">
                {d.required ? "Required" : "Optional"}
              </p>
            </div>
            {d.attached ? (
              <a
                href={d.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary underline-offset-2 hover:underline"
              >
                View
              </a>
            ) : (
              <span
                className={`text-xs ${d.required ? "text-amber-700" : "text-gray-05"}`}
              >
                Not on file
              </span>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ── History ─────────────────────────────────────────────────────────────────

const DOT: Record<string, string> = {
  status: "bg-primary",
  class: "bg-green-700",
  guardian: "bg-amber-600",
  document: "bg-gray-400",
  edit: "bg-gray-400",
};

function HistoryTab({ studentId }: { studentId: number }) {
  const { data, isLoading } = useGetStudentHistoryQuery(studentId);
  const entries = data?.data ?? [];

  if (isLoading) return <PanelSkeleton />;
  if (entries.length === 0) {
    return <Empty>Nothing has happened to this record yet.</Empty>;
  }

  return (
    <Panel title={`${entries.length} ${entries.length === 1 ? "entry" : "entries"}, newest first`}>
      <ul className="grid gap-3">
        {entries.map((e, i) => (
          <li key={`${e.when}-${i}`} className="flex min-w-0 gap-2.5">
            <span
              aria-hidden
              className={`mt-1.5 size-2 shrink-0 rounded-full ${DOT[e.kind] ?? "bg-gray-400"}`}
            />
            <div className="min-w-0">
              <p className="text-sm text-black-01">{e.text}</p>
              <p className="text-xs text-gray-05">
                {formatDateTime(e.when)} · {e.actor}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ── Shared furniture ────────────────────────────────────────────────────────

function Panel({
  title,
  badge,
  note,
  className,
  children,
}: {
  title: string;
  badge?: string;
  /** A line under the heading, for a panel whose subject needs explaining. */
  note?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-lg bg-white px-5.5 py-5",
        className,
      )}
    >
      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-black-01">{title}</h3>
        {badge && (
          <span className="rounded-full bg-white-03 px-2 py-0.5 text-xs text-primary">
            {badge}
          </span>
        )}
        {note && (
          <span className="w-full text-xs text-gray-05">{note}</span>
        )}
      </div>
      {children}
    </section>
  );
}

/** The 3px separator the design puts between the header's facts. */
function Dot() {
  return (
    <span aria-hidden className="size-[3px] shrink-0 rounded-full bg-gray-02" />
  );
}

/** Two letters from the name, for the header avatar. */
function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

function PanelSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg bg-white px-4 py-10 text-center text-sm text-gray-05">
      {children}
    </p>
  );
}


export type { StudentStatus };
