import { baseApi } from "../base-api";
import type { Envelope } from "../onboarding/onboarding-types";
import type { CreateTicketBody, Ticket } from "./support-types";

// ─────────────────────────────────────────────────────────────────────────────
// Support desk - the create half only.
//
// POST /v1/support/tickets/ is on the pending-tenant surface; nothing else on
// the desk is. That is why there is no ticket list, no thread and no attachment
// endpoint here: a school still onboarding can file a ticket and then hears
// back by email, so the confirmation screen has to be self-sufficient.
// ─────────────────────────────────────────────────────────────────────────────
export const supportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createTicket: builder.mutation<Envelope<Ticket>, CreateTicketBody>({
      query: (body) => ({
        url: `/support/tickets/`,
        method: "POST",
        body,
      }),
      // The escalation form renders its own inline errors; see the note in
      // onboarding-api.ts.
      extraOptions: { silent: true },
    }),

    /**
     * Attach one file to a ticket that already exists.
     *
     * Separate from creating the ticket because the endpoint is
     * `POST /tickets/{id}/attachments/` and needs the id. So the form creates
     * the ticket first, then uploads each file - which means a file can fail
     * while the ticket itself succeeded, and the caller has to say so rather
     * than pretending the whole thing failed.
     *
     * The server checks every file: 10 MB, an extension allowlist, and that the
     * bytes match the extension. The accept attribute on the picker is a
     * courtesy on top of that, not the rule.
     */
    addTicketAttachment: builder.mutation<
      Envelope<{ id: string; original_filename: string }>,
      { ticketId: string; file: File }
    >({
      query: ({ ticketId, file }) => {
        const body = new FormData();
        body.append("file", file);
        return {
          url: `/support/tickets/${ticketId}/attachments/`,
          method: "POST",
          body,
        };
      },
      extraOptions: { silent: true },
    }),
  }),
});

export const { useCreateTicketMutation, useAddTicketAttachmentMutation } =
  supportApi;
