import { format, isValid, parseISO } from "date-fns";

/**
 * Dates the way the design contract asks for them: "17 Aug 2026", never an ISO
 * string. Written once here because the control room, the go-live panel and the
 * request history all print the same timestamps and must not disagree.
 *
 * A null or unparseable value returns an empty string, so a caller can render
 * `humanDate(x) || "-"` rather than guarding first.
 */
const toDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
};

/** "17 Aug 2026" */
export function humanDate(value: string | null | undefined): string {
  const date = toDate(value);
  return date ? format(date, "d MMM yyyy") : "";
}

/** "17 Aug 2026, 11:40" */
export function humanDateTime(value: string | null | undefined): string {
  const date = toDate(value);
  return date ? format(date, "d MMM yyyy, HH:mm") : "";
}

/** "2026-08-17" - the value shape a native date input wants. */
export function dateInputValue(value: Date): string {
  return format(value, "yyyy-MM-dd");
}

/**
 * A `<input type="date">` value as the ISO datetime the API expects.
 *
 * The field carries a day and the endpoint takes a datetime, so the day is
 * anchored at midday rather than midnight: a preferred date that lands on the
 * previous evening once a timezone is applied is the kind of off-by-one nobody
 * spots until a school asks why it went live a day early.
 */
export function dateInputToIso(value: string): string {
  const parsed = parseISO(`${value}T12:00:00`);
  return isValid(parsed) ? parsed.toISOString() : "";
}

/** Up to two uppercase initials, for the school avatar block. */
export function initialsOf(name: string | null | undefined): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}
