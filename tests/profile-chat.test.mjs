/* v1.9.10 — 연필 창의 입양처·입양가·점도 대화로 적기 (대표님 요청 2026-09-28)
   "크한이 새벽피딩에서 데려왔어"가 먹이 기록('피딩')으로 새던 것을 막습니다.
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

test("adoption source and price are read from how breeders say it", async () => {
  const run = await loadApp();
  const a = (t) => JSON.parse(run(`JSON.stringify(adoptClaim(${JSON.stringify(t)}))`));
  const sp = (t) => { const r = a(t); return r && [r.source, r.price]; };
  assert.deepEqual(sp("크한이 새벽피딩에서 데려왔어"), ["새벽피딩", ""], "제보 문장 그대로");
  assert.deepEqual(sp("크한이 새벽피딩에서 30만원에 데려왔어"), ["새벽피딩", "30"]);
  assert.deepEqual(sp("크한이 30만원에 데려왔어"), ["", "30"]);
  assert.deepEqual(sp("크한이 입양처 새벽피딩"), ["새벽피딩", ""]);
  assert.deepEqual(sp("크한이 입양처는 리키마루야"), ["리키마루", ""]);
  assert.deepEqual(sp("크한이 입양가 25"), ["", "25"]);
  assert.deepEqual(sp("크한이 250,000원에 입양했어"), ["", "25"]);
  assert.deepEqual(sp("크한이 선물로 데려왔어"), ["", "0"]);
  assert.equal(a("크한이 새벽피딩에서 샀어").weak, true, "'샀어'는 이름이 있고 물건 낱말이 없을 때만 입양으로 봅니다");
  for (const t of ["크한이 어디서 데려왔어?", "크한이 크레건설에 분양했어", "크한이 데려왔어", "크한이 오늘 데려왔어"]) assert.equal(a(t), null, t);
  assert.ok(run(`SUPPLY_WORDS.test("사료 판게아 쿠팡에서 샀어")`), "먹이·용품 구입은 가계부로");
});

test("spots are read without catching 점심 · 점검 · eggs", async () => {
  const run = await loadApp();
  const s = (t) => { const r = JSON.parse(run(`JSON.stringify(spotsClaim(${JSON.stringify(t)}))`)); return r && r.value; };
  assert.equal(s("크한이 꼬리점 2개"), "꼬리점 2개");
  assert.equal(s("크한이 등점 1개 꼬리점 세 개"), "등점 1개 · 꼬리점 3개");
  assert.equal(s("크한이 옆구리 점 두개"), "옆구리점 2개");
  assert.equal(s("크한이 무점이야"), "무점");
  assert.equal(s("크한이 점 없어"), "무점");
  assert.equal(s("크한이 점박이야"), "점박이");
  assert.equal(s("크한이 점 있어"), "점 있음");
  for (const t of ["크한이 점심 먹었어", "알에 점 생겼어", "크한이 점 몇 개야?", "크한이 점점 커지네", "온습도계 점검했어"]) assert.equal(s(t), null, t);
});

test("chat writes to the same place the pencil sheet reads, counted once in the ledger", async () => {
  const run = await loadApp();
  run(`DB.saveIndividuals([{ id: 'k', name: '크한이', gender: 'male' }]);
       DB.saveEvents([{ id: 'm1', individualId: 'k', type: 'memo', date: '2026-08-07', data: { notes: '입양처: 스타필드옆 매장 · 입양가 30만원 · 혈통: YYC혈' } }]);`);
  // 채팅 화면이 하는 일과 같게: 이미 적힌 값에 새 입양처만 덮기
  run(`(() => { const b = splitMemo('k'); const ac = adoptClaim('크한이 리키마루에서 데려왔어'); setAdoptMemo('k', ac.source || b.source, ac.price !== '' ? ac.price : b.price); })()`);
  const m = JSON.parse(run(`JSON.stringify(splitMemo('k'))`));
  assert.equal(m.source, "리키마루");
  assert.equal(m.price, "30", "입양가는 그대로");
  assert.equal(m.blood, "YYC혈", "다른 메모 조각도 그대로");
  assert.equal(run(`ledgerRows().filter(r => r.indId === 'k').length`), 1, "가계부에는 한 줄만");
  const src = await read("src/app.jsx");
  assert.match(src, /const led = adoptHeld \? null : extractLedger\(text\);/, "데려온 이야기는 가계부 따로 적기로 새지 않습니다");
  assert.ok(src.indexOf("const adoptC = adoptClaim(text);") < src.indexOf("const facts = spotsC ? [] : extractFacts(factText);"), "먹이 규칙보다 먼저");
  assert.match(src, /if \(spotsC\) \{ bot\(applySpots\(target, spotsC\.value\)\); return; \}/);
  assert.match(src, /heldProfileRef\.current = \(adoptHeld \|\| spotsC\)/, "처음 보는 이름이면 등록 뒤에 적습니다");
});
