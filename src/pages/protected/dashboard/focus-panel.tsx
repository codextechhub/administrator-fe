import { useEffect, useReducer, useState } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  ChevronRight,
  Info,
  Maximize2,
  Minimize2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AttentionItem, AttentionTone } from "./attention";
import { initialPanelState, panelOpenReducer } from "./panel-open-state";

/**
 * Today's focus: what the school has to do something about.
 *
 * The console's Action Centre, in a school's terms. Everything structural is
 * the same and deliberately so - the header pair, the summary after a rule, the
 * maximise control, the collapse, the two groups, the tinted cards with a
 * figure on the right - because a person who works in both should not have to
 * learn the screen twice.
 *
 * **The two groups mean something different here, and that is the one real
 * change.** The console splits work the reader personally clears from
 * conditions across the organisation, because it has an approvals queue and a
 * task table and most of what it reports belongs to somebody else. A school
 * administrator owns all of it. So the split is by whether the school has to
 * ACT: a clash, a missing timetable, a year with no terms are theirs to fix; a
 * holiday dated between two terms is a thing to know, because the December
 * break is exactly that and is not a mistake.
 *
 * **Nothing here is dismissible**, unlike the console's blue notices. Every row
 * is a live condition the server recomputes: it goes away when the school fixes
 * it, and a control that hides a clash would be a lie about a timetable that
 * still cannot be published.
 */

const TONES: Record<
  AttentionTone,
  { card: string; tile: string; stat: string; icon: typeof Info }
> = {
  blocking: {
    card: "border-error-text/25 bg-error-text/5 hover:border-error-text/45",
    tile: "bg-error-text/10 text-error-text",
    stat: "text-error-text",
    icon: AlertTriangle,
  },
  warning: {
    card: "border-yellow-01/45 bg-yellow-01/5 hover:border-yellow-02/60",
    tile: "bg-yellow-01/20 text-yellow-02",
    stat: "text-yellow-02",
    icon: AlertTriangle,
  },
  info: {
    card: "border-white-02 bg-white-05 hover:border-primary/30",
    tile: "bg-gray-04 text-gray-06",
    stat: "text-gray-06",
    icon: Info,
  },
};

function GroupHeading({
  title,
  note,
  tone,
}: {
  title: string;
  note: string;
  tone: "mine" | "watch";
}) {
  return (
    <div className="mb-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <h3
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.14em]",
          tone === "mine" ? "text-primary" : "text-gray-05",
        )}
      >
        {title}
      </h3>
      <p className="text-[11px] text-gray-05">{note}</p>
    </div>
  );
}

/** One condition. The link fills the card, so the whole card is the target. */
function FocusCard({ item }: { item: AttentionItem }) {
  const tone = TONES[item.tone];
  const Icon = tone.icon;
  return (
    <Link
      to={item.to}
      className={cn(
        "group flex min-w-0 items-center gap-3 rounded-xl border p-3.5 transition-colors",
        tone.card,
      )}
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg",
          tone.tile,
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-black-01">
          {item.title}
        </span>
        {/* The server's own sentence, and the reason the card is not one line:
            it names the classes, and a name is what makes it actionable. Two
            lines rather than the console's one, because these sentences are
            longer than its own - and clamped rather than free, because a card
            that grows to four lines makes the row beside it a third of its
            height. The whole sentence is on the title either way. */}
        <span
          title={item.detail}
          // No `block` beside `line-clamp-2`: the clamp sets its own display
          // (`-webkit-box`), and `block` overrode it, so the sentence ran to
          // four lines and left the card beside it a third of the height.
          className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-gray-05 text-pretty"
        >
          {item.detail}
        </span>
      </span>
      {item.stat !== undefined && (
        <span
          className={cn(
            "shrink-0 font-mont text-sm font-semibold tabular-nums",
            tone.stat,
          )}
        >
          {item.stat}
        </span>
      )}
      <ChevronRight className="size-4 shrink-0 text-gray-05 transition-colors group-hover:text-primary" />
    </Link>
  );
}

