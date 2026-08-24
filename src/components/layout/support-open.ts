import type { EscalationPrefill } from "@/components/custom/support-ticket-form";

/**
 * Ask the header to open its support panel, from anywhere.
 *
 * An event rather than a prop or a context, for the same reason the action
 * palette uses one: the header owns the panel and its state, and half a dozen
 * screens want to open it. Threading a callback down through every one of them
 * would put the header's business in components that have nothing else to do
 * with it.
 *
 * The optional prefill is how a screen hands over what it already knows. The
 * failed-activation block on Go-Live is the case that matters: it can fill in
 * the title, the failure reference and the category, so somebody reporting it
 * does not have to retype a reference they are looking at.
 */
export const SUPPORT_OPEN_EVENT = "support:open";

export function requestSupportOpen(prefill?: EscalationPrefill): void {
  window.dispatchEvent(
    new CustomEvent<EscalationPrefill>(SUPPORT_OPEN_EVENT, {
      detail: prefill ?? {},
    }),
  );
}
