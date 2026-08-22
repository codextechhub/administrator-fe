import {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
} from "@/redux/services/notifications/notifications-api";

/**
 * The bell's data, in one place so the badge and the tray can never disagree.
 *
 * Polled rather than pushed, and only while the tab is in front: a school admin
 * who leaves onboarding open in a background tab overnight should not be asking
 * the platform for its post 480 times.
 */
const POLL = {
  pollingInterval: 60_000,
  skipPollingIfUnfocused: true,
  refetchOnFocus: true,
} as const;

export function useNotifications() {
  const feed = useGetNotificationsQuery(
    { page: 1, page_size: 5, is_read: false },
    POLL,
  );
  const unread = useGetUnreadNotificationCountQuery(undefined, POLL);

  return {
    items: feed.data?.data ?? [],
    count: unread.data?.data?.unread_count ?? 0,
    isLoading: feed.isLoading || unread.isLoading,
  };
}
