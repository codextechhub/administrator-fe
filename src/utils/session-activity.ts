// Persists the wall-clock timestamp of the user's last interaction so the
// Authenticated gate can detect "left overnight" sessions on the next reload.
// Activity events fire very frequently (mousemove, scroll), so writes are
// throttled - the in-memory ref in useSessionTimeout remains the authoritative
// source while the page is open; this is only a stale-on-mount safety net.

const KEY = "_last_activity";
const THROTTLE_MS = 5_000;

let lastWritten = 0;

export function recordActivity(): void {
  const now = Date.now();
  if (now - lastWritten < THROTTLE_MS) return;
  lastWritten = now;
  try {
    localStorage.setItem(KEY, String(now));
  } catch {
    // localStorage can throw in private mode / quota issues. The in-memory
    // session timer still works; we just lose the on-reload guarantee.
  }
}

export function getLastActivity(): number | null {
  try {
    const v = localStorage.getItem(KEY);
    if (!v) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function clearActivity(): void {
  lastWritten = 0;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Same private-mode caveat as recordActivity - nothing to clean up.
  }
}
