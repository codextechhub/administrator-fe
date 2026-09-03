/**
 * After a redeploy, an already-open tab (or a stale cached index.html) holds
 * asset hashes that no longer exist on the server, so a lazily-imported route
 * chunk 404s - "Failed to fetch dynamically imported module …/index-abc123.js".
 * The recovery is a full reload: the browser fetches the fresh index.html and
 * the current chunk hashes. We guard with a timestamp so a genuinely-missing
 * asset can't reload-loop forever (after the guard window it falls through to
 * the error screen instead).
 */

const KEY = "stale-chunk-reload-at";
const WINDOW_MS = 10_000;

/** True if the error looks like a failed dynamic import / chunk fetch. */
export function isStaleChunkError(err: unknown): boolean {
  const msg =
    err instanceof Error ? err.message : typeof err === "string" ? err : String((err as { message?: string })?.message ?? "");
  return /dynamically imported module|Importing a module script failed|Failed to fetch dynamically|error loading dynamically imported module|ChunkLoadError/i.test(msg);
}

/** Reload once to pick up the new build. Returns false if we reloaded too
 * recently (caller should then surface the error rather than loop). */
export function reloadForStaleChunk(): boolean {
  const last = Number(sessionStorage.getItem(KEY) || 0);
  if (Date.now() - last < WINDOW_MS) return false;
  sessionStorage.setItem(KEY, String(Date.now()));
  window.location.reload();
  return true;
}

/** Listen for Vite's preload-error event (fired when a route chunk fails to
 * load) and recover with a guarded reload. Call once at app startup. */
export function handleStaleChunkPreloadError(
  event: Event,
  online = navigator.onLine,
  reload = reloadForStaleChunk,
): void {
  // A missing chunk while offline is not evidence of a stale deployment.
  // Let the rejection reach RouteError, which shows the recoverable offline
  // state and retries after the browser reconnects. Preventing Vite's error
  // here makes its import resolve as `undefined`, which is the source of the
  // opaque "reading 'default'" crash users previously saw.
  if (!online) return;

  // Only swallow the preload error when we really are reloading. If the
  // reload-loop guard declines, preserve the original useful error instead
  // of turning the imported module into `undefined`.
  if (reload()) event.preventDefault();
}

export function installStaleChunkReload(): void {
  window.addEventListener("vite:preloadError", (e) => {
    handleStaleChunkPreloadError(e);
  });
}
