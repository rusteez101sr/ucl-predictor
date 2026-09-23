import { EmptyState } from "@/components/EmptyState";
import { UpdatedLabel } from "@/components/UpdatedLabel";
import { loadTeams, loadUpdates, teamMap, teamName } from "@/lib/data/load";

export const dynamic = "force-dynamic";

export default async function UpdatesPage() {
  const [updatesData, teamsData] = await Promise.all([
    loadUpdates(),
    loadTeams(),
  ]);
  const map = teamMap(teamsData.teams);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-cl-white">
          What changed
        </h1>
        <p className="mt-2 text-sm text-cl-muted">
          Prediction moves above 2pp with timestamp and reason.
        </p>
        <UpdatedLabel
          timestamp={updatesData.timestamp}
          reason={updatesData.reason}
          className="mt-2"
        />
      </div>
      {updatesData.entries.length === 0 ? (
        <EmptyState
          title="No moves logged yet"
          detail="When a shift above 2pp is recorded, it will land here automatically."
        />
      ) : (
        <ul className="space-y-3">
          {updatesData.entries.map((e, i) => (
            <li
              key={`${e.timestamp}-${i}`}
              className="rounded-xl border border-white/5 bg-night-850/60 px-4 py-4"
            >
              <p className="text-sm text-cl-white">{e.reason}</p>
              <p className="mt-1 text-xs text-cl-muted">
                {e.teamId ? `${teamName(map, e.teamId)} · ` : ""}
                {e.deltaPp != null
                  ? `${e.deltaPp > 0 ? "+" : ""}${e.deltaPp.toFixed(1)}pp · `
                  : ""}
                {e.timestamp}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
