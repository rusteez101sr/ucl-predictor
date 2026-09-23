import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { UpdatedLabel } from "@/components/UpdatedLabel";
import { barWidth, pct } from "@/lib/data/format";
import {
  loadBracket,
  loadFixtures,
  loadProbabilities,
  loadTeams,
  teamMap,
  teamName,
} from "@/lib/data/load";


export default async function BracketPage() {
  const [bracket, teamsData, probs, fixturesData] = await Promise.all([
    loadBracket(),
    loadTeams(),
    loadProbabilities(),
    loadFixtures(),
  ]);
  const map = teamMap(teamsData.teams);
  const advance = probs?.tournament.tieAdvance ?? {};

  const fixtureForTie = (homeId: string, awayId: string) =>
    fixturesData.fixtures.find(
      (f) => f.homeId === homeId && f.awayId === awayId,
    );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-cl-blue">
          Knockout
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-cl-white">
          Bracket
        </h1>
        <p className="mt-2 max-w-xl text-sm text-cl-muted">
          Advancement odds from the tournament Monte Carlo. Tap a tie for the
          match page.
        </p>
        <UpdatedLabel
          timestamp={probs?.timestamp ?? bracket.timestamp}
          reason={probs?.reason ?? bracket.reason}
          className="mt-3"
        />
      </div>

      {bracket.ties.length === 0 ? (
        <EmptyState
          title="Bracket not loaded"
          detail="Ties will appear when /data/bracket.json is present."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bracket.ties.map((tie) => {
            const adv = advance[tie.id];
            const pHome = adv?.pHomeAdvances ?? 0.5;
            const pAway = 1 - pHome;
            const fixture = fixtureForTie(tie.homeId, tie.awayId);
            const href = fixture
              ? `/matches/${fixture.id}`
              : `/teams/${tie.homeId}`;
            const home = teamName(map, tie.homeId);
            const away = teamName(map, tie.awayId);

            return (
              <Link
                key={tie.id}
                href={href}
                className="block rounded-2xl border border-white/5 bg-night-850/70 p-5 transition hover:border-cl-blue/35 hover:shadow-glow-sm"
              >
                <p className="text-[11px] uppercase tracking-wider text-cl-muted">
                  {tie.stage} · {tie.id.toUpperCase()}
                </p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display text-base font-semibold text-cl-white">
                      {home}
                    </span>
                    <span className="font-display text-lg font-bold text-cl-blue">
                      {pct(pHome, 0)}
                    </span>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-night-700">
                    <div
                      className="h-full bg-cl-blue"
                      style={{ width: barWidth(pHome, 0) }}
                    />
                    <div
                      className="h-full bg-cl-blue-dim/70"
                      style={{ width: barWidth(pAway, 0) }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display text-base font-semibold text-cl-white">
                      {away}
                    </span>
                    <span className="font-display text-lg font-bold text-cl-muted">
                      {pct(pAway, 0)}
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-cl-muted">
                  Chance to advance · two-legged, no away goals
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
