import { loadBracket, runEngine } from "./index";

const bracket = loadBracket();
const league =
  bracket.stage === "league_phase" || bracket.ties.length === 0;

const out = runEngine({
  demo: !league,
  seed: 42,
  reason: league
    ? "10k MC; Elo + domestic/UCL-2y form + UCL KO pedigree"
    : "demo knockout Monte Carlo",
  iterations: 10_000,
});

console.log("Wrote data/probabilities.json");
const trophy = [...out.tournament.stage].sort(
  (a, b) => b.pTrophy - a.pTrophy
);
console.log("Top trophy:");
for (const row of trophy.slice(0, 10)) {
  console.log(
    `  ${row.teamId}: ${(row.pTrophy * 100).toFixed(1)}% trophy · QF ${(row.pQuarter * 100).toFixed(0)}%`
  );
}
for (const id of ["psg", "liv"]) {
  const row = out.tournament.stage.find((s) => s.teamId === id)!;
  console.log(
    `${id}: trophy ${(row.pTrophy * 100).toFixed(1)}% · QF ${(row.pQuarter * 100).toFixed(0)}% · SF ${(row.pSemi * 100).toFixed(0)}%`
  );
}
