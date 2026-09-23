import { runEngine } from "./index";

// Baseline (deterministic) — establishes probabilities.json
runEngine({
  demo: true,
  seed: 42,
  reason: "demo baseline Monte Carlo",
  iterations: 10_000,
});

// Second pass with a synthetic availability hit so the what-changed feed
// isn't empty in demo mode (Striker /updates page).
const out = runEngine({
  demo: true,
  seed: 42,
  reason: "demo: key attacker unavailable (synthetic availability modifier)",
  iterations: 10_000,
  availability: [
    {
      teamId: "mci",
      playerName: "Demo Star",
      playerGcPer90: 0.9,
      teamGoalsPer90: 2.4,
      reason: "demo injury — synthetic for /updates feed",
    },
  ],
});

console.log("Wrote data/probabilities.json + data/updates.json");
console.log(`Moves >2pp: ${out.moves.length}; notable >5pp: ${out.notable.length}`);
for (const m of out.notable.slice(0, 8)) {
  console.log(
    `  ${m.teamId} ${m.metric} ${m.deltaPp! > 0 ? "+" : ""}${m.deltaPp}pp — ${m.reason}`
  );
}
const trophy = [...out.tournament.stage].sort(
  (a, b) => b.pTrophy - a.pTrophy
);
console.log("Top trophy probs:");
for (const row of trophy.slice(0, 5)) {
  console.log(
    `  ${row.teamId}: ${(row.pTrophy * 100).toFixed(1)}% trophy`
  );
}
