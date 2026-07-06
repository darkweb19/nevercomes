// Deterministic pseudonyms for the public leaderboard. No React, no Supabase,
// no network — same rules as lib/sim. Input is the short profile-id hash the
// leaderboard() DB function exposes; real identifiers never reach this layer.

export interface Pseudonym {
  /** "Patient Stranger" */
  name: string;
  /** "4821" */
  code: string;
  /** "Patient Stranger #4821" */
  full: string;
}

const ADJECTIVES = [
  "Patient",
  "Weary",
  "Hopeful",
  "Silent",
  "Loyal",
  "Quiet",
  "Devoted",
  "Faithful",
  "Calm",
  "Reformed",
  "Anonymous",
  "Tireless",
  "Restless",
  "Earnest",
  "Humble",
  "Steadfast",
];

const NOUNS = [
  "Stranger",
  "Customer",
  "Ghost",
  "Optimist",
  "Nobody",
  "Believer",
  "Waiter",
  "Void",
  "Pessimist",
  "Skeptic",
  "Newcomer",
  "Regular",
  "Patron",
  "Bystander",
  "Soul",
  "Witness",
];

/** FNV-1a 32-bit — tiny, stable, good-enough spread for name picking. */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function pseudonymFromSeed(seed: string): Pseudonym {
  const adjective = ADJECTIVES[fnv1a(`${seed}|adj`) % ADJECTIVES.length];
  const noun = NOUNS[fnv1a(`${seed}|noun`) % NOUNS.length];
  const code = String(fnv1a(`${seed}|code`) % 10_000).padStart(4, "0");

  const name = `${adjective} ${noun}`;
  return { name, code, full: `${name} #${code}` };
}
