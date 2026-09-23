import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { ProbabilityBar } from "@/components/ProbabilityBar";
import { UpdatedLabel } from "@/components/UpdatedLabel";
import { formatKickoff } from "@/lib/data/format";
import {
  loadFixtures,
  loadProbabilities,
  loadTeams,
  teamMap,
  teamName,
} from "@/lib/data/load";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [teamsData, probs, fixturesData] = await Promise.all([
    loadTeams(),
    loadProbabilities(),
    loadFixtures(),
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
            <ProbabilityBar label="Semi" value={stage.pSemi} />
            <ProbabilityBar label="Quarter" value={stage.pQuarter} />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/5 bg-night-850/70 p-5">
        <h2 className="mb-3 font-display text-lg font-semibold text-cl-white">
          Rating snapshot
        </h2>
        <p className="text-sm text-cl-muted">
          Last 10: {team.gfLast10 ?? "—"} GF / {team.gaLast10 ?? "—"} GA. Rating
          history chart will use Recharts once time-series Elo is in /data.
        </p>
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
