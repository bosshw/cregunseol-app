/* v1.9.65 메이팅은 암컷 쪽에 (대표님 2026-11-20)
   "크밀이랑 크금이 메이팅했어"라고 적으니 저장은 됐는데 산란 예정이 안 떴습니다.
   수컷 이름을 먼저 말하면 메이팅이 수컷 쪽에 저장됐고, 산란 예정은 암컷 기록만 봤기 때문입니다. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const read = (f) => readFile(new URL("../" + f, import.meta.url), "utf8");
async function load(seed) {
  const store = new Map(Object.entries(seed).map(([k, v]) => [k, JSON.stringify(v)])), noop = () => {};
  const el = () => ({ style: { setProperty: noop }, appendChild: noop, addEventListener: noop, setAttribute: noop });
  const sb = { console, setTimeout, clearTimeout, setInterval, clearInterval, Math, JSON, Promise, URL, URLSearchParams, Date, Intl, Uint8Array,
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k), key: i => [...store.keys()][i], get length() { return store.size; } },
    navigator: { userAgent: "node" }, document: { documentElement: el(), getElementById: el, createElement: el, head: el(), body: el(), addEventListener: noop, querySelector: () => null },
    location: { search: "", pathname: "/", href: "http://x/", origin: "http://x" }, history: { pushState: noop, replaceState: noop }, fetch: () => Promise.reject(new Error("offline")),
    matchMedia: () => ({ matches: false, addEventListener: noop }), React: { createElement: () => ({}), Fragment: "f" }, ReactDOM: { createRoot: () => ({ render: noop }) },
    addEventListener: noop, removeEventListener: noop, dispatchEvent: noop, innerHeight: 800 };
  sb.window = sb; sb.globalThis = sb; sb.self = sb;
  vm.createContext(sb);
  vm.runInContext(await read("app.min.js"), sb);
  return (code) => JSON.parse(vm.runInContext(`JSON.stringify((() => { ${code} })())`, sb));
}
const T = "2026-01-01T00:00:00.000Z";
const today = new Date().toISOString().slice(0, 10);
const inds = [
  { id: "m", name: "가람이", gender: "male", status: "own", createdAt: T, updatedAt: T },
  { id: "f", name: "누리", gender: "female", status: "own", createdAt: T, updatedAt: T },
];

test("수컷 쪽에 저장돼 있던 메이팅은 열 때 암컷 쪽으로 옮기고, 산란 예정이 뜬다", async () => {
  const run = await load({ cg_individuals: inds,
    cg_events: [{ id: "e1", individualId: "m", type: "mating", date: today, data: { partnerId: "f", partnerName: "누리" }, createdAt: T, updatedAt: T }] });
  assert.equal(run("return layingForecasts().length;"), 0, "고치기 전: 예정 없음(예전 문제)");
  assert.ok(run("return DB.relabelAll();") >= 1);
  const e = run("return DB.getEvents()[0];");
  assert.equal(e.individualId, "f"); assert.equal(e.data.partnerId, "m"); assert.equal(e.data.partnerName, "가람이");
  const fc = run("return layingForecasts();");
  assert.equal(fc.length, 1); assert.equal(fc[0].name, "누리"); assert.equal(fc[0].basis, "메이팅 기준");
  assert.equal(fc[0].dadName, "가람이");
});

test("암컷 쪽 메이팅은 그대로, 버튼으로 수컷을 엄마 칸에 넣어도 암컷 쪽에 저장", async () => {
  const run = await load({ cg_individuals: inds, cg_events: [] });
  assert.equal(run("return matingMother('f', 'm');"), null);
  assert.equal(run("return matingMother('m', 'f').id;"), "f");
  run(`recordMating({ femaleId: 'm', partnerId: 'f', date: '${today}' }); return 1;`);
  const e = run("return DB.getEvents()[0];");
  assert.equal(e.individualId, "f"); assert.equal(e.data.partnerId, "m");
});

test("대화 저장도 메이팅을 암컷 쪽에 둔다", async () => {
  const src = await read("src/app.jsx");
  assert.match(src, /if \(f\.type === 'mating' && fdata\.partnerId\) \{\s+\/\/ v1\.9\.65/);
  assert.match(src, /const mom = matingMother\(f\.targetId, fdata\.partnerId\);/);
});
