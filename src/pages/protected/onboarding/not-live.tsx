import { NotLiveNotice } from "./components/not-live-notice";

/**
 * Where a request refused with TENANT_NOT_LIVE lands.
 *
 * The base query sends every one of them here, so this single route covers
 * every closed surface rather than each page having to know it might be shut.
 */
export default function OnboardingNotLive() {
  return <NotLiveNotice />;
}
