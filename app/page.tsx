import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { MatchCard } from "@/components/MatchCard";
import { ProbabilityBar } from "@/components/ProbabilityBar";
import { UpdatedLabel } from "@/components/UpdatedLabel";
import { pct } from "@/lib/data/format";
import {
  loadFixtures,
  loadProbabilities,
  loadTeams,
  loadUpdates,
  teamMap,
  teamName,
} from "@/lib/data/load";


export default async function HomePage() {
  const [teamsData, fixturesData, probs, updatesData] = await Promise.all([
    loadTeams(),
    loadFixtures(),
    loadProbabilities(),
    loadUpdates(),
  ]);
  const map = teamMap(teamsData.teams);

  const top5 = [...(probs?.tournament.stage ?? [])]
    .sort((a, b) => b.pTrophy - a.pTrophy)
    .slice(0, 5);

  const matchByPair = new Map(
    (probs?.matches ?? []).map((m) => [`${m.homeId}-${m.awayId}`, m]),
  );

  const upcoming = fixturesData.fixtures
    .filter((f) => f.status === "SCHEDULED")
    .slice(0, 4);

  const recentUpdates = updatesData.entries.slice(0, 5);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-night-850/60 p-6 shadow-glow md:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cl-blue/10 blur-3xl" />
        <p className="text-xs uppercase tracking-[0.2em] text-cl-blue">
          Champions League night
        </p>
        <h1 className="mt-3 max-w-xl font-display text-3xl font-bold tracking-tight text-cl-white md:text-4xl">
          Knockout odds, built for the phone in your hand.
        </h1>
        <p className="mt-3 max-w-lg text-sm text-cl-muted md:text-base">
          Trophy favorites from 10,000 Monte Carlo runs. Match sims from a
          Poisson goal model. Every number carries a freshness stamp.
        </p>
        <UpdatedLabel
          timestamp={probs?.timestamp}
          reason={probs?.reason}
          className="mt-4"
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/bracket"
            className="rounded-full bg-cl-blue px-5 py-2.5 text-sm font-semibold text-night-950 shadow-glow-sm hover:bg-white"
          >
            View bracket
          </Link>
          <Link
            href="/matches"
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-cl-white hover:border-cl-blue/40"
          >
            All matches
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-display text-xl font-semibold text-cl-white">
            Top 5 trophy favorites
          </h2>
          <Link href="/teams" className="text-sm text-cl-blue hover:underline">
            All teams
          </Link>
        </div>
        {top5.length === 0 ? (
          <EmptyState
            title="No trophy odds yet"
            detail="Professor’s probability tables will show here once they land in /data."
          />
        ) : (
          <div className="space-y-4 rounded-2xl border border-white/5 bg-night-850/50 p-5">
            {top5.map((row, i) => (
              <Link key={row.teamId} href={`/teams/${row.teamId}`} className="block">
                <div className="animate-bar-in">
                  <ProbabilityBar
                    rank={i + 1}
                    label={teamName(map, row.teamId)}
                    value={row.pTrophy}
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-display text-xl font-semibold text-cl-white">
            Upcoming predicted matches
          </h2>
          <Link href="/matches" className="text-sm text-cl-blue hover:underline">
            Full list
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState
            title="No fixtures scheduled"
            detail="Sample or live fixtures will appear here when /data/fixtures.json has them."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((f) => (
              <MatchCard
                key={f.id}
                fixture={f}
                homeName={teamName(map, f.homeId)}
                awayName={teamName(map, f.awayId)}
                matchProb={matchByPair.get(`${f.homeId}-${f.awayId}`)}
                updatedAt={probs?.timestamp}
                reason={probs?.reason}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-display text-xl font-semibold text-cl-white">
            What changed
          </h2>
          <Link href="/updates" className="text-sm text-cl-blue hover:underline">
            Full feed
          </Link>
        </div>
        {recentUpdates.length === 0 ? (
          <EmptyState
            title="Quiet for now"
            detail="Moves above 2pp will show here with a timestamp and reason."
          />
        ) : (
          <ul className="space-y-3">
            {recentUpdates.map((e, i) => (
              <li
                key={`${e.timestamp}-${i}`}
                className="rounded-xl border border-white/5 bg-night-850/50 px-4 py-3"
              >
                <p className="text-sm text-cl-white">{e.reason}</p>
                <p className="mt-1 text-xs text-cl-muted">
                  {e.teamId ? `${teamName(map, e.teamId)} · ` : ""}
                  {e.deltaPp != null ? `${e.deltaPp > 0 ? "+" : ""}${e.deltaPp.toFixed(1)}pp · ` : ""}
                  {e.timestamp}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {probs && top5[0] && (
        <p className="text-center text-xs text-cl-muted">
          Current favorite: {teamName(map, top5[0].teamId)} at{" "}
          {pct(top5[0].pTrophy, 1)} to lift the trophy
        </p>
      )}
    </div>
  );
}
