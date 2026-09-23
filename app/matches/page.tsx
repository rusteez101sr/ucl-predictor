import { EmptyState } from "@/components/EmptyState";
import { MatchCard } from "@/components/MatchCard";
import { UpdatedLabel } from "@/components/UpdatedLabel";
import {
  loadFixtures,
  loadProbabilities,
  loadTeams,
  teamMap,
  teamName,
} from "@/lib/data/load";


export default async function MatchesPage() {
  const [fixturesData, teamsData, probs] = await Promise.all([
    loadFixtures(),
    loadTeams(),
    loadProbabilities(),
  ]);
  const map = teamMap(teamsData.teams);
  const matchByPair = new Map(
    (probs?.matches ?? []).map((m) => [`${m.homeId}-${m.awayId}`, m]),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-cl-white">Matches</h1>
        <UpdatedLabel
          timestamp={probs?.timestamp ?? fixturesData.timestamp}
          reason={probs?.reason ?? fixturesData.reason}
          className="mt-2"
        />
      </div>
      {fixturesData.fixtures.length === 0 ? (
        <EmptyState
          title="No fixtures"
          detail="Fixtures from /data will list here."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {fixturesData.fixtures.map((f) => (
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
    </div>
  );
}
