import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Check, Info, ShieldAlert, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CustomTable from "@/components/custom/custom-table";
import { PageShell } from "@/components/layout/page-shell";
import Tabs from "@/components/custom/tab";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routesPath";
import {
  useDecideRoleChangeRequestMutation,
  useGetRoleChangeRequestsQuery,
  useGetSchoolRolesQuery,
} from "@/redux/services/roles/roles-api";
import { usePermissions } from "@/hooks/use-permissions";
import { apiErrorMessage } from "@/utils/api-error";
import type { RoleChangeRequest } from "@/redux/services/roles/roles-types";

/**
 * Role change requests, and deciding them.
 *
 * Why this screen has to exist: every permission that bills a family or moves
 * money is marked restricted, and the server refuses to grant one by editing a
 * role. It asks for a request instead. Without somewhere to see and decide
 * those, a school can create a Bursar and can never give it the power to raise
 * a single invoice - the request is accepted and then sits pending forever.
 *
 * A school may decide its own request. Two people deciding a grant is the
 * better arrangement and is not one most schools can staff: where the head
 * teacher who raised it is the only holder of the approve key, refusing her
 * produces no second approver, only a request nobody can close. The server
 * records self-approval under its own audit source, which is what makes
 * allowing it safe to look at later.
 */

const COLUMNS = ["Role", "Change", "Raised", "Status"];

const TABS = [
  { label: "Waiting on you", value: "PENDING" },
  { label: "Decided", value: "DECIDED" },
];

const STATUS_BADGE: Record<string, { variant: string; label: string }> = {
  PENDING: { variant: "amber", label: "Waiting" },
  APPROVED: { variant: "success", label: "Approved" },
  DENIED: { variant: "inactive", label: "Denied" },
  APPLY_FAILED: { variant: "destructive", label: "Failed to apply" },
};

