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
  }),
});

export const { useCreateTicketMutation } = supportApi;
