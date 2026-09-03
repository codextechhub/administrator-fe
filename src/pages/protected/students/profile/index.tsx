import { useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Camera, Loader2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/page-shell";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { routesPath } from "@/routes/routesPath";
import { writeErrorMessage } from "@/utils/api-error";
import { useLazyFetchAuthMediaQuery } from "@/redux/services/media-api";
import {
  useGetStudentClassHistoryQuery,
  useGetStudentDocumentsQuery,
  useGetStudentGuardiansQuery,
  useGetStudentHistoryQuery,
  useGetStudentQuery,
  useGetStudentSubjectsQuery,
  useUploadStudentDocumentMutation,
  useDeleteStudentDocumentMutation,
} from "@/redux/services/students/students-api";
import type {
  StudentDetail,
  StudentDocumentRow,
  StudentStatus,
} from "@/redux/services/students/students-types";

import { StudentDrawers, type DrawerRequest } from "../drawers";
import { ConfirmDialog } from "../drawers/confirm-dialog";
import { formatDate, formatDateTime, titleCaseCode } from "../format";
import PermissionGate from "@/components/custom/permission-gate";
import Tabs from "@/components/custom/tab";
import { P } from "@/permissions";
import { useStudentsLens } from "@/hooks/use-students-lens";
import { Panel as Surface } from "@/components/custom/surface";

import { PersonAvatar } from "../person-avatar";
import { StudentStatusBadge } from "../status-badge";
import { Dot } from "../guardians/person-card";
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
  // The tab lives in the URL, so a registrar can send a colleague the link to
  // a child's Guardians tab rather than "open him and click the third one".
  // Tabs owns the writing; this only reads.
  const [params] = useSearchParams();
  const { pastYear } = useStudentsLens();
  const tab = (params.get("tab") as TabKey) ?? "overview";
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
      <Surface as="section" className="px-6 py-5.5">
        {isLoading || !student ? (
          <div className="grid gap-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-start gap-4.5">
              <StudentPhoto student={student} />

              <div className="min-w-55 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-[22px] font-semibold text-black-01">
                    {student.full_name}
                  </h2>
                  <StudentStatusBadge status={student.status} label={student.status_label} />
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
                rows, not behind a sideways drag.
                
                Each is gated on the key the BACKEND checks for it, so a reader
                who cannot do the thing is not shown the button. All four were
                open: somebody holding only school.students.view saw every one,
                pressed it, filled in a drawer and was refused at Save. The
                app's own action-palette comment names that failure as the one
                to avoid, and PermissionGate has sixteen users elsewhere. */}
            <div className="mt-4 flex flex-wrap gap-2">
              <PermissionGate permission={P.MODIFY_STUDENT}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDrawer({ kind: "edit", studentId: student.id })}
                >
                  Edit record
                </Button>
              </PermissionGate>
              <PermissionGate permission={P.MANAGE_STUDENTS}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDrawer({ kind: "status", studentId: student.id })}
                >
                  Change status
                </Button>
              </PermissionGate>
              {/* Placement is academics' power, not students': the same key the
                  assign screen needs. And withheld under a past year whatever
                  the caller holds - the server refuses a placement into a year
                  that has closed, so the button could only ever fail. */}
              <PermissionGate permission={P.ASSIGN_CLASS} disabled={pastYear}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDrawer({ kind: "transfer", studentId: student.id })}
                >
                  {student.class_name ? "Transfer class" : "Assign a class"}
                </Button>
              </PermissionGate>
              <PermissionGate permission={P.MODIFY_STUDENT}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDrawer({ kind: "guardian", studentId: student.id })}
                >
                  Link a guardian
                </Button>
              </PermissionGate>
            </div>
          </>
        )}
      </Surface>

      <Tabs
        tabKey="tab"
        tabs={TABS.map((t) => ({ value: t.key, label: t.label }))}
      />

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

// ── The photograph ───────────────────────────────────────

