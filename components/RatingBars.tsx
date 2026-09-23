import { barWidth } from "@/lib/data/format";

/**
 * Engine attack/defense (league-average ≈ 1).
 * Attack: higher is stronger. Defense: lower is tighter — bar shows tightness.
 */
export function RatingBars({
  attack,
  defense,
  strength,
}: {
  attack: number;
  defense: number;
  strength?: number;
}) {
  const attackFill = Math.max(0.02, Math.min(1, attack / 2));
  const tightness = Math.max(0.02, Math.min(1, (2 - defense) / 2));

  return (
    <div className="space-y-4">
      {strength != null && (
        <p className="text-xs text-cl-muted">
          Strength index{" "}
          <span className="font-display font-semibold text-cl-white">
            {strength.toFixed(3)}
          </span>{" "}
          (0.4 UEFA + 0.6 Elo, centred ~1)
        </p>
      )}
      <div>
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-cl-white">Attack</span>
          <span className="font-display text-sm font-semibold text-cl-blue">
            {attack.toFixed(2)}
            <span className="ml-1 text-xs font-normal text-cl-muted">
              (avg 1.00)
            </span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-night-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cl-blue-dim to-cl-blue"
            style={{ width: barWidth(attackFill) }}
          />
        </div>
      </div>
      <div>
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-cl-white">
            Defense{" "}
            <span className="text-xs font-normal text-cl-muted">
              (lower = tighter)
            </span>
          </span>
          <span className="font-display text-sm font-semibold text-cl-blue">
            {defense.toFixed(2)}
            <span className="ml-1 text-xs font-normal text-cl-muted">
              (avg 1.00)
            </span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-night-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cl-blue to-cl-gold"
            style={{ width: barWidth(tightness) }}
          />
        </div>
        <p className="mt-1 text-[11px] text-cl-muted">
          Bar shows tightness — longer means fewer goals conceded in the blend.
        </p>
      </div>
    </div>
  );
}
