import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Search, Users } from "lucide-react";

import CustomTable from "@/components/custom/custom-table";
import { PageShell } from "@/components/layout/page-shell";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import { routesPath } from "@/routes/routesPath";
import { useGetGuardiansQuery } from "@/redux/services/students/students-api";
import type { GuardianRow } from "@/redux/services/students/students-types";

/**
 * The people the school calls.
 *
 * **A household, not a contact list.** The row that matters is the one standing
 * for more than one child: those students are siblings as far as the school is
 * concerned, and that fact lives nowhere else in the product. So the ward count
 * and the children's names are the row, not a detail behind it - a registrar
 * scanning for "who else does this reach" should not have to open anything.
 *
 * Search is the only filter, deliberately. A guardian has no status, no class
 * and no branch of their own; the one question asked of this screen is "is
 * this person already here", and that is a search box.
 */
export default function Guardians() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, refetch } = useGetGuardiansQuery({
    search: search.trim() || undefined,
    page,
  });

  const rows = useMemo(() => data?.data ?? [], [data]);
  const pagination = data?.pagination;

  if (isError) {
    return (
      <PageShell>
        <OutlinedNotice
          icon={Users}
          title="We could not load your guardians"
          body="Something went wrong on our side. Try again in a moment."
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="content-start gap-5" grid>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-0 flex-1 basis-52">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-05" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, phone or email"
            aria-label="Search guardians"
            className="h-9 w-full rounded-full border border-white-02 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        {pagination && !isLoading && (
          <p className="text-xs text-gray-05" aria-live="polite">
            {pagination.totalItems}{" "}
            {pagination.totalItems === 1 ? "guardian" : "guardians"}
          </p>
        )}
      </div>

      <CustomTable
        tableHeaderList={["Guardian", "Phone", "Email", "Students"]}
        loading={isLoading || isFetching}
        defaultBodyList={rows}
        tableBodyList={rows.map((g) => ({
          Guardian: g.full_name,
          Phone: g.phone || "Not recorded",
          Email: g.email || "Not recorded",
          // The names, not just the count. "3 students" makes a registrar open
          // the row to answer a question the row could have answered.
          Students: (
            <span className="block min-w-0">
              <span className="block truncate">
                {g.ward_names.length > 0
                  ? g.ward_names.join(", ")
                  : "No students linked"}
              </span>
              {g.is_sibling_household && (
                <span className="mt-0.5 block text-xs text-primary">
                  Siblings · {g.ward_count} students
                </span>
              )}
            </span>
          ),
        }))}
        onRowClick={(guardian: GuardianRow) => {
          if (guardian?.id) {
            navigate(
              routesPath.PROTECTED.STUDENTS.GUARDIAN_DETAILS_ID(guardian.id),
            );
          }
        }}
        currentPage={pagination?.currentPage ?? 1}
        totalPage={pagination?.totalPages ?? 1}
        onPageChange={(next) => setPage(Number(next) || 1)}
        emptyText={
          search.trim()
            ? `Nobody matches "${search.trim()}"`
            : "No guardians yet. They are created as students are enrolled."
        }
      />
    </PageShell>
  );
}
