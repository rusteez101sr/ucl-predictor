import { runEngine } from "./index";

const out = runEngine({
  demo: true,
  seed: 42,
  reason: "initial demo Monte Carlo — Professor bootstrap",
});

const trophy = [...out.tournament.stage].sort(
  (a, b) => b.pTrophy - a.pTrophy
);
console.log("Wrote data/probabilities.json");
console.log("Top trophy probs:");
for (const row of trophy.slice(0, 5)) {
  console.log(
    `  ${row.teamId}: ${(row.pTrophy * 100).toFixed(1)}% trophy, ${(row.pFinal * 100).toFixed(1)}% final`
  );
}
