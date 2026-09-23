import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { UpdatedLabel } from "@/components/UpdatedLabel";
import { pct } from "@/lib/data/format";
import { loadProbabilities, loadTeams } from "@/lib/data/load";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const [teamsData, probs] = await Promise.all([
    loadTeams(),
    loadProbabilities(),
  ]);
  const byId = new Map(
    (probs?.tournament.stage ?? []).map((s) => [s.teamId, s]),
  );
  const sorted = [...teamsData.teams].sort((a, b) => {
    const pa = byId.get(a.id)?.pTrophy ?? 0;
    const pb = byId.get(b.id)?.pTrophy ?? 0;
    return pb - pa;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-cl-white">Teams</h1>
        <UpdatedLabel
          timestamp={probs?.timestamp ?? teamsData.timestamp}
          reason={probs?.reason ?? teamsData.reason}
          className="mt-2"
        />
      </div>
      {sorted.length === 0 ? (
        <EmptyState
          title="No teams"
          detail="Team index fills from /data/teams.json."
        />
      ) : (
        <ul className="divide-y divide-white/5 rounded-2xl border border-white/5 bg-night-850/60">
          {sorted.map((t) => {
            const sp = byId.get(t.id);
            return (
              <li key={t.id}>
                <Link
                  href={`/teams/${t.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-white/[0.03]"
                >
                  <div>
                    <p className="font-display font-semibold text-cl-white">
                      {t.name}
                    </p>
                    <p className="text-xs text-cl-muted">
                      Elo {t.elo ?? "—"} · UEFA coeff {t.uefaCoefficient ?? "—"}
                    </p>
                  </div>
                  <p className="font-display text-lg font-bold text-cl-blue">
                    {sp ? pct(sp.pTrophy, 1) : "—"}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
