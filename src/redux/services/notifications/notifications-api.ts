import { baseApi } from "../base-api";
import type { Envelope } from "../onboarding/onboarding-types";

// ─────────────────────────────────────────────────────────────────────────────
// The notification bell.
//
// Only the unread count, because only the count is on screen today. The inbox
// itself (list, retrieve, mark-read) is open to a pending school too - the
// backend opens exactly the personal-inbox actions and keeps settings, history
// and templates shut - so the tray is one endpoint away when a screen needs it.
// ─────────────────────────────────────────────────────────────────────────────
export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUnreadNotificationCount: builder.query<
      Envelope<{ unread_count: number }>,
      void
    >({
      query: () => ({ url: `/notify/unread-count/`, method: "GET" }),
      // A failed count is not worth interrupting anyone for: the bell simply
      // shows no badge, which is what it shows at zero anyway.
      extraOptions: { silent: true },
      providesTags: ["Notifications"],
    }),
  }),
});

export const { useGetUnreadNotificationCountQuery } = notificationsApi;