/**
 * The face of the record, and the place a photograph is put on it.
 *
 * A profile that opens with a line of text reads like a row that happened to
 * fill the page; the avatar is what makes it a person's record.
 *
 * **The picker is on the picture.** Somebody looking for where a passport
 * photograph goes looks at the empty circle where the face should be, not at a
 * Documents tab two clicks away - so the circle is the control. It still writes
 * the same PASSPORT_PHOTO document the checklist lists, so there is one
 * photograph and not two, and replacing it from either place changes the other.
 */
function StudentPhoto({ student }: { student: StudentDetail }) {
  const input = useRef<HTMLInputElement>(null);
  const [upload, { isLoading }] = useUploadStudentDocumentMutation();

  async function choose(file: File | undefined) {
    if (!file) return;
    try {
      await upload({
        id: student.id, documentType: "PASSPORT_PHOTO", file,
      }).unwrap();
      toast.success("Photograph saved.");
    } catch (error) {
      toast.error(writeErrorMessage(error, "We could not save that photograph."));
    }
  }

  return (
    <div className="relative shrink-0">
      <PersonAvatar
        name={student.full_name}
        photoUrl={student.photo_url}
        className="size-18"
        textClassName="text-2xl"
      />
      <PermissionGate permission={P.MODIFY_STUDENT}>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void choose(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={isLoading}
          onClick={() => input.current?.click()}
          aria-label={
            student.photo_url
              ? `Replace ${student.full_name}'s photograph`
              : `Add a photograph for ${student.full_name}`
          }
          title={student.photo_url ? "Replace photograph" : "Add a photograph"}
          className={cn(
            "absolute -right-0.5 -bottom-0.5 grid size-7 place-items-center",
            "rounded-full border border-white-02 bg-white text-gray-06 shadow-sm",
            "transition-colors hover:text-primary disabled:opacity-60",
          )}
        >
          {isLoading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Camera className="size-3.5" />
          )}
        </button>
      </PermissionGate>
    </div>
  );
}

// ── Documents ───────────────────────────────────────────────────────────────

function DocumentsTab({ studentId }: { studentId: number }) {
  const { data, isLoading } = useGetStudentDocumentsQuery(studentId);
  const docs = data?.data ?? [];

  if (isLoading) return <PanelSkeleton />;

  return (
    <Panel
      title="Documents"
      note="The passport photograph is also the picture shown beside this student everywhere in the app."
    >
      <ul className="grid gap-2.5">
        {docs.map((d) => (
          <DocumentRow key={d.document_type} studentId={studentId} doc={d} />
        ))}
      </ul>
    </Panel>
  );
}

/**
 * Open an attached document.
 *
 * **A plain link could never have worked.** MediaView is behind the JWT, and a
 * new tab opened from an <a href> sends no Authorization header - so "View" on
 * a birth certificate answered 401 for as long as the tab has existed. The
 * signature on the url binds it to one reader; it is not what authenticates
 * the read.
 *
 * So the bytes are fetched with the token and opened as a local blob. Same
 * route the school crest and the student's own photograph take.
 */
function ViewDocument({ url, label }: { url: string; label: string }) {
  const [fetchMedia, { isFetching }] = useLazyFetchAuthMediaQuery();

  async function open() {
    // The tab is opened ON THE CLICK, before the await. A window opened from an
    // async continuation has lost the user gesture and the browser blocks it as
    // a popup - which is silent: nothing opens and nothing says why.
    //
    // No "noopener" here on purpose: with it window.open returns null by spec
    // and there would be no handle to point at the bytes. The opener is cleared
    // by hand instead.
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    try {
      const blobUrl = await fetchMedia(url).unwrap();
      if (tab) {
        tab.location.href = blobUrl;
        return;
      }
      // Popups blocked. Save it instead of navigating this page away from a
      // record the reader is in the middle of.
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = label;
      link.click();
    } catch {
      tab?.close();
      toast.error(`We could not open the ${label.toLowerCase()}.`);
    }
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={isFetching}
      className="text-xs text-primary underline-offset-2 hover:underline disabled:opacity-60"
    >
      {isFetching ? "Opening…" : "View"}
    </button>
  );
}

