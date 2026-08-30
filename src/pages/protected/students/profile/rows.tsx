export interface Row {
  label: string;
  value: string;
}

/**
 * A label/value list that survives a phone.
 *
 * Two columns at `sm` and up, stacked below it. The value column carries
 * `min-w-0` and wraps rather than truncating: a home address is the reason this
 * screen is open, and hiding half of it behind an ellipsis to keep a tidy line
 * would be losing the answer to keep the shape.
 */
export function Rows({ rows }: { rows: Row[] }) {
  return (
    <dl className="grid gap-2.5">
      {rows.map((r) => (
        <div
          key={r.label}
          className="grid gap-0.5 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:gap-3"
        >
          <dt className="text-xs text-gray-05 sm:pt-0.5">{r.label}</dt>
          <dd className="min-w-0 break-words text-sm text-black-01">
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
