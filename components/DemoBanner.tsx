import { loadProbabilities } from "@/lib/data/load";

/** Visible when serving the sample bracket — not the live UCL draw. */
export async function DemoBanner() {
  const probs = await loadProbabilities();
  const isDemo = probs?.demo !== false; // default on if missing; hide only when explicitly live

  if (!isDemo) return null;

  return (
    <div
      role="status"
      className="border-b border-cl-gold/30 bg-cl-gold/10 px-4 py-2.5 text-center text-sm text-cl-white"
    >
      <span className="font-medium text-cl-gold">Demo fixtures</span>
      <span className="text-cl-muted">
        {" "}
        · sample QF bracket, not the live UCL draw. Odds update when Scout
        lands a live refresh.
      </span>
    </div>
  );
}
