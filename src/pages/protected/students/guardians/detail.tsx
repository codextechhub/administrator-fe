import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import { routesPath } from "@/routes/routesPath";
import { useGetGuardianQuery } from "@/redux/services/students/students-api";
import { RELATIONSHIPS } from "@/redux/services/students/students-types";

import { statusChipClass } from "../status-chip";
import { LinkChildDrawer } from "../drawers/link-child-drawer";

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
 * Editing a guardian's own details is not here. That belongs with the record
 * they were created from, and putting it in two places is how a phone number
 * ends up correct on one screen and stale on the other.
 */
export default function GuardianDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const guardianId = Number(id);
  const [linking, setLinking] = useState(false);

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
      <header className="rounded-xl border border-white-02 bg-white p-4">
        {isLoading || !guardian ? (
          <div className="grid gap-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-black-01">
                {guardian.full_name}
              </h2>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-05">
                <span>{guardian.phone || "No phone recorded"}</span>
                {guardian.email && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="break-all">{guardian.email}</span>
                  </>
                )}
                {guardian.occupation && (
                  <>
                    <span aria-hidden>·</span>
                    <span>{guardian.occupation}</span>
                  </>
                )}
              </p>
              {guardian.address && (
                <p className="mt-1 text-xs text-gray-05">{guardian.address}</p>
              )}
            </div>
            <Button size="sm" onClick={() => setLinking(true)}>
              Link another child
            </Button>
          </div>
        )}
      </header>

      <section className="min-w-0 rounded-xl border border-white-02 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="text-xs font-medium text-gray-05">
            {wards.length === 1
              ? "One student at this school"
              : `${wards.length} students at this school`}
          </h3>
          {wards.length > 1 && (
            <span className="rounded-full bg-white-03 px-2 py-0.5 text-xs text-primary">
              Siblings
            </span>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : wards.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-05">
            Nobody is linked to this guardian yet.
          </p>
        ) : (
          <>
            {wards.length > 1 && (
              <p className="mb-3 text-xs text-gray-05">
                These students are siblings as far as the school is concerned:
                one guardian, one household, one point of contact.
              </p>
            )}
            <ul className="grid gap-2.5">
              {wards.map((w) => (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(routesPath.PROTECTED.STUDENTS.PROFILE_ID(w.id))
                    }
                    className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-white-02 bg-white p-3 text-left hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-black-01">
                        {w.name}
                      </p>
                      <p className="truncate text-xs text-gray-05">
                        {w.student_number || "No admission number"} ·{" "}
                        <span
                          className={w.class_name ? undefined : "text-amber-700"}
                        >
                          {w.class_name || "Unassigned"}
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      <span className="text-xs text-gray-05">
                        {relationshipLabel(w.relationship)}
                      </span>
                      {w.is_primary && (
                        <span className="rounded-full bg-white-03 px-2 py-0.5 text-xs text-primary">
                          Primary contact
                        </span>
                      )}
                      <span className={statusChipClass(w.status)}>
                        {w.status_label}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

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
