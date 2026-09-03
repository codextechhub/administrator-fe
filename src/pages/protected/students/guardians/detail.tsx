import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import PermissionGate from "@/components/custom/permission-gate";
import { Panel } from "@/components/custom/surface";
import { P } from "@/permissions";
import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import { routesPath } from "@/routes/routesPath";
import { useGetGuardianQuery } from "@/redux/services/students/students-api";
import { RELATIONSHIPS } from "@/redux/services/students/students-types";

import { StudentStatusBadge } from "../status-badge";
import { EmptyRing } from "../empty-ring";
import { LinkChildDrawer } from "../drawers/link-child-drawer";
import { EditGuardianDrawer } from "./edit-guardian-drawer";
import { Dot, FooterLead, PersonCard, SiblingsPill } from "./person-card";
import { personInitials } from "../person-name";

function relationshipLabel(code: string) {
  return RELATIONSHIPS.find((r) => r.value === code)?.label ?? code;
}

/**
 * One guardian, and every child they stand for.
 *
 * **The wards are the page.** A guardian's own details are four lines and a
 * phone number; what a registrar came here for is "who does calling this person
 * reach", and at a school where one parent has three children that is the whole
 * answer to a question no other screen asks.
 *
 * **Editing is here, and until recently it was nowhere.** An earlier version of
 * this comment claimed a guardian's details "belong with the record they were
 * created from" - which was not true and never had been: the create path was
 * the only writer, so a number mistyped while enrolling a child was permanent.
 * The comment rationalised a missing endpoint as a design decision, which is
 * worse than the gap, because it reads as settled.
 *
 * What is genuinely not here is the RELATIONSHIP and the primary-contact
 * marker. Those belong to a link, one per student, so a guardian standing for
 * three children has three of them - and a single control on this page would
 * be a question with three answers. They stay on each student's Guardians tab.
 */
export default function GuardianDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const guardianId = Number(id);
  const [linking, setLinking] = useState(false);
  const [editing, setEditing] = useState(false);

  const { data, isLoading, isError, refetch } = useGetGuardianQuery(guardianId, {
    skip: !Number.isFinite(guardianId),
  });
  const guardian = data?.data;

  if (isError) {
    return (
      <PageShell>
        <OutlinedNotice
          icon={UserRound}
          title="We could not load this guardian"
          body="The record may have been removed, or something went wrong on our side."
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      </PageShell>
    );
  }

  const wards = guardian?.wards ?? [];

  return (
    <PageShell className="content-start gap-5" grid>
      <Panel className="px-6 py-5.5">
        {isLoading || !guardian ? (
          <div className="grid gap-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
        ) : (
          <div className="flex flex-wrap items-start gap-4.5">
            {/* Same avatar the profile uses, one size down. A guardian is a
                person's record too, and giving one a face while the other
                opens with a line of text makes them read as different kinds
                of thing. */}
            <span
              aria-hidden
              className="grid size-16 shrink-0 place-content-center rounded-full bg-white-03 text-[21px] font-semibold text-primary"
            >
              {personInitials(guardian.full_name)}
            </span>

            <div className="min-w-55 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-[21px] font-semibold text-black-01">
                  {guardian.full_name}
                </h2>
                {wards.length > 1 && <SiblingsPill />}
              </div>
              <p className="mt-1.5 text-[13px] text-gray-05">
                {wards.length === 1
                  ? "One student at this school"
                  : `${wards.length} students at this school`}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-[13px] text-gray-01">
                <span>{guardian.phone || "No phone recorded"}</span>
                {guardian.email && (
                  <>
                    <Dot />
                    <span className="break-all">{guardian.email}</span>
                  </>
                )}
                {guardian.occupation && (
                  <>
                    <Dot />
                    <span>{guardian.occupation}</span>
                  </>
                )}
              </div>
              {guardian.address && (
                <p className="mt-1.5 text-[13px] text-gray-05">
                  {guardian.address}
                </p>
              )}
            </div>

            {/* Both write, so both are gated on the key the backend checks -
                school.students.update, the same one that edits a student. */}
            <PermissionGate permission={P.MODIFY_STUDENT}>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button variant="outline" onClick={() => setEditing(true)}>
                  Edit details
                </Button>
                <Button onClick={() => setLinking(true)}>
                  Link another child
                </Button>
              </div>
            </PermissionGate>
          </div>
        )}
      </Panel>

      {/* The ward count is in the header now, so this says only what the
          header cannot: WHY the school treats these children as one household. */}
      {wards.length > 1 && (
        <p className="text-sm text-gray-01">
          These students are siblings as far as the school is concerned: one
          guardian, one household, one point of contact.
        </p>
      )}

      {isLoading ? (
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-[122px] rounded-[10px]" />
          ))}
        </div>
      ) : wards.length === 0 ? (
        <EmptyRing>No students linked yet</EmptyRing>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {wards.map((w) => (
            <PersonCard
              key={w.id}
              name={w.name}
              sub={w.student_number || "No admission number"}
              chip={
                <StudentStatusBadge status={w.status} label={w.status_label} />
              }
              footerLead={
                <FooterLead tone={w.class_name ? "primary" : "warn"}>
                  {w.class_name || "Unassigned"}
                </FooterLead>
              }
              footerRest={
                <>
                  {relationshipLabel(w.relationship)}
                  {w.is_primary && (
                    <span className="ml-2 text-primary">Primary contact</span>
                  )}
                </>
              }
              onOpen={() =>
                navigate(routesPath.PROTECTED.STUDENTS.PROFILE_ID(w.id))
              }
            />
          ))}
        </div>
      )}

      {guardian && editing && (
        <EditGuardianDrawer
          // Keyed on the ID ALONE, and mounted only while open.
          //
          // The key used to include the name and phone, which are exactly the
          // values a save changes - so a successful save invalidated the query,
          // the refetched guardian arrived with a new key, and the drawer
          // unmounted and remounted while its own request was still in flight.
          // The save then reported "We could not save that" over a change that
          // had already been written.
          key={guardian.id}
          guardian={guardian}
          open={editing}
          onClose={() => setEditing(false)}
        />
      )}

      {guardian && (
        <LinkChildDrawer
          guardianId={guardian.id}
          guardianName={guardian.full_name}
          linkedStudentIds={wards.map((w) => w.id)}
          open={linking}
          onClose={() => setLinking(false)}
        />
      )}
    </PageShell>
  );
}
