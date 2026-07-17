// Roulette prize logic — SERVER ONLY (never trust the client to pick a prize).
// Prizes are discount percentages; 0 means "no prize".

export type Prize = 0 | 5 | 15 | 20 | 50;

// Spend threshold (céntimos) above which the top prizes (20% and 50%) become
// reachable. HIDDEN from the customer — below it those prizes simply never come
// up, with nothing shown to hint at the gate.
export const TOP_TIER_CENTS = 120000; // 1200 €

// Welcome spin (once per account): only 5% (≈33%) or nothing (≈67%).
export function decideWelcomeSpin(rnd = Math.random()): Prize {
  return rnd < 0.33 ? 5 : 0;
}

// Level-up spin: always wins something. 20% and 50% are gated + very rare.
export function decideLevelupSpin(totalSpentCents: number, rnd = Math.random()): Prize {
  const table: [Prize, number][] =
    totalSpentCents > TOP_TIER_CENTS
      ? [
          [5, 72],
          [15, 22],
          [20, 5],
          [50, 1],
        ]
      : [
          [5, 74],
          [15, 26],
        ];

  const total = table.reduce((sum, [, w]) => sum + w, 0);
  let r = rnd * total;
  for (const [prize, weight] of table) {
    r -= weight;
    if (r < 0) return prize;
  }
  return 5;
}
