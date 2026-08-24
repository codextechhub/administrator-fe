/**
 * A date in the words somebody would actually say.
 *
 * "Today" and "Yesterday" for the two that matter most in a notification feed,
 * then an ordinary date. Ported from console-fe so the two apps describe the
 * same event the same way - a school admin and a CodeX operator looking at the
 * same go-live should not be reading two different date formats.
 *
 * An unparseable date reads as "-" rather than "Invalid Date".
 */
export function formatRelativeDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";

  return `${day}${suffix} ${date.toLocaleString("en-GB", {
    month: "short",
  })} ${date.getFullYear()}`;
}
