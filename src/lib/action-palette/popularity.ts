/**
 * Learned, local ranking. Two signals, both per-user in localStorage, no
 * backend: (1) adaptive picks - which action a user chose for a given query, so
 * the palette adapts to "when I type s I mean View students"; (2) frecency - a
 * per-action counter with recency decay so frequent recent actions float up.
 * A weak match can't be promoted across match tiers (the caller enforces that);
 * popularity only reorders within a tier.
 */

const VERSION = "v1";
const keyBase = (userId: string | undefined) => `action-palette:${VERSION}:${userId ?? "anon"}`;

/**
 * ── storage helpers (fail-safe: any storage error degrades to no-memory) ─────
 * Safari private mode throws on setItem, and a hardened browser can make
 * localStorage itself throw on access. Popularity is a nicety, never a
 * requirement, so every path here swallows and carries on unlearned rather than
 * letting a storage failure break the palette.
 */
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode / quota - popularity is best-effort, so silently skip.
  }
}

// ── adaptive picks: query → { actionId: count } ──────────────────────────────
type AdaptiveStore = Record<string, Record<string, number>>;
// ── frecency: actionId → { count, last(ms) } ─────────────────────────────────
type FrecencyStore = Record<string, { count: number; last: number }>;

const normQuery = (q: string) => q.toLowerCase().replace(/\s+/g, " ").trim();

const HALF_LIFE_DAYS = 14;
const DAY = 24 * 60 * 60 * 1000;

function decay(last: number, now: number): number {
  const ageDays = Math.max(0, (now - last) / DAY);
  return Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
}

export interface PopularityModel {
  // Popularity contribution for an action under the current query. Combines an
  // adaptive-pick bonus (strong when the exact query was chosen before, weak on
  // prefix overlap) with decayed frecency.
  scoreFor(actionId: string, query: string): number;
}

/**
 * Load the user's popularity model. Read once per render of the search hook;
 * cheap (two small JSON blobs).
 */
export function loadPopularity(userId: string | undefined, now = Date.now()): PopularityModel {
  const adaptive = read<AdaptiveStore>(`${keyBase(userId)}:adaptive`, {});
  const frecency = read<FrecencyStore>(`${keyBase(userId)}:frecency`, {});

  return {
    scoreFor(actionId, query) {
      const q = normQuery(query);
      let adaptiveBonus = 0;
      for (const [storedQuery, picks] of Object.entries(adaptive)) {
        const count = picks[actionId];
        if (!count) continue;
        if (storedQuery === q) adaptiveBonus += count * 100;
        else if (q.startsWith(storedQuery) || storedQuery.startsWith(q)) adaptiveBonus += count * 20;
      }
      const f = frecency[actionId];
      const frecencyScore = f ? f.count * decay(f.last, now) * 5 : 0;
      return adaptiveBonus + frecencyScore;
    },
  };
}

/**
 * Decayed frecency score per action, independent of any query. Use this where
 * the ranking question is "what does this user reach for most", not "what
 * matches what they typed" - for example the empty-query state of the palette,
 * before a single character is typed.
 */
export function loadFrecencyScores(userId: string | undefined, now = Date.now()): Record<string, number> {
  const frecency = read<FrecencyStore>(`${keyBase(userId)}:frecency`, {});
  const scores: Record<string, number> = {};
  for (const [actionId, entry] of Object.entries(frecency)) {
    scores[actionId] = entry.count * decay(entry.last, now);
  }
  return scores;
}

/**
 * Record that the user chose `actionId` after typing `query`. Updates both the
 * adaptive map (keyed by the exact query) and the action's frecency counter.
 */
export function recordPick(userId: string | undefined, actionId: string, query: string, now = Date.now()): void {
  const q = normQuery(query);
  if (q) {
    const adaptive = read<AdaptiveStore>(`${keyBase(userId)}:adaptive`, {});
    const bucket = (adaptive[q] ??= {});
    bucket[actionId] = (bucket[actionId] ?? 0) + 1;
    write(`${keyBase(userId)}:adaptive`, capAdaptive(adaptive, q));
  }
  const frecency = read<FrecencyStore>(`${keyBase(userId)}:frecency`, {});
  const entry = (frecency[actionId] ??= { count: 0, last: now });
  entry.count += 1;
  entry.last = now;
  write(`${keyBase(userId)}:frecency`, frecency);
}

/**
 * Keep the adaptive store from growing unbounded, evicting the least-populated
 * query buckets.
 *
 * `justUsed` is the query that was recorded on this write, and it is always
 * kept. Without that the store silently stopped learning the moment it filled
 * up: a brand new query enters with weight 1, every other bucket is at least 1,
 * the sort is stable so ties hold their insertion order, and a newly added key
 * sorts last. It was therefore evicted by the very write that created it, for
 * ever. The user kept their old learned queries and never gained another.
 */
function capAdaptive(
  store: AdaptiveStore,
  justUsed?: string,
  maxQueries = 200,
): AdaptiveStore {
  const keys = Object.keys(store);
  if (keys.length <= maxQueries) return store;
  const weight = (q: string) => Object.values(store[q]).reduce((a, b) => a + b, 0);
  const others = keys.filter((k) => k !== justUsed);
  const room = justUsed && store[justUsed] ? maxQueries - 1 : maxQueries;
  const kept = others.sort((a, b) => weight(b) - weight(a)).slice(0, room);
  const next: AdaptiveStore = {};
  if (justUsed && store[justUsed]) next[justUsed] = store[justUsed];
  for (const k of kept) next[k] = store[k];
  return next;
}
