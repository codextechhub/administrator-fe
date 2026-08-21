/**
 * api-error - read the platform's error envelope off an RTK Query rejection.
 *
 * Every backend refusal arrives as
 *   { success: false, message: string, error: { code: string, detail: object } }
 * and RTK Query wraps it as `{ status, data }` for an HTTP failure or
 * `{ status: "FETCH_ERROR" | ..., error }` for a transport one.
 *
 * Screens that render a refusal INLINE (rather than letting the base query's
 * global toast handle it) need three things from that shape: the machine code,
 * so they can branch; the sentence, so they can show it; and sometimes the
 * detail, which is where the two refusals that carry one put it. Reading it by
 * hand at each call site is how a page ends up printing "TASK_CONDITION_NOT_MET"
 * at a school admin, so it is read here instead.
 */

/** The parsed refusal. Every field may be absent - transport failures have none. */
export interface ApiError {
  /** HTTP status, or the transport failure kind ("FETCH_ERROR", …). */
  status: number | string | undefined;
  /** Machine code, e.g. "TASK_CONDITION_NOT_MET". Empty when the body had none. */
  code: string;
  /** The server's human sentence, already phrased for the reader. */
  message: string;
  /** `error.detail` - the payload the two refusals that need one carry. */
  detail: Record<string, unknown>;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

/** Parse any RTK Query error (or anything else) into the envelope's parts. */
export function parseApiError(error: unknown): ApiError {
  const outer = asRecord(error);
  const body = asRecord(outer.data);
  const inner = asRecord(body.error);
  return {
    status: outer.status as number | string | undefined,
    // `code` sits inside `error` for domain refusals and at the top level for
    // `error_response(code=…)`. Both spellings are in the backend today.
    code: asString(inner.code) || asString(body.code),
    message: asString(body.message),
    detail: asRecord(inner.detail),
  };
}

/** True when the rejection carries exactly this machine code. */
export function isApiCode(error: unknown, code: string): boolean {
  return parseApiError(error).code === code;
}

/**
 * The sentence to show a person, never a machine code.
 *
 * A SCREAMING_SNAKE `message` is a backend slip, not copy; it falls back rather
 * than being printed.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const { message } = parseApiError(error);
  if (!message) return fallback;
  if (/^[A-Z][A-Z0-9_]{3,}$/.test(message.trim())) return fallback;
  return message;
}
