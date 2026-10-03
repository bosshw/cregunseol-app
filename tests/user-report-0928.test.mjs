/* v1.9.6 — 첫 외부 사용자 제보(2026-09-28)
   ① 대화에서 "25년 12월 11일"을 2026년으로 읽음 ② 대화로만 고치다 막힘 ③ 이름만 직접 수정 가능
   실제 앱 코드(app.min.js)를 가짜 브라우저에 올려 확인합니다. */
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
  return (c) => vm.runInContext(c, sb);
}

test("the chat reads the year: 25년, 2025년, 24년, 23년, 25.12.11, 251211, 작년 …", async () => {
  const run = await loadApp();
  const y = new Date().getFullYear();
  const abs = (t) => run(`absDate(${JSON.stringify(t)})`);
  assert.equal(abs("마시 해칭일 25년 12월 11일"), "2025-12-11", "제보 문장 그대로");
  assert.equal(abs("마시 해칭일 2025년 12월 11일"), "2025-12-11");
  assert.equal(abs("해칭일 24년 3월 2일"), "2024-03-02");
  assert.equal(abs("생일 23년 7월 1일"), "2023-07-01");
  assert.equal(abs("생일 '22년 5월 5일"), "2022-05-05");
  assert.equal(abs("생일 2025.12.11"), "2025-12-11");
  assert.equal(abs("생일 25.12.11"), "2025-12-11");
  assert.equal(abs("생일 251211"), "2025-12-11");
  assert.equal(abs("생일 20240601"), "2024-06-01");
  assert.equal(abs("작년 12월 11일 생일"), `${y - 1}-12-11`);
  assert.equal(abs("재작년 6월 1일생"), `${y - 2}-06-01`);
  // 연도 없이 말하면: 한 달 넘게 앞날이면 작년, 아니면 올해
  const thisYear = `${y}-12-11`;
  const limit = new Date(); limit.setDate(limit.getDate() + 31);
  const lim = limit.toISOString().slice(0, 10);
  assert.equal(abs("생일 12월 11일"), thisYear > lim ? `${y - 1}-12-11` : thisYear);
  // 날짜가 아닌 숫자는 건드리지 않습니다
  for (const t of ["12.5g", "12.5그램 먹었어", "150000원에 분양", "300000", "알 2개 산란", "2월 30일 생일"]) assert.equal(abs(t), null, t);
  // 생일 말로 이어지는지
  assert.deepEqual(JSON.parse(run(`JSON.stringify(detectProfileClaim("마시 해칭일 25년 12월 11일"))`)), { field: "hatchDate", value: "2025-12-11" });
  assert.deepEqual(JSON.parse(run(`JSON.stringify(detectProfileClaim("재작년 6월 1일생"))`)), { field: "hatchDate", value: `${y - 2}-06-01` });
  assert.equal(run(`prevYearISO("2026-12-11")`), "2025-12-11");
});

test("a future birthday is not a dead end: it asks 'did you mean last year?' with buttons", async () => {
  const src = await read("src/app.jsx");
  assert.match(src, /혹시 \$\{fmtDate\(prev\)\}인가요\?/);
  assert.match(src, /kind: 'fix', value: \{ field: 'hatchDate', from: fromNow, to: prev, targetId: cur\.id \}/);
  assert.match(src, /kind === 'date-retry'/);
});

test("after two misunderstandings in a row the chat offers '직접 고칠게요'", async () => {
  const src = await read("src/app.jsx");
  assert.match(src, /const missBot = \(text, chips, who\) => \{/);
  assert.match(src, /missRef\.current >= 2/);
  assert.match(src, /label: '✏️ 직접 고칠게요', kind: 'go-edit'/);
  assert.match(src, /navigate\('profile', \{ gecko: t, openEdit: true \}\)/, "누르면 기본 정보 수정 창이 열린 프로필로");
  assert.match(src, /const pushPending = \(fs, target, extraLine\) => \{\n    if \(!fs\.length\) return;\n    missRef\.current = 0;/, "알아들으면 다시 0");
});

test("the pencil next to the name opens one sheet for all basic info", async () => {
  const src = await read("src/app.jsx");
  assert.match(src, /onClick=\{\(\) => setInfoEdit\(true\)\} aria-label="기본 정보 수정" data-testid="profile-pencil"/, "연필 모양은 그대로, 누르면 창");
  for (const f of ["이름", "성별", "모프", "해칭일", "점", "아빠", "엄마", "입양처", "입양가"]) assert.ok(src.includes(`<span>${f}</span>`) || src.includes(`'${f}'`), f);
  assert.match(src, /같이 나온 \{sibs\}마리와 부화 기록도 함께 옮기기/);
});

test("editing adoption source/price rewrites the memo the ledger reads, keeping other notes", async () => {
  const run = await loadApp();
  run(`DB.saveIndividuals([{ id: 'a', name: '크범이', gender: 'female' }]);
       DB.saveEvents([{ id: 'm1', individualId: 'a', type: 'memo', date: '2026-08-07', data: { notes: '입양처: 스타필드옆 매장 · 입양가 30만원 · 혈통: YYC혈' } }]);`);
  assert.equal(run(`ledgerRows().filter(r => r.indId === 'a').reduce((a, r) => a + r.amount, 0)`), 300000);
  run(`setAdoptMemo('a', '리키마루', '35')`);
  const notes = run(`DB.getEvents().find(e => e.id === 'm1').data.notes`);
  assert.match(notes, /입양처: 리키마루/);
  assert.match(notes, /입양가 35만원/);
  assert.match(notes, /혈통: YYC혈/, "다른 메모 조각은 그대로");
  assert.doesNotMatch(notes, /스타필드/);
  assert.doesNotMatch(notes, /30만원/, "옛 입양가 조각은 남지 않습니다");
  assert.equal(run(`ledgerRows().filter(r => r.indId === 'a').reduce((a, r) => a + r.amount, 0)`), 350000, "가계부도 바로 따라옵니다");
  run(`setAdoptMemo('a', '', '')`);
  assert.equal(run(`DB.getEvents().find(e => e.id === 'm1').data.notes`), "혈통: YYC혈");
});

test("egg screen: tap a laying record in the profile, then 부화 per egg", async () => {
  const src = await read("src/app.jsx");
  assert.match(src, /navigate\('clutch', \{ layingId: ev\.id, back: \{ name: 'profile', props: \{ gecko \} \} \}\)/);
  // v1.9.15 — 알마다 [대기·부화·무정란·문제] 네 버튼으로 바뀌었고, 부화 버튼의 표식은 그대로 egg-hatch-N 입니다
  assert.match(src, /k === 'hatched' \? 'egg-hatch-' \+ i/);
  assert.match(src, /const first = \(hatchEgg != null && units\[hatchEgg\] && units\[hatchEgg\]\.status === 'pending'\) \? hatchEgg : -1;/, "고른 알부터 부화로");
});
