// The date-picker's pure helpers.
//
// Split out of the component so a module that exports both a component and
// functions does not break Fast Refresh for every screen importing the picker -
// the same reason session-format.ts sits beside session-chips.tsx.

/** An ISO yyyy-mm-dd string as a Date, or undefined for anything else. */
function parseDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : undefined;
}

function toIsoDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export { parseDate, toIsoDate };
