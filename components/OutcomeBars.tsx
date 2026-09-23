import { pct } from "@/lib/data/format";

export function OutcomeBars({
  pHome,
  pDraw,
  pAway,
  homeLabel,
  awayLabel,
}: {
  pHome: number;
  pDraw: number;
  pAway: number;
  homeLabel: string;
  awayLabel: string;
}) {
  const rows = [
    { label: homeLabel, value: pHome, tone: "bg-cl-blue" },
    { label: "Draw", value: pDraw, tone: "bg-cl-muted/60" },
    { label: awayLabel, value: pAway, tone: "bg-cl-blue-dim" },
  ];
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-0.5 flex justify-between text-xs">
            <span className="text-cl-muted">{r.label}</span>
            <span className="text-cl-white">{pct(r.value, 0)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-night-700">
            <div
              className={`h-full rounded-full ${r.tone}`}
              style={{ width: `${Math.max(2, r.value * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
