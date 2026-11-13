/* v1.9.64 반동배 (대표님 2026-11-13)
   "코타가 아빠인 애가 크얌이·크단이 2마리 — 엄마는 달라도 아빠가 같으니 교배하면 안 돼요"
   예전엔 혈통 카드에 아빠·엄마가 둘 다 같은 동배만 보였고, 메이팅 기록 화면은 아무 말이 없었습니다. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const read = (f) => readFile(new URL("../" + f, import.meta.url), "utf8");
async function load(inds) {
  const store = new Map(), noop = () => {};
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
  sb.__inds = inds;
  return (code) => JSON.parse(vm.runInContext(`JSON.stringify((() => { const L = __inds, by = n => L.find(i => i.name === n); ${code} })())`, sb));
}
const T = "2026-01-01T00:00:00.000Z";
const mk = (id, name, gender, extra = {}) => ({ id, name, gender, status: "own", createdAt: T, updatedAt: T, ...extra });

test("아빠만 같은 두 아이 — 반동배로 보이고, 붙이면 ⛔", async () => {
  const run = await load([
    mk("k", "코타", "male", { isExternal: true }), mk("m1", "가온이", "female"), mk("m2", "나래", "female"),
    mk("y", "다솜이", "female", { sireId: "k", damId: "m1" }), mk("d", "라온이", "male", { sireId: "k", damId: "m2" }),
    mk("z", "마루", "male", { damId: "m1" }),
  ]);
  const h = run("return halfSibsOf(by('다솜이'), L).map(x => [x.role, x.parent && x.parent.name, x.list.map(i => i.name)]);");
  assert.deepEqual(h, [["sire", "코타", ["라온이"]], ["dam", "가온이", ["마루"]]]);
  assert.deepEqual(run("return littermatesOf(by('다솜이'), L).map(i => i.name);"), [], "엄마가 다르면 동배는 아님");
  const w = run("return mateWarning(by('다솜이'), by('라온이'), L);");
  assert.equal(w.level, "danger");
  assert.match(w.text, /코타가 같은 반동배예요/);
});

test("같은 외부 수컷이 두 장으로 등록돼 있어도(이름 같음) 같은 아빠로 본다", async () => {
  const run = await load([
    mk("k1", "코타", "male", { isExternal: true }), mk("k2", "코타 ", "male", { isExternal: true }),
    mk("m1", "가온이", "female"), mk("m2", "나래", "female"),
    mk("y", "다솜이", "female", { sireId: "k1", damId: "m1" }), mk("d", "라온이", "male", { sireId: "k2", damId: "m2" }),
  ]);
  assert.deepEqual(run("return halfSibsOf(by('다솜이'), L).map(x => x.list.map(i => i.name));"), [["라온이"]]);
  assert.equal(run("return mateWarning(by('다솜이'), by('라온이'), L).level;"), "danger");
});

test("혈통 카드에 반동배 줄, 메이팅 기록 화면에 경고", async () => {
  const src = await read("src/app.jsx");
  assert.match(src, /data-testid="half-sibs"/);
  assert.match(src, /반동배 \(\{h\.role === 'sire' \? '아빠' : '엄마'\}/);
  assert.match(src, /data-testid="bs-kin"/);
  assert.match(src, /const w = f && m \? mateWarning\(f, m, all\) : null;/);
});
