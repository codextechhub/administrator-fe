import { cn } from "@/lib/utils";

import { personInitials } from "../person-name";

/**
 * The 3px separator between facts in a record header.
 *
 * Shared by the student profile and the guardian page: they are the same kind
 * of header, and a dot that differed between them would read as two different
 * treatments of the same idea.
 */
export function Dot() {
  return (
    <span aria-hidden className="size-[3px] shrink-0 rounded-full bg-gray-02" />
  );
}

/**
 * The uppercase pill the design uses for a household.
 *
 * Deliberately not a status chip: SIBLINGS is not a state the record is in, it
 * is a fact about who else the row reaches. Letter-spaced small caps keep it
 * from competing with the status chips it sits beside.
 */
export function SiblingsPill() {
  return (
    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold tracking-[0.05em] text-primary">
      SIBLINGS
    </span>
  );
}

/**
 * One person as a card: a guardian in the directory, or a ward on a guardian.
 *
 * **A card rather than a table row**, and for these two screens that is the
 * right shape rather than a preference. A guardian is a household: the useful
 * part of the row is the list of children it reaches, which is a sentence of
 * names, not a value in a column. In a table that sentence either gets a column
 * so wide it starves the rest, or an ellipsis after the first name - which
 * removes the only thing the row was for.
 *
 * Both screens use the same card because they are the same object seen from
 * two directions, and a guardian that looked one way in a list and another way
 * on a page would read as two different records.
 */
export function PersonCard({
  name,
  sub,
  chip,
  footerLead,
  footerRest,
  onOpen,
}: {
  name: string;
  /** Under the name: a phone number, or an admission number. */
  sub: string;
  /** Top-right: the SIBLINGS pill, or a status chip. */
  chip?: React.ReactNode;
  /** Below the rule, in the accent colour: the ward count, or the class. */
  footerLead?: React.ReactNode;
  /** Beside it, quieter and truncating: the ward names, or the relationship. */
  footerRest?: React.ReactNode;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      // A real border, not a transparent one. The prototype draws these on a
      // grey page where a white card separates itself; this app's page is also
      // white, so a transparent edge left the cards as floating text with no
      // outline at all. Every other surface in the app carries `border-border`,
      // and the hover deepens it rather than introducing it.
      className="min-w-0 rounded-[10px] border border-border bg-white px-5 py-4.5 text-left transition-colors hover:border-primary/40"
    >
      <span className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid size-9.5 shrink-0 place-content-center rounded-full bg-white-03 text-[13px] font-semibold text-primary"
        >
          {personInitials(name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-semibold text-black-01">
            {name}
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] text-gray-05">
            {sub}
          </span>
        </span>
        {chip}
      </span>

      {(footerLead || footerRest) && (
        <span className="mt-3.5 flex flex-wrap items-center gap-2.5 border-t border-white-02 pt-3">
          {footerLead}
          {/* min-w-0 on the growing half, or the truncate silently stops. */}
          {footerRest && (
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-gray-05">
              {footerRest}
            </span>
          )}
        </span>
      )}
    </button>
  );
}

/** The footer's leading value, in the colour that says what kind of fact it is. */
export function FooterLead({
  tone = "primary",
  children,
}: {
  tone?: "primary" | "warn";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "shrink-0 text-[12.5px] font-medium",
        tone === "warn" ? "text-amber-700" : "text-primary",
      )}
    >
      {children}
    </span>
  );
}