export function FocusPanel({ items }: { items: AttentionItem[] }) {
  const [panel, dispatchPanel] = useReducer(panelOpenReducer, undefined, initialPanelState);
  const [hoveredOpen, setHoveredOpen] = useState(false);

  // Something actually blocking opens the panel itself. On a phone there is no
  // hover, so a collapsed header is the only thing between the reader and a
  // school that cannot go live. The reducer opens on the rising edge only, so
  // the three-minute poll never re-opens a panel the reader put away.
  const hasBlocking = items.some((i) => i.tone === "blocking");
  useEffect(() => {
    dispatchPanel({ type: "data", hasBlocking });
  }, [hasBlocking]);

  if (items.length === 0) return null;

  const mine = items.filter((i) => i.mine);
  const watch = items.filter((i) => !i.mine);
  const summary = [
    mine.length > 0 ? `${mine.length} to fix` : null,
    watch.length > 0 ? `${watch.length} to watch` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const expanded = panel.expanded || hoveredOpen;

  return (
    <section
      aria-label="Action needed"
      onMouseEnter={() => setHoveredOpen(true)}
      onMouseLeave={() => setHoveredOpen(false)}
      // Warm, not white. Every other box on this page is a white panel
      // reporting a number; this one is the only thing asking to be acted on,
      // and a card that looks like all the others is one a reader learns to
      // scroll past. The wash is faint on purpose - the cards inside carry
      // their own red and amber, and a loud container would compete with them.
      className="rounded-2xl border border-yellow-01/45 bg-[linear-gradient(112deg,rgba(214,168,90,.10)_0%,rgba(214,168,90,.04)_46%,rgba(255,255,255,0)_100%)] p-4 sm:p-5"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-3">
          <div className="flex min-w-0 items-baseline gap-2">
            <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-yellow-02">
              Today&apos;s focus
            </p>
            <h2 className="truncate font-mont text-sm font-semibold tracking-tight sm:text-base">
              Action needed
            </h2>
          </div>
          <p className="hidden truncate text-[11px] text-gray-05 sm:block sm:border-l sm:border-white-02 sm:pl-3">
            {summary}
          </p>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="dashboard-focus-details"
          // The word is hidden below sm, which would leave the button with no
          // accessible name on exactly the devices that cannot hover.
          aria-label={panel.expanded ? "Minimize action needed" : "Maximize action needed"}
          onClick={() => {
            if (panel.expanded) {
              dispatchPanel({ type: "close" });
              setHoveredOpen(false);
              return;
            }
            dispatchPanel({ type: "open" });
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white-02 bg-white-05 px-2.5 py-1.5 text-[11px] font-semibold text-gray-06 transition-colors hover:border-primary/25 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
        >
          {panel.expanded ? (
            <Minimize2 className="size-3.5" />
          ) : (
            <Maximize2 className="size-3.5" />
          )}
          <span className="hidden sm:inline">
            {panel.expanded ? "Minimize" : "Maximize"}
          </span>
        </button>
      </div>

      <div
        id="dashboard-focus-details"
        aria-hidden={!expanded}
        inert={!expanded}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          {/* Only said when nothing is the school's to fix. With both groups
              present the headings already say which half is which, and a
              sentence repeating them just pushes the first card down. */}
          {mine.length === 0 && (
            <p className="mb-4 mt-3 text-xs text-gray-05">
              Nothing is waiting on you. Here is what is worth knowing.
            </p>
          )}

          {mine.length > 0 && (
            <section aria-label="Yours to fix" className="mt-4">
              <GroupHeading
                title="Yours to fix"
                note="The school cannot run correctly until these are dealt with"
                tone="mine"
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {mine.map((item) => (
                  <FocusCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {watch.length > 0 && (
            <section
              aria-label="Watch"
              className={cn(mine.length > 0 && "mt-5")}
            >
              <GroupHeading
                title="Watch"
                note="Worth knowing, and possibly deliberate"
                tone="watch"
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {watch.map((item) => (
                  <FocusCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}
