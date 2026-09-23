import { loadBracket, runEngine } from "./index";

const bracket = loadBracket();
const league =
  bracket.stage === "league_phase" || bracket.ties.length === 0;

const out = runEngine({
  demo: !league,
  seed: 42,
  reason: league
    ? "10k MC with domestic+UCL-2y form blend (empty injuries ignored)"
    : "demo knockout Monte Carlo",
  iterations: 10_000,
});

console.log("Wrote data/probabilities.json");
console.log(`demo=${out.demo} matches=${out.matches.length} iters=${out.tournament.iterations}`);
const trophy = [...out.tournament.stage].sort(
  (a, b) => b.pTrophy - a.pTrophy
);
console.log("Top trophy / QF / SF:");
for (const row of trophy.slice(0, 8)) {
  console.log(
    `  ${row.teamId}: trophy ${(row.pTrophy * 100).toFixed(1)}% · QF ${(row.pQuarter * 100).toFixed(0)}% · SF ${(row.pSemi * 100).toFixed(0)}% · R16 ${((row.pR16 ?? 0) * 100).toFixed(0)}%`
  );
}
const liv = out.tournament.stage.find((s) => s.teamId === "liv");
if (liv) {
  console.log(
    `Liverpool: KO ${((liv.pKnockout ?? 0) * 100).toFixed(0)}% · R16 ${((liv.pR16 ?? 0) * 100).toFixed(0)}% · QF ${(liv.pQuarter * 100).toFixed(0)}% · SF ${(liv.pSemi * 100).toFixed(0)}% · Final ${(liv.pFinal * 100).toFixed(0)}% · Trophy ${(liv.pTrophy * 100).toFixed(1)}%`
  );
}
