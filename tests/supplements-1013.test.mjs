/* v1.9.27 — 먹이에 섞어 주는 첨가제(유산균·칼슘·해치랩) 체크 (대표님 요청 2026-10-13)
   실제 앱 코드(app.min.js)를 가짜 브라우저에 올려 돌립니다. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = (f) => readFile(new URL(f, root), "utf8");

async function loadApp(seed = {}) {
  const store = new Map(Object.entries(seed).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)]));
  const noop = () => {};
  const el = () => ({ style: { setProperty: noop }, appendChild: noop, addEventListener: noop, setAttribute: noop });
  const sb = {
    console, setTimeout, clearTimeout, setInterval, clearInterval, Math, JSON, Promise, URL, URLSearchParams, Date, Intl, Uint8Array,
    btoa: (s) => Buffer.from(s, "binary").toString("base64"),
    crypto: { getRandomValues: (a) => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); return a; } },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k), key: i => [...store.keys()][i], get length() { return store.size; } },
    navigator: { userAgent: "node", serviceWorker: { addEventListener: noop, register: () => Promise.resolve() } },
    document: { documentElement: el(), getElementById: el, createElement: el, head: el(), body: el(), addEventListener: noop, querySelector: () => null },
    location: { search: "", pathname: "/cregunseol-app/index.html", href: "http://x/", origin: "https://bosshw.github.io" }, history: { pushState: noop, replaceState: noop },
    fetch: () => Promise.reject(new Error("offline")),
    matchMedia: () => ({ matches: false, addEventListener: noop }),
    React: { createElement: () => ({}), Fragment: "f" }, ReactDOM: { createRoot: () => ({ render: noop }) },
    addEventListener: noop, removeEventListener: noop, dispatchEvent: noop, innerHeight: 800, visualViewport: null,
  };
  sb.window = sb; sb.globalThis = sb; sb.self = sb;
  vm.createContext(sb);
  vm.runInContext(await read("app.min.js"), sb);
  const run = (c) => vm.runInContext(c, sb);
  return { run, json: (c) => JSON.parse(run(`JSON.stringify(${c})`)) };
}

const feeds = (json, text) => json(`extractFacts(${JSON.stringify(text)}).filter(f => f.type === 'feeding').map(f => f.data)`);

test("대화: 첨가제를 말하면 급여 기록에 함께 적고, 주는 말이 없으면 급여로 만들지 않는다", async () => {
  const { json } = await loadApp();
  const a = feeds(json, "슈푸에 칼슘이랑 유산균 섞어서 줬어");
  assert.equal(a.length, 1);
  assert.equal(a[0].foodType, "슈푸");
  assert.deepEqual(a[0].supplements, ["probiotic", "calcium"], "순서는 늘 유산균·칼슘·해치랩");
  assert.deepEqual(feeds(json, "해치랩 타서 줌")[0].supplements, ["hatchlab"]);
  assert.deepEqual(feeds(json, "칼슘 넣어줬어")[0].supplements, ["calcium"]);
  assert.deepEqual(feeds(json, "칼슘 부족한가"), [], "첨가제 낱말만으로는 급여 기록이 아닙니다");
  const plain = feeds(json, "슈푸 줬어")[0];
  assert.equal("supplements" in plain, false, "첨가제가 없으면 칸을 만들지 않습니다(옛 기록과 같은 모양)");
  const left = feeds(json, "칼슘 섞었는데 안 먹었어")[0];
  assert.equal(left.ate, false);
  assert.deepEqual(left.supplements, ["calcium"]);
});

test("해치랩은 암컷에게만 붙고, 모르는 값은 버린다", async () => {
  const { json } = await loadApp();
  const all = '["hatchlab","calcium","zzz"]';
  assert.deepEqual(json(`suppFor({ gender: 'female' }, ${all})`), ["calcium", "hatchlab"]);
  assert.deepEqual(json(`suppFor({ gender: 'male' }, ${all})`), ["calcium"]);
  assert.deepEqual(json(`suppFor({ gender: 'unknown' }, ${all})`), ["calcium"]);
  assert.deepEqual(json(`withSupp({ ate: true, foodType: '슈푸', supplements: ['calcium'] }, [])`), { ate: true, foodType: "슈푸" }, "다 빼면 칸이 사라집니다");
});

test("기록 한 줄·대화 확인·마지막 밥 요약에 첨가제가 보인다", async () => {
  const { json } = await loadApp();
  const d = "{ ate: true, foodType: '슈푸', supplements: ['calcium', 'probiotic'] }";
  assert.equal(json(`formatEventDetail({ type: 'feeding', data: ${d} })`), "🥣 슈푸(일반식) ＋유산균·칼슘 급여");
  assert.equal(json(`formatEventDetail({ type: 'feeding', data: { ate: false, foodType: '충식', supplements: ['calcium'] } })`), "🚫 🦗 충식 ＋칼슘 안 먹음");
  assert.equal(json(`formatEventDetail({ type: 'feeding', data: { supplements: ['hatchlab'] } })`), "먹이 ＋해치랩 급여");
  assert.equal(json(`formatEventDetail({ type: 'feeding', data: { ate: true, foodType: '슈푸' } })`), "🥣 슈푸(일반식) 급여", "첨가제 없는 옛 기록은 그대로");
  assert.match(json(`factLabel({ type: 'feeding', data: ${d} })`), /슈푸 ＋유산균·칼슘/);
});

test("공유 한 장: 최근 30일 첨가제 횟수만 담는다(안 먹은 날은 세지 않음)", async () => {
  const T = "2026-10-01T00:00:00.000Z";
  const today = new Date(); const iso = (n) => new Date(today.getTime() - n * 86400000).toISOString().slice(0, 10);
  const E = (id, date, data) => ({ id, individualId: "a", type: "feeding", date, data, createdAt: T, updatedAt: T });
  const { json } = await loadApp({
    cg_individuals: [{ id: "a", name: "마인이", gender: "female", status: "own", createdAt: T, updatedAt: T }],
    cg_events: [
      E("1", iso(1), { ate: true, foodType: "슈푸", supplements: ["calcium", "hatchlab"] }),
      E("2", iso(3), { ate: true, foodType: "슈푸", supplements: ["calcium"] }),
      E("3", iso(5), { ate: false, foodType: "슈푸", supplements: ["calcium"] }),
      E("4", iso(60), { ate: true, foodType: "슈푸", supplements: ["probiotic"] }),
    ],
  });
  const sm = json(`publicSnapshot(DB.getIndividuals()[0]).summary`);
  assert.deepEqual(sm.supp30, [{ label: "칼슘", n: 2 }, { label: "해치랩", n: 1 }]);
});
