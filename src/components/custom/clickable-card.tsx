import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// A card that opens something.
//
// One definition, because there were four hand-rolled copies of it and only two
// of them animated - so Branches and Sessions responded to a cursor and
// Departments, Classes and Subjects sat still, which reads as "these ones are
// not clickable" rather than as an oversight. The hover is not decoration: it
// is the only thing on a card that says pressing it will do something.
//
// A real <div role="button"> with a key handler rather than a <button>, because
// these cards contain their OWN buttons - a row menu, Edit, Archive - and a
// button inside a button is invalid HTML that browsers resolve by dropping one
// of them. `stopPropagation` on those children keeps the two apart.
// ─────────────────────────────────────────────────────────────────────────────

export function ClickableCard({
  onOpen,
  label,
  className,
  children,
}: {
  onOpen: () => void;
  /** What pressing it opens, for anyone not looking at the screen. */
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "h-fit w-full min-w-0 cursor-pointer rounded-md border border-border bg-white px-4 py-3",
        "transition-all ease-linear hover:scale-98 hover:border-pry-01",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Wrap the controls a card carries of its own.
 *
 * Without it, pressing Edit both opens the drawer AND runs Edit - or the row
 * menu opens behind the drawer the card just opened.
 */
export function CardActions({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className} onClick={(event) => event.stopPropagation()}>
      {children}
    </div>
  );
}