export default function RoleChangeRequests() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const mayDecide = hasPermission(P.APPROVE_ROLE_CHANGE);

  const [tab, setTab] = useState("PENDING");
  const requests = useGetRoleChangeRequestsQuery(
    tab === "PENDING" ? { status: "PENDING" } : undefined,
  );
  // Requests name a role by id; the reader needs its name. One list serves
  // every row, rather than a lookup per row.
  const roles = useGetSchoolRolesQuery();
  const [decide, { isLoading: deciding }] = useDecideRoleChangeRequestMutation();

  const [openId, setOpenId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const roleName = useMemo(() => {
    const byId = new Map((roles.data?.data ?? []).map((r) => [r.id, r.name]));
    return (id: number) => byId.get(id) ?? `Role ${id}`;
  }, [roles.data]);

  const all = useMemo(() => requests.data?.data ?? [], [requests.data]);
  const rows = useMemo(
    () => (tab === "PENDING" ? all : all.filter((r) => r.status !== "PENDING")),
    [all, tab],
  );

  const send = async (request: RoleChangeRequest, action: "APPROVE" | "DENY") => {
    // The server requires a reason to deny and does not to approve. Saying so
    // here rather than letting the request come back 400.
    if (action === "DENY" && !notes.trim()) {
      toast.error("Say why you are turning this down, so the record explains itself.");
      return;
    }
    try {
      await decide({ id: request.id, action, notes: notes.trim() }).unwrap();
      toast.success(
        action === "APPROVE"
          ? `${roleName(request.target_role)} now has what was asked for.`
          : `Request on ${roleName(request.target_role)} turned down.`,
      );
      setOpenId(null);
      setNotes("");
    } catch (error) {
      toast.error(
        apiErrorMessage(error, "That decision did not go through. Try again."),
      );
    }
  };

  const rowFor = (request: RoleChangeRequest) => {
    const badge = STATUS_BADGE[request.status] ?? STATUS_BADGE.PENDING;
    const adds = request.delta_items.filter((d) => d.operation === "ADD").length;
    const removes = request.delta_items.length - adds;
    return {
      _id: request.id,
      role: (
        <span className="whitespace-nowrap font-semibold">
          {roleName(request.target_role)}
        </span>
      ),
      change: (
        <span className="whitespace-nowrap text-gray-01">
          {[
            adds > 0 ? `${adds} to add` : null,
            removes > 0 ? `${removes} to remove` : null,
          ]
            .filter(Boolean)
            .join(", ") || "Nothing"}
        </span>
      ),
      raised: (
        <span className="whitespace-nowrap text-gray-01">
          {new Date(request.submitted_at).toLocaleDateString()}
        </span>
      ),
      status: (
        <Badge variant={badge.variant as never} className="text-xs">
          {badge.label}
        </Badge>
      ),
    };
  };

  const open = all.find((r) => r.id === openId) ?? null;

  return (
    <PageShell className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 max-w-[60ch]">
          <h2 className="text-lg font-semibold font-mont text-black-01">
            Role Approvals
          </h2>
          <p className="mt-1 text-sm text-gray-01 text-pretty">
            Permissions that need a second look before they take effect: raising
            bills, taking payment, and anything else that touches money.
          </p>
        </div>
        <Button
          variant="outline"
          className="shrink-0"
          onClick={() => navigate(routesPath.PROTECTED.ROLES.INDEX)}
        >
          <ArrowLeft />
          Roles
        </Button>
      </div>

      <Tabs tabs={TABS} activeTab={tab} setActiveTab={setTab} />

      <CustomTable
        tableHeaderList={COLUMNS}
        tableBodyList={rows.map(rowFor)}
        loading={requests.isLoading}
        loadingText="Loading requests…"
        emptyText={
          tab === "PENDING"
            ? "Nothing is waiting on a decision."
            : "No request has been decided yet."
        }
        hidePagination
        onRowClick={(row) => {
          setOpenId((row as { _id: number })._id);
          setNotes("");
        }}
      />

      {open && (
        <section className="rounded-lg border border-gray-05/40 p-4 space-y-3.5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-black-01">
                {roleName(open.target_role)}
              </h3>
              <p className="mt-1 text-sm text-gray-01 text-pretty max-w-[70ch]">
                {open.justification || "No reason was given."}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpenId(null)}>
              <X />
            </Button>
          </div>

          <ul className="space-y-1.5">
            {open.delta_items.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm">
                <span
                  className={
                    item.operation === "ADD"
                      ? "font-semibold text-success-01"
                      : "font-semibold text-destructive"
                  }
                >
                  {item.operation === "ADD" ? "+" : "−"}
                </span>
                <span className="text-black-01">
                  {item.permission.description || item.permission.key}
                </span>
                {item.permission.sensitivity_level === "CRITICAL" && (
                  <Badge variant="amber" className="text-[11px]">
                    Critical
                  </Badge>
                )}
              </li>
            ))}
          </ul>

          {open.status === "PENDING" && mayDecide && (
            <>
              {/* Said plainly, because the person reading it is usually the
                  person who raised it: a school with one approver has no other
                  option, and the record will show that is what happened. */}
              <div className="flex items-start gap-2.5 rounded-lg bg-gray-05/5 px-3.5 py-3">
                <ShieldAlert className="size-4 shrink-0 mt-0.5 text-gray-01" />
                <p className="text-sm text-gray-01 text-pretty">
                  If you raised this request yourself you can still decide it,
                  and the record will say that you did.
                </p>
              </div>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Why you are approving or turning this down. Required to turn it down."
                rows={3}
              />
              <div className="flex items-center gap-2.5">
                <Button disabled={deciding} onClick={() => send(open, "APPROVE")}>
                  <Check />
                  Approve
                </Button>
                <Button
                  variant="outline-dest"
                  disabled={deciding}
                  onClick={() => send(open, "DENY")}
                >
                  <X />
                  Turn down
                </Button>
              </div>
            </>
          )}

          {open.status !== "PENDING" && (
            <p className="flex items-start gap-1.5 text-xs text-gray-05">
              <Info className="size-3.5 shrink-0 mt-px" />
              {open.reviewer_notes || "Decided with no note."}
            </p>
          )}
        </section>
      )}
    </PageShell>
  );
}
