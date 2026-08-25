import { Building2, CalendarRange, Check, ChevronDown, Lock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useBranchLens } from "@/hooks/use-branch-lens";
import { useSessionLens } from "@/hooks/use-session-lens";

// ─────────────────────────────────────────────────────────────────────────────
// The two lenses, and the read-only notice that follows from one of them.
//
// They sit in a strip UNDER the header rather than in it. The header's centre is
// taken by the search box, which is absolutely positioned and centred on the bar
// itself - so anything added to the right-hand cluster grows leftwards until it
// runs underneath it. A strip also means a phone gets the lens instead of having
// it hidden, which matters more here than saving 40px: a branch admin on a phone
// is exactly the reader who needs to know which branch they are looking at.
//
// Both RECEDE rather than grey out. A single-branch school gets no branch pill;
// a school with no year yet gets no session pill. A control with one option, or
// with none, is a question the reader cannot answer and should not be asked.
// ─────────────────────────────────────────────────────────────────────────────

const pill =
  "inline-flex h-8.5 max-w-[11rem] items-center gap-1.5 rounded-full border " +
  "border-white-02 bg-white px-3 text-[13px] text-black-01 " +
  "hover:bg-gray-04 focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-primary/30";

export function BranchPill() {
  const { applies, isTied, branch, label, branches, setBranch } = useBranchLens();

  if (!applies) return null;

  // Tied to one branch: state it, do not offer it. The server would refuse a
  // wider read anyway, so a menu here would be a control that does nothing.
  if (isTied) {
    return (
      <span
        className={cn(pill, "cursor-default hover:bg-white")}
        title={`Your account is tied to ${label}`}
      >
        <Building2 className="size-3.5 shrink-0 text-gray-06" />
        <span className="min-w-0 truncate">{label}</span>
      </span>
    );
  }

  const options: { key: string; value: number | "all"; label: string }[] = [
    { key: "all", value: "all", label: "All branches" },
    ...branches.map((b) => ({ key: String(b.id), value: b.id, label: b.name })),
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Change branch" className={pill}>
          <Building2 className="size-3.5 shrink-0 text-gray-06" />
          <span className="min-w-0 truncate">{label}</span>
          <ChevronDown className="size-3.5 shrink-0 text-gray-06" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {options.map((o) => (
          <DropdownMenuItem
            key={o.key}
            onClick={() => setBranch(o.value)}
            className={cn(branch === o.value && "text-primary")}
          >
            <Check className={cn("size-4", branch !== o.value && "opacity-0")} />
            <span className="truncate">{o.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const STATUS_SUFFIX: Record<string, string> = {
  ACTIVE: "active",
  DRAFT: "draft",
  ARCHIVED: "archived",
};

export function SessionPill() {
  const { applies, sessions, current, label, setSession } = useSessionLens();

  if (!applies) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Change session" className={pill}>
          <CalendarRange className="size-3.5 shrink-0 text-gray-06" />
          <span className="min-w-0 truncate">{label}</span>
          <ChevronDown className="size-3.5 shrink-0 text-gray-06" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {sessions.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => setSession(s)}
            className={cn(current?.id === s.id && "text-primary")}
          >
            <Check className={cn("size-4", current?.id !== s.id && "opacity-0")} />
            <span className="truncate">
              {s.name}
              <span className="text-muted-foreground">
                {" · "}
                {STATUS_SUFFIX[s.status] ?? s.status.toLowerCase()}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


/**
 * The lens strip: which branch, which year, and whether the year can be edited.
 *
 * Renders nothing at all when neither lens applies - a single-branch school with
 * no sessions yet gets no empty bar.
 */
export function LensStrip() {
  const branch = useBranchLens();
  const session = useSessionLens();

  const archived = session.current?.status === "ARCHIVED";
  const activeName = session.sessions.find((s) => s.status === "ACTIVE")?.name;

  if (!branch.applies && !session.applies) return null;

  return (
    <div className="border-b border-white-02 bg-white-05">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 lg:px-5">
        <BranchPill />
        <SessionPill />

        {/* An archived year is read-only on the server too - every write answers
            SESSION_ARCHIVED_READ_ONLY - so this states the rule before somebody
            fills in a form that cannot be saved. */}
        {archived && (
          <p className="inline-flex min-w-0 items-center gap-1.5 text-xs text-gray-05">
            <Lock className="size-3.5 shrink-0" />
            <span className="min-w-0 text-pretty">
              <span className="font-medium text-black-01">Read-only.</span> You are
              viewing the archived {session.current?.name} session
              {activeName ? `. Switch to ${activeName} to make changes.` : "."}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