/**
 * One checklist row, and the control that was missing from all of them.
 *
 * **Nothing on any screen could attach a document.** The checklist has asked
 * for a birth certificate and a passport photograph since the module shipped,
 * the route to send one has existed just as long, and no page ever offered a
 * file picker - so both required rows read "Not on file" for ever, and the
 * passport photograph that gives a student their face could not be supplied at
 * all. The upload lives here, on the list that names what is wanted, rather
 * than on a separate screen that would have to repeat it.
 */
function DocumentRow({
  studentId,
  doc,
}: {
  studentId: number;
  doc: StudentDocumentRow;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [upload, { isLoading: uploading }] = useUploadStudentDocumentMutation();
  const [remove, { isLoading: removing }] = useDeleteStudentDocumentMutation();
  const [confirming, setConfirming] = useState(false);
  const busy = uploading || removing;

  // The photograph is rendered in an <img>, so the picker offers images only -
  // the backend refuses anything else, and a refusal after the upload is a
  // worse way to learn it than a picker that never shows the PDF.
  const isPhoto = doc.document_type === "PASSPORT_PHOTO";

  async function choose(file: File | undefined) {
    if (!file) return;
    try {
      await upload({ id: studentId, documentType: doc.document_type, file }).unwrap();
      toast.success(`${doc.label} attached.`);
    } catch (error) {
      toast.error(writeErrorMessage(error, "We could not attach that file."));
    }
  }

  async function drop() {
    if (doc.id == null) return;
    try {
      await remove({ id: studentId, docId: doc.id }).unwrap();
      toast.success(`${doc.label} removed.`);
      setConfirming(false);
    } catch (error) {
      toast.error(writeErrorMessage(error, "We could not remove that file."));
    }
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b border-white-02 pb-2.5 last:border-0 last:pb-0">
      <div className="min-w-0">
        <p className="truncate text-sm text-black-01">{doc.label}</p>
        {/* The state is said ONCE. It used to be here and again on the right,
            so every row read "Required - not on file … Not on file". */}
        <p
          className={cn(
            "text-xs",
            !doc.attached && doc.required ? "text-amber-700" : "text-gray-05",
          )}
        >
          {doc.attached
            ? doc.required
              ? "Required · on file"
              : "On file"
            : doc.required
              ? "Required · not on file"
              : "Optional · not on file"}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        {doc.attached && <ViewDocument url={doc.url} label={doc.label} />}

        <PermissionGate permission={P.MODIFY_STUDENT}>
          <input
            ref={input}
            type="file"
            accept={isPhoto ? "image/*" : undefined}
            className="hidden"
            onChange={(e) => {
              void choose(e.target.files?.[0]);
              // Cleared so picking the SAME file again still fires a change -
              // which is exactly what retrying a failed upload looks like.
              e.target.value = "";
            }}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            {uploading ? "Uploading…" : doc.attached ? "Replace" : "Upload"}
          </Button>
          {doc.attached && (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => setConfirming(true)}
              className="text-error-text hover:text-error-text"
            >
              {removing ? "Removing…" : "Remove"}
            </Button>
          )}
          {/* Asked, because the bytes do not come back. Deleting the row
              retires the stored file, so a misclick beside "Replace" loses a
              birth certificate the family may not be able to produce twice. */}
          <ConfirmDialog
            open={confirming}
            onCancel={() => setConfirming(false)}
            onConfirm={drop}
            title={`Remove this ${doc.label.toLowerCase()}?`}
            body={
              doc.required
                ? `The file is deleted and cannot be recovered, and ${doc.label.toLowerCase()} is one this school requires - the record will show it as missing until a new one is uploaded.`
                : "The file is deleted and cannot be recovered. A new one can be uploaded at any time."
            }
            confirmLabel="Remove"
            busy={removing}
          />
        </PermissionGate>
      </div>
    </li>
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
    // The app's surface, not a ninth hand-written one. This wrapper stays
    // because it also owns the heading, the badge and the note - what it no
    // longer owns is what a white box looks like.
    <Surface as="section" className={cn("px-5.5 py-5", className)}>
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
    </Surface>
  );
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
    <Surface className="px-4 py-10 text-center text-sm text-gray-05">
      {children}
    </Surface>
  );
}


export type { StudentStatus };
