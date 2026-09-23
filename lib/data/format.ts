/** Format a 0–1 probability as a display percent string. */
export function pct(p: number, digits = 0): string {
  if (!Number.isFinite(p)) return "—";
  return `${(p * 100).toFixed(digits)}%`;
}

/**
 * CSS width for a probability bar. Rounds to 1 decimal so we never paint
 * float noise like 14.499999999999998%.
 */
export function barWidth(p: number, min = 2): string {
  if (!Number.isFinite(p) || p <= 0) return `${min}%`;
  const w = Math.max(min, Math.min(100, Math.round(p * 1000) / 10));
  return `${w}%`;
}

/** Drop internal/test stamps so the UI never shows engine debug reasons. */
function cleanReason(reason?: string): string | undefined {
  if (!reason) return undefined;
  const r = reason.trim();
  if (!r) return undefined;
  if (/determinism/i.test(r)) return undefined;
  if (/^seed\b/i.test(r)) return undefined;
  if (/unit.?test/i.test(r)) return undefined;
  return r;
}

export function formatUpdated(timestamp?: string, reason?: string): string {
  const why = cleanReason(reason);
  if (!timestamp) return why ? `demo · ${why}` : "no update yet";
  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return why ?? "updated";
  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  let ago: string;
  if (sec < 60) ago = "just now";
  else if (sec < 3600) ago = `${Math.floor(sec / 60)}m ago`;
  else if (sec < 86400) ago = `${Math.floor(sec / 3600)}h ago`;
  else ago = `${Math.floor(sec / 86400)}d ago`;
  return why ? `updated ${ago} · ${why}` : `updated ${ago}`;
}

export function formatKickoff(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Chicago",
      timeZoneName: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
