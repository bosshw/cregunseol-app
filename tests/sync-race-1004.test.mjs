/* v1.9.20 — 대표님 발견(2026-10-04): 알 개수 2개 저장 직후 [문제]를 눌렀는데 알별 기록이 다시 '대기'로 돌아감.
      원인: 동기화가 보내는 사이 같은 기록을 또 고치면 그 변경을 '올림 완료'로 지우고, 바로 뒤 pull 이 서버의 옛 값으로 덮었습니다. */
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

test("an edit made while a push is in flight survives the following pull", async () => {
  const { run, json } = await loadApp();
  run(`DB.saveIndividuals([{ id: 'a', name: '크범이', gender: 'female' }]);
       DB.saveEvents([{ id: 'l4', individualId: 'a', type: 'laying', date: '2026-04-02', data: {} }]);
       DB.updateEvent('l4', { data: { eggCount: 2 } });
       globalThis.__server = {};
       SYNC.api = async (path, opt) => {
         if (opt.method === 'POST') {
           JSON.parse(opt.body).forEach(r => { __server[r.kind + '|' + r.id] = r; });
           // 보내는 사이에 대표님이 [문제]를 누릅니다
           if (!globalThis.__edited) { globalThis.__edited = 1; DB.setEggUnits('l4', [{ status: 'hatched' }, { status: 'problem', reason: '기타' }]); }
           return { ok: true };
         }
         const rows = Object.values(__server).map(r => ({ ...r, updated_at: '2026-10-04T03:51:29Z' }));
         return { ok: true, json: async () => rows };
       };`);
  assert.ok(json(`SYNC.dirty()`).includes('event|l4'));
  run(`globalThis.__p = SYNC.push().then(() => SYNC.pull())`);
  await json(`0`); await new Promise(r => setTimeout(r, 0));
  await run(`__p`);
  assert.ok(json(`SYNC.dirty()`).includes('event|l4'), "보내는 사이 고친 기록은 다시 올릴 목록에 남습니다");
  const d = json(`DB.getEvents().find(e => e.id === 'l4').data`);
  assert.equal(d.eggUnits[1].status, 'problem', "서버의 옛 값(개수만 있는 것)으로 덮이지 않습니다");
  // 다음 동기화에서 이 기기 것이 올라갑니다
  await run(`SYNC.push()`);
  assert.equal(json(`__server['event|l4'].data.data.eggUnits[1].status`), 'problem');
  assert.equal(json(`SYNC.dirty()`).includes('event|l4'), false);
});
