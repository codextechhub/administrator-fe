// Shared formatting helpers. Anything no longer referenced anywhere in src/
// gets deleted rather than kept "just in case" - git history has the old
// implementations (currency formatting, duration, Vimeo IDs, …).

export function returnInitial(name: string) {
  // Initials from the first two words; a single-word name yields a single
  // letter (a mononym avatar shouldn't look like a two-letter typo, e.g.
  // "John" → "J", not "JO"). Empty segments from stray spaces are ignored.
  const words = (name ?? "").split(" ").filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return (words[0].slice(0, 1) + words[1].slice(0, 1)).toUpperCase();
}

export const formatRelativeDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${day}${suffix} ${month} ${year}`;
};

export const formatDate = (timestamp: string | number | Date): string => {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "-";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function formatStartedTime(isoString: string) {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "-";
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";

  hours = hours % 12 || 12; // convert 0 to 12-hour format

  return `${day} ${month} ${year}, ${hours}:${minutes}${ampm}`;
}

/**
 * Generates a URL query string from a given object of parameters.
 *
 * Filters out parameters with `undefined`, `null` or empty-string values. If a
 * parameter value is an array, it generates one key-value pair per element
 * (repeated-key params, e.g. `?status=A&status=B`).
 *
 * Note: `0` and `false` are intentionally kept - numeric/boolean filters of
 * those values are meaningful query params; only `undefined`/`null`/`""` are
 * treated as "unset".
 *
 * @example
 * generateQueryString({ foo: "bar", baz: [1, 2], empty: undefined });
 * // Returns: "?foo=bar&baz=1&baz=2"
 */
type QueryValue = string | number | boolean | (string | number)[];

export function generateQueryString(params: Record<string, QueryValue>): string {
  const query = Object.entries(params)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
    .map(([key, value]) =>
      Array.isArray(value)
        ? value
            .map(
              (val) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`
            )
            .join("&")
        : `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");

  return query ? `?${query}` : "";
}

const ENUM_LABEL_MAP: Record<string, string> = {
  FAITH_BASED: "Faith-Based",
  NGO: "Non-Governmental Organization",
  "2_SEMESTERS": "2 Semesters",
  "3_TERMS": "3 Terms",
};

export function formatEnum(value: string | null | undefined): string {
  if (!value) return "-";
  if (ENUM_LABEL_MAP[value]) return ENUM_LABEL_MAP[value];
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
