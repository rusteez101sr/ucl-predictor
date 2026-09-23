import { loadBracket, runEngine } from "./index";

const bracket = loadBracket();
const league =
  bracket.stage === "league_phase" || bracket.ties.length === 0;

const out = runEngine({
  // League-phase live slate → non-demo; knockout sample → demo seed.
  demo: !league,
  seed: 42,
  reason: league
    ? "league-phase Monte Carlo on Scout free 2026/27 MD1+MD2 slate"
    : "demo knockout Monte Carlo",
  iterations: league ? 8_000 : 10_000,
});

console.log("Wrote data/probabilities.json");
console.log(`demo=${out.demo} matches=${out.matches.length}`);
console.log(`Moves >2pp: ${out.moves.length}; notable >5pp: ${out.notable.length}`);
for (const m of out.notable.slice(0, 10)) {
  console.log(
    `  ${m.teamId} ${m.metric} ${m.deltaPp! > 0 ? "+" : ""}${m.deltaPp}pp`
  );
}
const trophy = [...out.tournament.stage].sort(
  (a, b) => b.pTrophy - a.pTrophy
);
console.log("Top trophy probs:");
for (const row of trophy.slice(0, 8)) {
  console.log(
    `  ${row.teamId}: ${(row.pTrophy * 100).toFixed(1)}% trophy · ${(row.pSemi * 100).toFixed(0)}% R16`
  );
}
