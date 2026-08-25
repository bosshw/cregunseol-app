import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const file = (name) => new URL(name, root);

test("keeps storage, synchronization, and core workflows intact", async () => {
  const source = await readFile(file("src/app.jsx"), "utf8");

  for (const contract of [
    "cg_individuals",
    "cg_events",
    "cg_reminders",
    "cg_settings",
    "cg_dirty",
    "cg_tombstones",
    "firstSync()",
    "pullReplace()",
    "compressImage(file, cb)",
    "function SmartChatScreen",
    "recordSale(id, opt)",
    "function buildWorkbook",
    "ReactDOM.createRoot",
  ]) {
    assert.ok(source.includes(contract), `missing contract: ${contract}`);
  }

  assert.match(source, /const APP_VERSION = '4\.2'/);
  assert.match(source, /addEvents\(events\)/);
  assert.match(source, /DB\.addEvents\(additions\)/);
  assert.doesNotMatch(
    source.match(/const allAte = \(\) => \{[\s\S]*?\n  \};/)?.[0] ?? "",
    /DB\.addEvent\(/,
  );
});

test("keeps service worker and release metadata aligned", async () => {
  const [worker, version] = await Promise.all([
    readFile(file("sw.js"), "utf8"),
    readFile(file("version.json"), "utf8").then(JSON.parse),
  ]);

  assert.equal(version.app, "4.2");
  assert.equal(version.schema, 1);
  assert.equal(version.minSchema, 1);
  assert.match(worker, /const CACHE = 'creg-v42'/);
  for (const asset of [
    "./index.html",
    "./app.min.js",
    "./vendor/react.production.min.js",
    "./vendor/react-dom.production.min.js",
  ]) {
    assert.ok(worker.includes(asset), `service worker is missing ${asset}`);
  }
  assert.doesNotMatch(worker, /babel|cdnjs\.cloudflare\.com/i);
  await access(file("app.min.js"));
});
