import { barWidth, pct } from "@/lib/data/format";

export function ProbabilityBar({
  label,
  value,
  rank,
}: {
  label: string;
  value: number;
  rank?: number;
}) {
  return (
    <div className="group">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {rank != null && (
            <span className="w-5 shrink-0 text-xs font-medium text-cl-muted">
              {rank}
            </span>
          )}
          <span className="truncate text-sm font-medium text-cl-white">
            {label}
          </span>
        </div>
        <span className="shrink-0 font-display text-sm font-semibold text-cl-blue">
          {pct(value, 1)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-night-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cl-blue-dim to-cl-blue transition-[width] duration-700 ease-out"
          style={{ width: barWidth(value) }}
        />
      </div>
    </div>
  );
}
