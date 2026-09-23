import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { ProbabilityBar } from "@/components/ProbabilityBar";
import { UpdatedLabel } from "@/components/UpdatedLabel";
import { formatKickoff } from "@/lib/data/format";
import {
  loadFixtures,
  loadInjuries,
  loadProbabilities,
  loadTeams,
  teamMap,
  teamName,
} from "@/lib/data/load";

export async function generateStaticParams() {
  const { teams } = await loadTeams();
  return teams.map((t) => ({ id: t.id }));
}


export default async function TeamDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [teamsData, probs, fixturesData, injuries] = await Promise.all([
    loadTeams(),
    loadProbabilities(),
    loadFixtures(),
    loadInjuries(),
  ]);
  const team = teamsData.teams.find((t) => t.id === params.id);
  if (!team) notFound();

  const map = teamMap(teamsData.teams);
  const stage = probs?.tournament.stage.find((s) => s.teamId === team.id);
  const upcoming = fixturesData.fixtures.filter(
    (f) => f.homeId === team.id || f.awayId === team.id,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link href="/teams" className="text-sm text-cl-blue hover:underline">
          ← Teams
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold text-cl-white">
          {team.name}
        </h1>
        <p className="mt-2 text-sm text-cl-muted">
          Elo {team.elo ?? "—"} · UEFA coefficient {team.uefaCoefficient ?? "—"}
        </p>
        <UpdatedLabel
          timestamp={probs?.timestamp}
          reason={probs?.reason}
          className="mt-2"
        />
      </div>

      <section className="rounded-2xl border border-white/5 bg-night-850/70 p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-cl-white">
          Stage probabilities
        </h2>
        {!stage ? (
          <EmptyState
            title="No stage odds"
            detail="Tournament probs will show when probabilities.json includes this team."
          />
        ) : (
          <div className="space-y-4">
            <ProbabilityBar label="Trophy" value={stage.pTrophy} />
            <ProbabilityBar label="Final" value={stage.pFinal} />
            <ProbabilityBar label="Semi-final" value={stage.pSemi} />
            <ProbabilityBar label="Quarter-final" value={stage.pQuarter} />
            {stage.pR16 != null && (
              <ProbabilityBar label="Round of 16" value={stage.pR16} />
            )}
            {stage.pKnockout != null && (
              <ProbabilityBar label="Make KO phase" value={stage.pKnockout} />
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/5 bg-night-850/70 p-5">
        <h2 className="mb-3 font-display text-lg font-semibold text-cl-white">
          Form inputs
        </h2>
        <ul className="space-y-2 text-sm text-cl-muted">
          <li>
            <span className="text-cl-white">Recent UCL sample:</span>{" "}
            {team.gfLast10 ?? "—"} GF / {team.gaLast10 ?? "—"} GA
            {team.xgForLast10 != null
              ? ` · xG ${team.xgForLast10}/${team.xgAgainstLast10 ?? "—"}`
              : ""}
          </li>
          <li>
            <span className="text-cl-white">UCL last 2 seasons:</span>{" "}
            {team.ucl2yGf != null
              ? `${team.ucl2yGf} GF / ${team.ucl2yGa ?? "—"} GA (${team.ucl2ySeasons ?? 2} seasons)`
              : "not in free slate yet"}
          </li>
          <li>
            <span className="text-cl-white">Domestic form:</span>{" "}
            {team.domesticGfLast10 != null
              ? `${team.domesticLeague ?? "Domestic"} — ${team.domesticGfLast10} GF / ${team.domesticGaLast10 ?? "—"} GA (${team.domesticPlayed ?? "?"} played)`
              : "not covered on free feeds (Bundesliga only so far; weight drops when sparse)"}
          </li>
          <li>
            <span className="text-cl-white">Injuries:</span>{" "}
            {injuries.injuries.length > 0
              ? `${injuries.injuries.length} listed`
              : "none on free tier — treated as no signal"}
          </li>
        </ul>
        {injuries.gaps && injuries.gaps.length > 0 && (
          <div className="mt-4 rounded-xl border border-white/5 bg-night-900/60 p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-cl-gold">
              Labeled gaps
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-cl-muted">
              {injuries.gaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-cl-white">
          Upcoming fixtures
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState
            title="No fixtures"
            detail="No matches involving this side in /data."
          />
        ) : (
          <ul className="space-y-2">
            {upcoming.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/matches/${f.id}`}
                  className="block rounded-xl border border-white/5 bg-night-850/50 px-4 py-3 hover:border-cl-blue/30"
                >
                  <p className="text-sm text-cl-white">
                    {teamName(map, f.homeId)} vs {teamName(map, f.awayId)}
                  </p>
                  <p className="text-xs text-cl-muted">
                    {formatKickoff(f.kickoff)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
