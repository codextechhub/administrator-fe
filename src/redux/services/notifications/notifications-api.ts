import { baseApi } from "../base-api";
import type { Envelope, PaginatedEnvelope } from "../onboarding/onboarding-types";

/** One item in the bell's tray, as `/v1/notify/` returns it. */
export interface NotificationItem {
  id: string;
  event_type_key: string;
  event_type_label: string;
  channel: "in_app";
  subject: string;
  body: string;
  /** Where the event happened. Often a route this app does not have yet. */
  action_url: string;
  is_read: boolean;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// The notification bell and its tray.
//
// Every endpoint here is open to a school that has not gone live: the backend
// opens exactly the personal-inbox actions (list, retrieve, unread-count,
// mark-read, mark-all-read) and keeps settings, history and templates shut. The
// queryset is scoped to the recipient, so there is nobody else's post to read.
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

    /** The tray's contents. Unread only, newest first, a handful at a time. */
    getNotifications: builder.query<
      PaginatedEnvelope<NotificationItem>,
      { page?: number; page_size?: number; is_read?: boolean } | void
    >({
      query: (args) => ({
        url: `/notify/`,
        method: "GET",
        params: {
          page: args?.page ?? 1,
          page_size: args?.page_size ?? 5,
          ...(args?.is_read === undefined ? {} : { is_read: args.is_read }),
        },
      }),
      extraOptions: { silent: true },
      providesTags: ["Notifications"],
    }),

    markNotificationsRead: builder.mutation<
      Envelope<{ updated_count: number }>,
      { ids: string[] }
    >({
      query: (body) => ({ url: `/notify/mark-read/`, method: "POST", body }),
      extraOptions: { silent: true },
      invalidatesTags: ["Notifications"],
    }),

    markAllNotificationsRead: builder.mutation<
      Envelope<{ updated_count: number }>,
      void
    >({
      query: () => ({ url: `/notify/mark-all-read/`, method: "POST" }),
      extraOptions: { silent: true },
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetUnreadNotificationCountQuery,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;
