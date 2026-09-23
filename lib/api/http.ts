/**
 * Shared fetch helpers: 10s timeout, 2 retries with exponential backoff.
 * Never throw uncaught — callers get ApiResult.
 */

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string; cached?: unknown };
export type ApiResult<T> = ApiOk<T> | ApiErr;

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

export async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  opts: { timeoutMs?: number; retries?: number } = {}
): Promise<ApiResult<Response>> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = opts.retries ?? MAX_RETRIES;
  let lastError = "unknown error";

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) {
        lastError = `HTTP ${res.status} ${res.statusText}`;
        if (res.status === 429 || res.status >= 500) {
          if (attempt < retries) await sleep(500 * 2 ** attempt);
          continue;
        }
        return { ok: false, error: lastError };
      }
      return { ok: true, data: res };
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt < retries) await sleep(500 * 2 ** attempt);
    }
  }
  return { ok: false, error: lastError };
}
