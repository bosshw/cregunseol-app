/* v1.9.68 열성(아잔틱·초초) 헷 자동 표기 (대표님 2026-11-20)
   "부모가 헷이면 자식도 헷으로 자동으로 — 100헷초초 × 100헷초초면 66헷초초"
   "57헷 40헷은 안 쓰는 말이니까 50헷, 25헷으로" · "이미 태어난 애들까지 싹" · "초초도 열성이다" */
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
const G = (id, name, gender, morph, extra) => ({ id, name, gender, morph, status: "own", createdAt: T, updatedAt: T, ...(extra || {}) });

test("부모 모프로 아기 헷 — 취미 단계(100·66·50·25)로만", async () => {
  const run = await load({});
  const tag = (a, b) => run(`return inheritRecessive({ morph: ${JSON.stringify(a)} }, { morph: ${JSON.stringify(b)} }).map(x => x.tag).join(' ');`);
  assert.equal(tag("100헷초초", "100헷초초"), "66헷초초");
  assert.equal(tag("100헷초초", "릴리화이트"), "50헷초초");
  assert.equal(tag("아잔틱", ""), "100헷아잔틱");
  assert.equal(tag("아잔틱", "아잔틱"), "아잔틱", "둘 다 보이면 보이는 것");
  assert.equal(tag("100헷초초", "50헷초초"), "50헷초초", "57헷 → 50헷");
  assert.equal(tag("50헷초초", "50헷초초"), "25헷초초", "40헷 → 25헷");
  assert.equal(tag("50헷초초", ""), "25헷초초");
  assert.equal(tag("25헷초초", ""), "", "25 밑은 안 붙임");
  assert.equal(tag("초초", "100헷초초"), "100헷초초", "안 나온 아이는 100헷");
  assert.equal(tag("66헷초초", "66헷초초"), "50헷초초");
  assert.equal(tag("100% 헷 아잔틱 릴리", "헷100 초초"), "50헷아잔틱 50헷초초");
  assert.equal(tag("릴리화이트", "할리퀸"), "", "열성 기록이 없으면 아무것도 안 붙임");
});

test("모프 읽기 — 헷과 보이는 것을 나눈다", async () => {
  const run = await load({});
  const st = (m, k) => run(`return recState(${JSON.stringify(m)}, RECESSIVE_GENES.find(g => g.key === '${k}'));`);
  assert.deepEqual(st("초초", "choco"), { vis: true });
  assert.deepEqual(st("50헷초초", "choco"), { het: 50 });
  assert.deepEqual(st("66% 헷 초초", "choco"), { het: 66 });
  assert.deepEqual(st("헷초초", "choco"), { het: 100 });
  assert.deepEqual(st("초초헷", "choco"), { het: 100 });
  assert.deepEqual(st("아잔틱 헷초초", "axan"), { vis: true }, "뒤 유전자의 헷을 앞 것으로 읽지 않음");
  assert.deepEqual(st("아잔틱 헷초초", "choco"), { het: 100 });
  assert.equal(st("릴리화이트", "choco"), null);
  assert.equal(run(`return readGenes({ morph: '100헷아잔틱' }).axan;`), false, "헷아잔틱은 보이는 아잔틱이 아님");
  assert.equal(run(`return readGenes({ morph: '아잔틱' }).axan;`), true);
  assert.equal(run(`return morphSansHet('릴리화이트 66헷초초');`), "릴리화이트");
  assert.equal(run(`return morphSansHet('50% 헷 아잔틱');`), "");
  assert.equal(run(`return mergeHetTags('릴리화이트', '66헷초초');`), "릴리화이트 66헷초초");
  assert.equal(run(`return mergeHetTags('초초', '66헷초초');`), "초초", "새 모프가 그 유전자를 말하면 새 것만");
});

