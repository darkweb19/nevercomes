// Pure retention math for /me. No React, no Supabase, no network — same rules as lib/sim.

const DAY_MS = 86_400_000;

export interface MeOrderInput {
  fakeTotalCents: number;
  createdAt: string;
}

export interface MeStats {
  moneySavedCents: number;
  ordersPlaced: number;
  /** Always 0. This is the product. */
  ordersDelivered: 0;
  streakDays: number;
}

const STREAK_MILESTONE_DAYS = 7;
const RATIO_MILESTONE_ORDERS = 3;
const MONEY_MILESTONE_CENTS = 10_000;

const NUMBER_WORDS = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
];

export function computeStats(
  orders: MeOrderInput[],
  profileCreatedAt: string,
  now: number,
): MeStats {
  let moneySavedCents = 0;
  for (const order of orders) {
    moneySavedCents += order.fakeTotalCents;
  }

  const elapsed = now - Date.parse(profileCreatedAt);
  const streakDays = Math.max(0, Math.floor(elapsed / DAY_MS)) + 1;

  return {
    moneySavedCents,
    ordersPlaced: orders.length,
    ordersDelivered: 0,
    streakDays,
  };
}

export function deriveMilestones(stats: MeStats): string[] {
  if (stats.ordersPlaced === 0) return [];

  const milestones: string[] = [];

  if (stats.streakDays >= STREAK_MILESTONE_DAYS) {
    milestones.push(`${stats.streakDays}-day streak`);
  }
  if (stats.ordersPlaced >= RATIO_MILESTONE_ORDERS) {
    const n = stats.ordersPlaced;
    const spoken = n < NUMBER_WORDS.length ? NUMBER_WORDS[n] : String(n);
    const spokenLower = n < NUMBER_WORDS.length ? spoken.toLowerCase() : spoken;
    milestones.push(`${spoken} for ${spokenLower} never arrived`);
  }
  if (stats.ordersPlaced >= 2) {
    milestones.push("Repeat non-customer");
  }
  milestones.push("Zero deliveries, zero regrets");
  if (stats.moneySavedCents >= MONEY_MILESTONE_CENTS) {
    milestones.push("$100+ never charged");
  }

  return milestones;
}
