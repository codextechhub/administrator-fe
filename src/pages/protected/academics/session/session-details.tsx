import { useState } from "react";
import { useParams } from "react-router";
import { CalendarRange, Lock, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import PermissionGate from "@/components/custom/permission-gate";
import { P } from "@/permissions";
import { cn, formatMonthYearShort } from "@/lib/utils";
import { useGetSessionQuery } from "@/redux/services/academics/academics-api";
import { Panel } from "@/components/custom/surface";
import { SessionDrawer } from "./session-drawer";
import { SessionStatusChip } from "./session-chips";
import { scopeOf, TERM_LABEL, TERM_TONE, termState } from "./session-format";

/**
 * One school year, and the terms inside it.
 *
 * The screen this already had, with the API behind it. Two changes worth
 * knowing about.
 *
 * **"Active branch" became "Applies to".** The old label was wrong in both
 * directions: the chips are not about the branch you are looking at, and a
 * session that names NO branch is not missing anything - it covers every branch
 * the school has, including any opened while it is running. So the row states
 * where the year applies, and says "The whole school" when that is the answer.
 *
 * **The per-term event lists are gone.** They belong to the Academic Calendar,
 * which is now its own module with its own design pass coming, and there is no
 * event model behind them yet. A term card that offered "Add event" would be a
 * button with nothing on the other side of it.
 */
export default function SessionDetails() {
  const { id } = useParams();
  const [editing, setEditing] = useState(false);

  const sessionId = Number(id);
  const { data, isLoading, isError, refetch } = useGetSessionQuery(sessionId, {
    skip: !Number.isFinite(sessionId),
  });
  const session = data?.data;

  if (isLoading) {
    return (
      <main className="grid grid-cols-1 gap-4 px-5 pt-3 pb-10">
        <Skeleton className="h-16 w-full rounded-md" />
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-md" />
          ))}
        </div>
      </main>
    );
  }

  if (isError || !session) {
    return (
      <main className="px-5 pt-3 pb-10">
        <OutlinedNotice
          icon={CalendarRange}
          title="We could not load this session"
          body="It may have been removed, or something went wrong on our side."
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      </main>
    );
  }

  const archived = session.status === "ARCHIVED";

  return (
    <main className="grid min-w-0 grid-cols-1 content-start px-5 pt-3 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="min-w-0 truncate font-mont text-xl font-medium text-black-01">
          {session.name} Academic Session
        </h4>

        <div className="inline-flex shrink-0 items-center gap-3">
          <SessionStatusChip status={session.status} className="text-sm" />
          {/* An archived year is read-only on the server - every write answers
              SESSION_ARCHIVED_READ_ONLY - so the button is absent rather than
              present and refused. */}
          {!archived && (
            <PermissionGate permission={P.MODIFY_SESSION}>
              <Button
                variant="outline"
                className="border-primary text-primary"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-4" />
                Edit session
              </Button>
            </PermissionGate>
          )}
        </div>
      </div>

      <p className="mt-1 text-sm text-gray-01">
        {formatMonthYearShort(session.start_date)} -{" "}
        {formatMonthYearShort(session.end_date)}
      </p>

      {archived && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-05">
          <Lock className="size-3.5 shrink-0" />
          <span className="text-pretty">
            This session is archived and cannot be changed. Make it the active
            session first if you need to edit it.
          </span>
        </p>
      )}

      {/* Dropped entirely at a single-branch school: the server strips the
          field, and "Applies to: The whole school" at a school with one site is
          a row that tells nobody anything. */}
      {session.scope_label && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <p className="text-nowrap text-gray-06">Applies to:</p>
          {session.branches?.length ? (
            session.branches.map((b) => (
              <Badge
                key={b.id}
                variant="teal"
                className="h-fit text-nowrap rounded-full py-0 text-sm"
              >
                {b.name}
              </Badge>
            ))
          ) : (
            <Badge
              variant="blue"
              className="h-fit text-nowrap rounded-full py-0 text-sm"
            >
              {scopeOf(session)}
            </Badge>
          )}
        </div>
      )}

      <div className="mt-6 grid items-start gap-4 xl:grid-cols-2">
        {session.terms.map((term) => {
          const state = termState(term);
          return (
            <Panel key={term.id} className="w-full px-4 py-3">
              <div className="flex items-center justify-between gap-5">
                <div className="min-w-0">
                  <p className="truncate font-medium text-black-01">{term.name}</p>
                  <p className="text-xs text-gray-06">
                    {formatMonthYearShort(term.start_date)} -{" "}
                    {formatMonthYearShort(term.end_date)}
                  </p>
                </div>
                <span
                  className={cn(
                    "h-fit shrink-0 rounded-full px-2.5 py-0.5 text-xs",
                    TERM_TONE[state],
                  )}
                >
                  {TERM_LABEL[state]}
                </span>
              </div>
            </Panel>
          );
        })}

        {!session.terms.length && (
          <p className="text-sm text-gray-05">
            This session has no terms yet. Edit it to add them.
          </p>
        )}
      </div>

      <SessionDrawer
        open={editing}
        session={session}
        onClose={() => setEditing(false)}
      />
    </main>
  );
}
