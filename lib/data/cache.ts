/**
 * /data/*.json cache helpers.
 * Every write stamps top-level { timestamp, reason }.
 */

import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export type CacheMeta = {
  timestamp: string;
  reason: string;
};

function filePath(name: string): string {
  const safe = name.replace(/\.json$/i, "").replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(DATA_DIR, `${safe}.json`);
}

export async function readJson<T extends object>(name: string): Promise<T> {
  const raw = await fs.readFile(filePath(name), "utf8");
  return JSON.parse(raw) as T;
}

/** Merge data with timestamp+reason and write. */
export async function writeJson<T extends object>(
  name: string,
  data: T,
  reason: string
): Promise<T & CacheMeta> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const payload = {
    ...data,
    timestamp: new Date().toISOString(),
    reason,
  };
  await fs.writeFile(
    filePath(name),
    JSON.stringify(payload, null, 2) + "\n",
    "utf8"
  );
  return payload;
}

export async function exists(name: string): Promise<boolean> {
  try {
    await fs.access(filePath(name));
    return true;
  } catch {
    return false;
  }
}
