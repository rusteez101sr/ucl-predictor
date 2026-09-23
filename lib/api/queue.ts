/**
 * In-memory request queue for football-data.org (10 req/min → ~6s spacing).
 */

const MIN_INTERVAL_MS = 6_000;
let chain: Promise<unknown> = Promise.resolve();
let lastStart = 0;

export function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = async (): Promise<T> => {
    const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastStart));
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastStart = Date.now();
    return fn();
  };
  const next = chain.then(run, run);
  chain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}
