/** Shared visual boundary for white information cards and dashboard panels.
 *
 * One hairline for the whole console. `white-02` is bound to `--border`, the
 * same colour the shadcn primitives draw with, so a hand-written card and a
 * primitive cannot drift apart.
 *
 * Never draw a line with `gray-03` (#F7F7F7). It is a FILL - on a white card it
 * measures 1.03:1 against the page and simply is not there. That is how the
 * Bank Accounts KPIs and the Chart of Accounts table ended up looking outline-
 * less while their markup said `border`/`ring`.
 *
 * A tinted card keeps its own tinted outline (`bg-amber-50 border-amber-200`),
 * overriding the border colour after this constant - see `KpiCard`.
 */
export const INFORMATION_CARD_SURFACE = "border border-white-02 bg-white";
