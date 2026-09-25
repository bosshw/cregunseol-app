/* v1.9 부화 기간 학습 — 실제 앱 코드(app.min.js)를 가짜 브라우저에 올려 clutchRows 를 그대로 돌립니다. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

async function loadApp() {
  const store = new Map();
  const noop = () => {};
  const el = () => ({ style: { setProperty: noop }, appendChild: noop, addEventListener: noop, setAttribute: noop });
  const sb = {
    console, setTimeout, clearTimeout, setInterval, clearInterval, Math, JSON, Promise, URL, URLSearchParams, Date, Intl,
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k), key: i => [...store.keys()][i], get length() { return store.size; } },
    navigator: { userAgent: "node", serviceWorker: { addEventListener: noop, register: () => Promise.resolve() } },
    document: { documentElement: el(), getElementById: el, createElement: el, head: el(), body: el(), addEventListener: noop, querySelector: () => null },
    location: { search: "", pathname: "/", href: "http://x/" }, history: { pushState: noop, replaceState: noop },
    fetch: () => Promise.reject(new Error("offline")), matchMedia: () => ({ matches: false, addEventListener: noop }),
    React: { createElement: () => ({}), Fragment: "f" }, ReactDOM: { createRoot: () => ({ render: noop }) },
    addEventListener: noop, removeEventListener: noop, innerHeight: 800, visualViewport: null,
  };
  sb.window = sb; sb.globalThis = sb; sb.self = sb;
  vm.createContext(sb);
  vm.runInContext(await readFile(new URL("../app.min.js", import.meta.url), "utf8"), sb);
  return c => vm.runInContext(c, sb);
}
const days = (a, n) => new Date(new Date(a).getTime() + n * 864e5).toISOString().slice(0, 10);

test("learns hatch days from real hatch records (mother first, then the whole house, then temperature)", async () => {
  const run = await loadApp();
  const today = new Date().toISOString().slice(0, 10);
  const L1 = days(today, -200), L2 = days(today, -170), L3 = days(today, -20), L4 = days(today, -15);
  run(`DB.saveIndividuals([{id:'a',name:'라떼',gender:'female'},{id:'b',name:'보리',gender:'female'}]);
       DB.saveEvents([{id:'l3',individualId:'a',type:'laying',date:'${L3}',data:{}}]);`);
  assert.equal(run("clutchRows()[0].hatchBasis"), "인큐 24°C 기준");
  assert.equal(run("clutchRows()[0].hatchDays"), 75);
  run(`DB.saveEvents([
    {id:'l1',individualId:'a',type:'laying',date:'${L1}',data:{}},{id:'h1',individualId:'a',type:'hatching',date:'${days(L1, 68)}',data:{layingId:'l1'}},
    {id:'l2',individualId:'a',type:'laying',date:'${L2}',data:{}},{id:'h2',individualId:'a',type:'hatching',date:'${days(L2, 70)}',data:{layingId:'l2'}},
    {id:'l3',individualId:'a',type:'laying',date:'${L3}',data:{}},{id:'l4',individualId:'b',type:'laying',date:'${L4}',data:{}}]);`);
  const mom = run("JSON.stringify(clutchRows().find(r => r.e.id === 'l3'))");
  const house = run("JSON.stringify(clutchRows().find(r => r.e.id === 'l4'))");
  assert.deepEqual([JSON.parse(mom).hatchDays, JSON.parse(mom).hatchBasis, JSON.parse(mom).etaISO], [69, "라떼 실제 부화 2회 평균", days(L3, 69)]);
  assert.deepEqual([JSON.parse(house).hatchDays, JSON.parse(house).hatchBasis], [69, "우리 집 실제 부화 2회 평균"]);
  // 온도를 바꾸면 그 뒤에 낳은 알부터 다시 배웁니다
  run(`DB.saveSettings({ incubateTemp: 26, incubateTempAt: '${days(today, -30)}' })`);
  assert.equal(run("clutchRows().find(r => r.e.id === 'l3').hatchBasis"), "인큐 26°C 기준");
});

test("keeps hatch learning in one place and remembers when the temperature changed", async () => {
  const source = await readFile(new URL("../src/app.jsx", import.meta.url), "utf8");
  assert.match(source, /function hatchLearn\(samples\)/);
  assert.match(source, /const etaISO = addDaysISO\(e\.date, hp\.days\)/);
  assert.match(source, /incubateTempAt: todayStr\(\)/);
  assert.match(source, /x\.days >= 40 && x\.days <= 130/);
});
