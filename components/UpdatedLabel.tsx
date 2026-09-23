import { formatUpdated } from "@/lib/data/format";

export function UpdatedLabel({
  timestamp,
  reason,
  className = "",
}: {
  timestamp?: string;
  reason?: string;
  className?: string;
}) {
  return (
    <p className={`text-xs text-cl-muted ${className}`}>
      {formatUpdated(timestamp, reason)}
    </p>
  );
}
