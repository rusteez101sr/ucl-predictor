import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "data");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function read(name) {
  const raw = await readFile(path.join(dataDir, `${name}.json`), "utf8");
  return JSON.parse(raw);
}

async function main() {
  const files = ["teams", "fixtures", "results", "coefficients", "bracket", "squads"];
  for (const name of files) {
    const doc = await read(name);
    assert(doc.timestamp, `${name}: missing timestamp`);
    assert(doc.reason, `${name}: missing reason`);
    console.log("ok", `${name}.json`);
  }
  const fixtures = await read("fixtures");
  assert((fixtures.fixtures?.length ?? 0) > 0, "fixtures empty");
  console.log("ok fixture count", fixtures.fixtures.length);
  console.log("All cache checks passed.");
}

main().catch((err) => {
  console.error("FAIL:", err.message);
  process.exit(1);
});
