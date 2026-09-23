import Link from "next/link";
import { formatKickoff, pct } from "@/lib/data/format";
import type { Fixture, MatchProb } from "@/lib/data/types";
import { OutcomeBars } from "./OutcomeBars";
import { UpdatedLabel } from "./UpdatedLabel";

export function MatchCard({
  fixture,
  homeName,
  awayName,
  matchProb,
  updatedAt,
  reason,
}: {
  fixture: Fixture;
  homeName: string;
  awayName: string;
  matchProb?: MatchProb;
  updatedAt?: string;
  reason?: string;
}) {
  return (
    <Link
      href={`/matches/${fixture.id}`}
      className="block rounded-2xl border border-white/5 bg-night-850/80 p-4 shadow-glow-sm transition hover:border-cl-blue/30 hover:bg-night-800"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-cl-muted">
            {fixture.stage}
            {fixture.leg ? ` · Leg ${fixture.leg}` : ""}
          </p>
          <p className="mt-1 font-display text-base font-semibold text-cl-white">
            {homeName}{" "}
            <span className="text-cl-muted font-normal">vs</span> {awayName}
          </p>
          <p className="mt-1 text-xs text-cl-muted">
            {formatKickoff(fixture.kickoff)}
          </p>
        </div>
        {matchProb && (
          <div className="rounded-lg bg-night-900 px-2 py-1 text-right">
            <p className="text-[10px] uppercase text-cl-muted">Home</p>
            <p className="font-display text-lg font-bold text-cl-blue">
              {pct(matchProb.pHome, 0)}
            </p>
          </div>
        )}
      </div>
      {matchProb ? (
        <OutcomeBars
          pHome={matchProb.pHome}
          pDraw={matchProb.pDraw}
          pAway={matchProb.pAway}
          homeLabel={homeName}
          awayLabel={awayName}
        />
      ) : (
        <p className="text-sm text-cl-muted">No prediction yet for this fixture.</p>
      )}
      <UpdatedLabel
        timestamp={updatedAt}
        reason={reason}
        className="mt-3"
      />
    </Link>
  );
}
