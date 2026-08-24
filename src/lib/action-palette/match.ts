// Matching engine: score an action against a typed query. Supports plain
// substring, prefix, and token/initials matching ("vi ho" → View home,
// "vi m-p" → View my profile), plus global verb synonyms so "new student",
// "add student" and "register student" all hit the same action.

import type { ActionDef } from "./types";

// Verb synonym groups. When an action label (or alias) begins with any word in
// a group, we also match the other words in that group - so the leading verb is
// interchangeable without listing every spelling per action.
const VERB_GROUPS: readonly string[][] = [
  ["view", "open", "show", "see", "list", "browse", "go"], // "go to" → first token "go"
  ["create", "new", "add", "raise", "register", "make", "record", "post", "upload", "invite", "issue", "generate"],
];

const norm = (s: string): string => s.toLowerCase().replace(/\s+/g, " ").trim();

// Split a query/label into word tokens. Both space and hyphen separate, so
// "vi m-p" tokenises to ["vi","m","p"].
const tokenize = (s: string): string[] => norm(s).split(/[\s-]+/).filter(Boolean);

// For a phrase, produce the phrase plus verb-synonym variants of its first word.
function expandVerbs(phrase: string): string[] {
  const words = norm(phrase).split(" ");
  const first = words[0];
  const group = VERB_GROUPS.find((g) => g.includes(first));
  if (!group || words.length < 2) return [norm(phrase)];
  const rest = words.slice(1).join(" ");
  return group.map((verb) => `${verb} ${rest}`);
}

// Every string a query may match against for one action, with a flag marking
// which came from the canonical label (label matches outrank alias matches).
interface Candidate {
  text: string;
  tokens: string[];
  isLabel: boolean;
}

// Cache the derived candidates per action - the registry is static, so this is
// computed once regardless of how many keystrokes arrive.
const candidateCache = new WeakMap<ActionDef, Candidate[]>();

function candidatesFor(action: ActionDef): Candidate[] {
  const cached = candidateCache.get(action);
  if (cached) return cached;
  const out: Candidate[] = [];
  const seen = new Set<string>();
  const add = (text: string, isLabel: boolean) => {
    const key = `${isLabel ? "L" : "A"}:${text}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ text, tokens: tokenize(text), isLabel });
  };
  for (const variant of expandVerbs(action.label)) add(variant, true);
  for (const alias of action.aliases) {
    for (const variant of expandVerbs(alias)) add(variant, false);
  }
  candidateCache.set(action, out);
  return out;
}

// Do the query tokens match, in order, as prefixes of distinct words of the
// candidate (words consumed left to right, never reused)? "v inv" matches
// "view fee invoices" (v→view, inv→invoices, skipping "fee").
function tokensMatchInOrder(queryTokens: string[], wordTokens: string[]): boolean {
  let w = 0;
  for (const qt of queryTokens) {
    while (w < wordTokens.length && !wordTokens[w].startsWith(qt)) w++;
    if (w >= wordTokens.length) return false;
    w++;
  }
  return true;
}

// Tier: coarse relevance bucket. Popularity only reorders within a tier, so a
// substring match can never outrank an exact one.
export const TIER = { EXACT: 4, PREFIX: 3, INITIALS: 2, SUBSTRING: 1, NONE: 0 } as const;

export interface MatchResult {
  tier: number;
  // Fine score within the tier from match strength (label vs alias, how much of
  // the candidate the query covers). Popularity is layered on top by the caller.
  score: number;
}

/**
 * Score `query` against `action`. Returns null when nothing matches.
 * Tiers, best-first: exact label/alias > prefix > token-initials > substring.
 */
export function scoreAction(action: ActionDef, query: string): MatchResult | null {
  const q = norm(query);
  if (!q) return null;
  const qTokens = tokenize(query);
  const qCompact = q.replace(/\s+/g, "");

  let best: MatchResult | null = null;
  const consider = (tier: number, score: number) => {
    if (!best || tier > best.tier || (tier === best.tier && score > best.score)) {
      best = { tier, score };
    }
  };

  for (const cand of candidatesFor(action)) {
    const labelBonus = cand.isLabel ? 40 : 0;

    if (cand.text === q) {
      consider(TIER.EXACT, 100 + labelBonus);
      continue;
    }
    if (cand.text.startsWith(q)) {
      // Shorter candidates are more specific → rank higher within the tier.
      consider(TIER.PREFIX, 60 + labelBonus - Math.min(cand.text.length, 40) / 2);
      continue;
    }
    if (qTokens.length && tokensMatchInOrder(qTokens, cand.tokens)) {
      // Reward matching the leading words (an "initials" feel) over skipping in.
      const leadingHit = cand.tokens[0]?.startsWith(qTokens[0]) ? 15 : 0;
      consider(TIER.INITIALS, 30 + labelBonus + leadingHit - Math.min(cand.tokens.length, 10));
      continue;
    }
    // Substring, ignoring spaces so "feeinv" finds "fee invoices".
    if (cand.text.replace(/\s+/g, "").includes(qCompact)) {
      consider(TIER.SUBSTRING, 10 + labelBonus);
    }
  }

  return best;
}