test("이미 태어난 아이들 — 한 번에, 손주까지, 적힌 모프는 그대로 두고 덧붙임", async () => {
  const run = await load({ cg_individuals: [
    G("d", "크빛이", "male", "100헷초초"), G("m", "크솔이", "female", "100헷초초 릴리화이트"),
    G("k1", "빛솔1호", "unknown", "", { sireId: "d", damId: "m", morphUnknown: true }),
    G("k2", "빛솔2호", "female", "릴리화이트", { sireId: "d", damId: "m" }),
    G("k3", "빛솔3호", "unknown", "초초", { sireId: "d", damId: "m" }),
    G("x", "외부수", "male", "할리퀸"),
    G("g1", "손주1호", "unknown", "", { sireId: "x", damId: "k2", morphUnknown: true }),
    G("a", "아잔틱맘", "female", "아잔틱"), G("b1", "아잔1호", "unknown", "", { damId: "a", morphUnknown: true }),
    G("lone", "혼자", "female", ""),
  ] });
  const ch = run("return runHetBackfillOnce();");
  const by = {}; run("return DB.getIndividuals();").forEach(i => { by[i.id] = i; });
  assert.equal(by.k1.morph, "66헷초초");
  assert.equal(by.k1.morphUnknown, true, "헷만 붙었으면 모프는 아직 모름");
  assert.equal(by.k2.morph, "릴리화이트 66헷초초");
  assert.equal(by.k3.morph, "초초", "이미 초초라고 적힌 아이는 그대로");
  assert.equal(by.g1.morph, "25헷초초", "손주: 66헷 × 일반 = 33% → 25헷");
  assert.equal(by.b1.morph, "100헷아잔틱", "모르는 아빠는 일반으로");
  assert.equal(by.lone.morph, "");
  assert.equal(by.d.morph, "100헷초초", "부모 기록이 없는 아이는 안 건드림");
  assert.equal(ch.length, 4);
  assert.equal(run("return runHetBackfillOnce();"), null, "한 번만");
  assert.ok(run("return JSON.parse(localStorage.getItem('cg_het_fill_log')).length;") === 4, "바꾼 목록을 남겨 둠");
});

test("새로 등록하는 아기 — 등록할 때 헷이 붙는다 (세 군데 모두)", async () => {
  const run = await load({ cg_individuals: [G("d", "크빛이", "male", "100헷초초"), G("m", "크솔이", "female", "아잔틱")] });
  const b = run(`return babyWithHet({ name: 'n', morph: '', morphUnknown: true, sireId: 'd', damId: 'm' });`);
  assert.equal(b.morph, "100헷아잔틱 50헷초초");
  assert.equal(b.morphUnknown, true);
  const b2 = run(`return babyWithHet({ name: 'n', morph: '할리퀸', sireId: 'd', damId: 'm' });`);
  assert.equal(b2.morph, "할리퀸 100헷아잔틱 50헷초초");
  assert.equal(b2.morphUnknown, false);
  const app = await read("src/app.jsx");
  assert.equal((app.match(/DB\.addIndividual\(babyWithHet\(/g) || []).length, 3, "부화 등록 세 군데");
  assert.match(app, /p\.morph\.trim\(\) && !\('morphUnknown' in p\)\) p\.morphUnknown = false/);
});

test("짝 미리보기 — 헷까지 계산하고 초초는 무늬가 아니라 열성", async () => {
  const run = await load({});
  const f = run(`return morphForecast({ name: 'a', morph: '100헷초초' }, { name: 'b', morph: '100헷초초' });`);
  assert.ok(f.sure.includes("초초 — 25%"), f.sure.join("|"));
  assert.ok(f.sure.includes("초초 안 나온 아이는 66헷초초"), f.sure.join("|"));
  assert.equal(f.trend.length, 0, "초초는 더 이상 무늬 경향으로 안 봄");
  const g = run(`return morphForecast({ name: 'a', morph: '아잔틱' }, { name: 'b', morph: '릴리화이트' });`);
  assert.ok(g.sure.includes("베이비는 100헷아잔틱"), g.sure.join("|"));
  assert.ok(g.notes.some(n => /b 쪽은 아잔틱 기록이 없어 일반으로/.test(n)));
});

test("대화로 모프를 말해도 부모 기준 헷은 남는다 · 헷만 있던 칸은 빈 칸처럼", async () => {
  const run = await load({ cg_individuals: [G("k", "빛솔1호", "unknown", "66헷초초", { morphUnknown: true })] });
  assert.equal(run(`return planProfileFix(DB.getIndividuals()[0], '빛솔1호 모프 릴리화이트야', DB.getIndividuals(), '릴리화이트');`), null, "헷만 있으면 되묻지 않고 그대로 적음");
  const p = run(`return planProfileFix({ ...DB.getIndividuals()[0], morph: '할리퀸 66헷초초' }, '빛솔1호 모프 릴리화이트야', DB.getIndividuals(), '릴리화이트');`);
  assert.equal(p.kind, "ask"); assert.equal(p.to, "릴리화이트 66헷초초");
  const app = await read("src/app.jsx");
  assert.match(app, /const morph = mergeHetTags\(morph0, before\.morph\);/);
});
