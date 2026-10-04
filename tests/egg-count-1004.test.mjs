/* v1.9.18 — 대표님 발견(2026-10-04): 초창기 산란은 알 개수를 안 적어서 공유 기록에 "알 0개 · 1마리 부화"로 나왔습니다.
   ① 공유 기록은 안 적은 알 개수를 0개로 보이지 않게  ② 브리핑 맨 위 '오늘의 제안'에서 빈칸을 채우게 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = (f) => readFile(new URL(f, root), "utf8");
async function loadApp() {
  const store = new Map();
  const noop = () => {};
  const el = () => ({ style: { setProperty: noop }, appendChild: noop, addEventListener: noop, setAttribute: noop });
  const sb = {
    console, setTimeout, clearTimeout, setInterval, clearInterval, Math, JSON, Promise, URL, URLSearchParams, Date, Intl,
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k), key: i => [...store.keys()][i], get length() { return store.size; } },
    navigator: { userAgent: "node", serviceWorker: { addEventListener: noop, register: () => Promise.resolve() } },
    document: { documentElement: el(), getElementById: el, createElement: el, head: el(), body: el(), addEventListener: noop, querySelector: () => null },
    location: { search: "", pathname: "/", href: "http://x/", origin: "http://x" }, history: { pushState: noop, replaceState: noop },
    fetch: () => Promise.reject(new Error("offline")), matchMedia: () => ({ matches: false, addEventListener: noop }),
    React: { createElement: () => ({}), Fragment: "f" }, ReactDOM: { createRoot: () => ({ render: noop }) },
    addEventListener: noop, removeEventListener: noop, dispatchEvent: noop, innerHeight: 800, visualViewport: null,
  };
  sb.window = sb; sb.globalThis = sb; sb.self = sb;
  vm.createContext(sb);
  vm.runInContext(await read("app.min.js"), sb);
  const run = (c) => vm.runInContext(c, sb);
  return { run, json: (c) => JSON.parse(run(`JSON.stringify(${c})`)) };
}

test("share record never shows an unwritten egg count as 0", async () => {
  const { run, json } = await loadApp();
  run(`DB.saveIndividuals([{ id: 'a', name: '크범이', gender: 'female' }, { id: 'b', name: '크림이', gender: 'male' }]);
       DB.saveEvents([{ id: 'l1', individualId: 'a', type: 'laying', date: '2026-01-09', data: {} },
                      { id: 'h1', individualId: 'a', type: 'hatching', date: '2026-03-25', data: { count: 1, layingId: 'l1' } },
                      { id: 'l2', individualId: 'a', type: 'laying', date: '2026-02-28', data: { eggCount: 1 } }]);`);
  const br = json(`publicSnapshot(DB.getIndividuals()[0]).breeding`);
  assert.equal(br.eggs, 1); assert.equal(br.eggsUnknown, 1);
  assert.equal(br.recent.find(r => r.date === '2026-01-09').eggs, null, "안 적은 산란은 null");
  const page = await read("g.html");
  assert.match(page, /c\.eggs \? '알 ' \+ esc\(c\.eggs\) \+ '개 · ' : ''/, "줄에서는 '알 0개'를 쓰지 않습니다");
  assert.match(page, /br\.eggsUnknown \?/, "합계 칸은 일부 미기록을 표시합니다");
});

test("today's nudge asks for the missing egg count first, every day until filled", async () => {
  const { run, json } = await loadApp();
  run(`DB.saveIndividuals([{ id: 'a', name: '크범이', gender: 'female', hatchDate: '2024-01-01', morph: '릴리' }]);
       DB.saveEvents([{ id: 'l1', individualId: 'a', type: 'laying', date: '2026-01-09', data: {} },
                      { id: 'l2', individualId: 'a', type: 'laying', date: '2026-02-28', data: {} }]);`);
  const c = json(`nudgeCandidates().find(c => c.key === 'eggs')`);
  assert.ok(c, "빈칸이 있으면 후보");
  assert.equal(c.layingId, 'l2', "최근 산란부터");
  assert.equal(c.prio, 0);
  assert.match(c.text, /빈 곳 2개/);
  run(`DB.saveSettings({ nudgeLog: [{ date: '2000-01-01', key: 'eggs', indId: 'a' }] })`);
  assert.equal(json(`todayNudge()`).key, 'eggs', "어제 권했어도 빈칸이 남아 있으면 오늘도");
  run(`DB.updateEvent('l1', { data: { eggCount: 2 } }); DB.updateEvent('l2', { data: { eggCount: 2 } });`);
  assert.equal(json(`nudgeCandidates().some(c => c.key === 'eggs')`), false, "채우면 사라집니다");
  const src = await read("src/app.jsx");
  assert.match(src, /navigate\('clutch', \{ layingId: n\.layingId, editEggs: true \}\)/, "누르면 그 알 화면에서 바로 입력");
  assert.ok(src.includes('data-testid="egg-count-edit"') && src.includes('data-testid="egg-rest-ask"'));
});
