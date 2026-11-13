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

test("동명이크레 — 이름이 같아도 다른 장이면 남남 (대표님: 외부 개체엔 같은 이름이 흔해요)", async () => {
  const run = await load([
    mk("k1", "코타", "male", { isExternal: true }), mk("k2", "코타(바다샵)", "male", { isExternal: true }),
    mk("m1", "가온이", "female"), mk("m2", "나래", "female", { adopted: true, adoptFrom: "바다샵" }),
    mk("y", "다솜이", "female", { sireId: "k1", damId: "m1" }), mk("d", "라온이", "male", { sireId: "k2", damId: "m2", adopted: true, adoptFrom: "바다샵" }),
    mk("own", "사랑이", "male", { isFromCreGunseol: true, sireId: "x", damId: "m1" }),
  ]);
  assert.deepEqual(run("return halfSibsOf(by('다솜이'), L).filter(x => x.role === 'sire').length;"), 0, "다른 코타라 아빠 쪽 반동배 아님");
  assert.equal(run("return mateWarning(by('다솜이'), by('라온이'), L);"), null);
  // 데려온 아이·외부 부모면 잇기 전에 여쭙고, 내 아이끼리면 바로 잇습니다
  assert.equal(run("return parentNeedsAsk(by('라온이'), by('코타'));"), true);
  assert.equal(run("return parentNeedsAsk(by('다솜이'), by('가온이'));"), false);
  assert.equal(run("return parentNeedsAsk(by('라온이'), by('사랑이'));"), true, "데려온 아이의 부모를 내 아이 이름에 붙일 때도 확인");
  // 다른 코타면 들인 곳을 붙여 따로, 그것도 있으면 숫자
  assert.equal(run("return uniqueParentName('코타', by('라온이'), L);"), "코타2", "코타(바다샵)이 이미 있으면 코타2");
  assert.equal(run("return uniqueParentName('코타', { adoptFrom: '하늘농장' }, L);"), "코타(하늘농장)");
});

test("혈통 카드에 반동배 줄, 메이팅 기록 화면에 경고", async () => {
  const src = await read("src/app.jsx");
  assert.match(src, /data-testid="half-sibs"/);
  assert.match(src, /반동배 \(\{h\.role === 'sire' \? '아빠' : '엄마'\}/);
  assert.match(src, /data-testid="bs-kin"/);
  assert.match(src, /const w = f && m \? mateWarning\(f, m, all\) : null;/);
  assert.match(src, /const parentKey = \(id\) => 'i:' \+ id;/, "부모는 id로만 비교");
  assert.match(src, /if \(p && target\[role\] !== p\.id && parentNeedsAsk\(target, p\)\) \{/, "대화로 부모를 이을 때 동명이면 먼저 확인");
  assert.match(src, /kind: 'parent-same'/); assert.match(src, /kind: 'parent-new'/);
  assert.match(src, /if \(kind === 'parent-same' \|\| kind === 'parent-new'\) \{/);
});
