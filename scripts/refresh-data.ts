/**
 * Scout refresh CLI: npm run data:refresh
 * Prints a thread-ready "data updated: …" line. Never exits non-zero on API fail.
 */
import { refreshData } from "../lib/api/refresh";

async function main() {
  const report = await refreshData();
  console.log(JSON.stringify(report, null, 2));
  console.log("---");
  console.log(report.threadMessage);
}

main().catch((err) => {
  // Absolute last resort — still don't crash the pipeline silently
  console.error(
    "data updated: refresh failed hard —",
    err instanceof Error ? err.message : String(err)
  );
  process.exit(0);
});
