export function pct(p: number, digits = 0): string {
  return `${(p * 100).toFixed(digits)}%`;
}

export function formatUpdated(timestamp?: string, reason?: string): string {
  if (!timestamp) return reason ? `demo · ${reason}` : "no update yet";
  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return reason ?? "updated";
  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  let ago: string;
  if (sec < 60) ago = "just now";
  else if (sec < 3600) ago = `${Math.floor(sec / 60)}m ago`;
  else if (sec < 86400) ago = `${Math.floor(sec / 3600)}h ago`;
  else ago = `${Math.floor(sec / 86400)}d ago`;
  return reason ? `updated ${ago} · ${reason}` : `updated ${ago}`;
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
