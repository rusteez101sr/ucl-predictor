import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { OutcomeBars } from "@/components/OutcomeBars";
import { UpdatedLabel } from "@/components/UpdatedLabel";
import { formatKickoff, pct } from "@/lib/data/format";
import {
  loadFixtures,
  loadProbabilities,
  loadTeams,
  teamMap,
  teamName,
} from "@/lib/data/load";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [fixturesData, teamsData, probs] = await Promise.all([
    loadFixtures(),
    loadTeams(),
    loadProbabilities(),
  ]);
  const fixture = fixturesData.fixtures.find((f) => f.id === params.id);
  if (!fixture) notFound();

  const map = teamMap(teamsData.teams);
  const home = teamName(map, fixture.homeId);
  const away = teamName(map, fixture.awayId);
  const matchProb = probs?.matches.find(
    (m) => m.homeId === fixture.homeId && m.awayId === fixture.awayId,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link href="/matches" className="text-sm text-cl-blue hover:underline">
          ← Matches
        </Link>
        <p className="mt-3 text-xs uppercase tracking-wider text-cl-muted">
          {fixture.stage}
          {fixture.leg ? ` · Leg ${fixture.leg}` : ""} · {fixture.status}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-cl-white">
          {home} vs {away}
        </h1>
        <p className="mt-2 text-sm text-cl-muted">
          {formatKickoff(fixture.kickoff)}
        </p>
        <UpdatedLabel
          timestamp={probs?.timestamp}
          reason={probs?.reason}
          className="mt-2"
        />
      </div>

      {!matchProb ? (
        <EmptyState
          title="No simulation for this match"
          detail="Outcome bars and scoreline grid appear when probability tables include this fixture."
        />
      ) : (
        <>
          <section className="rounded-2xl border border-white/5 bg-night-850/70 p-5">
            <h2 className="mb-4 font-display text-lg font-semibold text-cl-white">
              Match outcome
            </h2>
            <OutcomeBars
              pHome={matchProb.pHome}
              pDraw={matchProb.pDraw}
              pAway={matchProb.pAway}
              homeLabel={home}
              awayLabel={away}
            />
            <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs">
              <div className="rounded-lg bg-night-900 p-3">
                <p className="text-cl-muted">O 2.5</p>
                <p className="mt-1 font-display text-base text-cl-white">
                  {pct(matchProb.over25, 0)}
                </p>
              </div>
              <div className="rounded-lg bg-night-900 p-3">
                <p className="text-cl-muted">U 2.5</p>
                <p className="mt-1 font-display text-base text-cl-white">
                  {pct(matchProb.under25, 0)}
                </p>
              </div>
              <div className="rounded-lg bg-night-900 p-3">
                <p className="text-cl-muted">BTTS</p>
                <p className="mt-1 font-display text-base text-cl-white">
                  {pct(matchProb.btts, 0)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/5 bg-night-850/70 p-5">
            <h2 className="mb-4 font-display text-lg font-semibold text-cl-white">
              Top scorelines
            </h2>
            <div className="grid grid-cols-5 gap-2">
              {matchProb.topScorelines.map((s) => (
                <div
                  key={`${s.home}-${s.away}`}
                  className="rounded-xl bg-night-900 px-2 py-3 text-center"
                >
                  <p className="font-display text-lg font-bold text-cl-white">
                    {s.home}–{s.away}
                  </p>
                  <p className="mt-1 text-xs text-cl-blue">{pct(s.p, 1)}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="rounded-2xl border border-white/5 bg-night-850/40 p-5">
        <h2 className="font-display text-lg font-semibold text-cl-white">
          Lineups & highlights
        </h2>
        <p className="mt-2 text-sm text-cl-muted">
          Lineups appear when cached squad data is available. Highlight embeds
          show for finished matches.
        </p>
      </section>
    </div>
  );
}
