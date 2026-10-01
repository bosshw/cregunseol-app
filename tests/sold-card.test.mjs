/* v1.9.13 — 가계부 [분양완료] 카드 정리 (대표님 지시 2026-10-01)
   빼기: 별(즐겨찾기) · "최근: 날짜" · 마지막 급여일과 ⚠ · 카드 바깥 "분양가 ○○원" 줄
   넣기(카드 안, 모프 줄 아래): 해칭일(있을 때만) → "분양가 80,000원"/"분양가 무료" → "입양자: 이름 · 010-****-1234"
   연락처 전체 번호는 상세(프로필)에서만. 보유 중인 아이 카드에는 영향 없음.
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

test("phone numbers are masked in the middle: 010-1234-5678 → 010-****-5678", async () => {
  const run = await loadApp();
  const mask = (t) => run(`maskPhone(${JSON.stringify(t)})`);
  assert.equal(mask("010-1234-5678"), "010-****-5678");
  assert.equal(mask("01012345678"), "010-****-5678");
  assert.equal(mask("010 1234 5678"), "010-****-5678");
  assert.equal(mask("011-123-4567"), "011-***-4567");
  assert.equal(mask("02-123-4567"), "02-***-4567");
  assert.equal(mask("02-1234-5678"), "02-****-5678");
  assert.equal(mask(""), "");
  assert.equal(run(`formatPhone("01012345678")`), "010-1234-5678");
  assert.equal(run(`phoneParts("12345")`), null, "번호가 아니면 모양을 만들지 않습니다");
});

test("recordSale keeps adopter name and phone on the gecko; card lines read them", async () => {
  const run = await loadApp();
  run(`DB.saveIndividuals([
    { id: 'a', name: '크한이', gender: 'female', morph: '릴리화이트', hatchDate: '2025-06-01', status: 'own' },
    { id: 'b', name: '크범이', gender: 'male', morph: '할리퀸', status: 'own' },
    { id: 'c', name: '크순이', gender: 'female', status: 'own' },
  ]); DB.saveEvents([]);`);
  run(`DB.recordSale('a', { won: 80000, adopterName: '홍길동', adopterPhone: '01012345678', date: '2026-09-30' })`);
  run(`DB.recordSale('b', { won: 0, free: true, adopterName: '', adopterPhone: '', date: '2026-09-30' })`);
  const a = JSON.parse(run(`JSON.stringify(DB.getIndividuals().find(i => i.id === 'a'))`));
  assert.equal(a.status, "sold");
  assert.equal(a.adopterName, "홍길동");
  assert.equal(a.adopterPhone, "010-1234-5678", "전체 번호는 그대로 저장(상세에서 보여 줌)");
  assert.equal(run(`soldPriceLine(DB.getIndividuals().find(i => i.id === 'a'))`), "분양가 80,000원");
  assert.equal(run(`adopterLine(DB.getIndividuals().find(i => i.id === 'a'))`), "입양자: 홍길동 · 010-****-5678");
  assert.equal(run(`soldPriceLine(DB.getIndividuals().find(i => i.id === 'b'))`), "분양가 무료");
  assert.equal(run(`adopterLine(DB.getIndividuals().find(i => i.id === 'b'))`), "입양자 미등록");
  // 분양가를 아직 안 적은 아이
  run(`DB.updateIndividual('c', { status: 'sold' })`);
  assert.equal(run(`soldPriceLine(DB.getIndividuals().find(i => i.id === 'c'))`), "분양가 미입력");
  // 엑셀 분양리스트가 읽는 '분양처: OOO' 는 계속 남습니다
  const ev = JSON.parse(run(`JSON.stringify(DB.getEventsFor('a').find(e => e.type === 'distribution'))`));
  assert.match(ev.data.notes, /분양처: 홍길동/);
  assert.ok(!/1234/.test(ev.data.notes), "연락처는 분양 기록 메모에 섞지 않습니다");
});

test("old records: name falls back to '분양처: OOO'; chat sale keeps a phone already written", async () => {
  const run = await loadApp();
  run(`DB.saveIndividuals([{ id: 'x', name: '옛아이', status: 'sold', salePrice: '150000' }]);
       DB.saveEvents([{ id: 'e1', individualId: 'x', type: 'distribution', date: '2026-08-01', data: { price: '150000', notes: '분양처: 김철수' } }]);`);
  assert.equal(run(`adopterLine(DB.getIndividuals()[0])`), "입양자: 김철수");
  run(`DB.updateIndividual('x', { adopterPhone: '010-9999-8888' })`);
  // 대화로 분양을 다시 적어도(buyer 만 넘어옴) 적어 둔 연락처는 지워지지 않습니다
  run(`DB.recordSale('x', { won: 150000, buyer: '김철수', date: '2026-08-01' })`);
  const x = JSON.parse(run(`JSON.stringify(DB.getIndividuals()[0])`));
  assert.equal(x.adopterPhone, "010-9999-8888");
  assert.equal(x.adopterName, "김철수");
});

test("source: sold variant only in the 분양완료 list, no star/recent/feed there, full number only in profile", async () => {
  const src = await read("src/app.jsx");
  const card = src.slice(src.indexOf("function GeckoCard("), src.indexOf("function WeightChart("));
  assert.match(card, /function GeckoCard\(\{ gecko, onClick, onToggleFav, sold, gone \}\)/);
  assert.match(card, /\{onToggleFav && !sold && !gone && \(/, "분양완료·무지개다리 카드에는 별이 없습니다");
  // 분양완료 갈래 안에는 최근·먹이 줄이 없습니다
  const soldBranch = card.slice(card.indexOf("{sold ? ("), card.indexOf(") : (<>")).replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(soldBranch.includes("soldPriceLine(gecko)") && soldBranch.includes("adopterLine(gecko)"));
  assert.ok(!/최근|feedDays|🍽️/.test(soldBranch));
  assert.ok(soldBranch.indexOf("hatchDate") < soldBranch.indexOf("soldPriceLine") &&
            soldBranch.indexOf("soldPriceLine") < soldBranch.indexOf("adopterLine"), "해칭일 → 분양가 → 입양자 순서");
  // 가계부 목록: 분양완료 칸만 sold, 다른 칸은 예전 그대로(별 포함)
  const sec = src.slice(src.indexOf("function SaleSection("), src.indexOf("function MoneySection("));
  assert.match(sec, /saleFilter === 'sold'\s*\?\s*<GeckoCard gecko=\{gecko\} sold /);
  assert.match(sec, /: <GeckoCard gecko=\{gecko\} onClick=\{\(\) => navigate\('profile', \{ gecko \}\)\} onToggleFav=\{toggleFav\} \/>/);
  assert.ok(!sec.includes("분양가 아직 안 적음"), "카드 바깥 분양가 줄은 없어졌습니다");
  // 홈 목록 등 다른 곳의 카드는 sold 를 쓰지 않습니다
  assert.equal((src.match(/<GeckoCard [^>]*\bsold\b/g) || []).length, 1);
  // 전체 번호는 프로필(상세)에서만, 목록에는 maskPhone 만
  assert.ok(src.includes('data-testid="adopter-detail"'));
  assert.ok(!soldBranch.includes("a.phone") && src.includes("maskPhone(a.phone)"));
  // 분양 창에서 이름·연락처를 적습니다
  assert.ok(src.includes('data-testid="adopter-name"') && src.includes('data-testid="adopter-phone"'));
  // 대기줄로 여러 아이를 채울 때 앞 아이 값이 남지 않게
  assert.ok(src.includes("<SalePrompt key={fillQueue[0]}"));
  // 공유 한 장에는 입양자 정보가 나가지 않습니다
  const snap = src.slice(src.indexOf("function publicSnapshot("), src.indexOf("function publicSnapshot(") + 4000);
  assert.ok(!/adopter/.test(snap));
});

/* v1.9.14 — 가계부 [떠남] 칸 → [🌈 무지개다리] (대표님 2026-10-02: 최근 줄 빼고 떠난 날 표기, '떠남·폐사'는 말이 셈) */
test("무지개다리 card: shows the day it left, missing pets say 실종, no recent/feed/star", async () => {
  const run = await loadApp();
  run(`DB.saveIndividuals([
    { id: 'g1', name: '빛산1호', morph: '25헷초초 노말', hatchDate: '2026-08-26', status: 'gone', goneDate: '2026-09-22', goneReason: '폐사' },
    { id: 'g2', name: '도망이', status: 'gone', goneDate: '2026-09-01', goneReason: '실종·탈출' },
    { id: 'g3', name: '옛기록', status: 'gone' },
  ]); DB.saveEvents([{ id: 'h1', individualId: 'g3', type: 'health', date: '2026-07-10', data: { issue: '폐사' } }]);`);
  const line = (id) => run(`goneDayLine(DB.getIndividuals().find(i => i.id === '${id}'))`);
  const fmt = (d) => run(`fmtDate('${d}')`);
  assert.equal(line("g1"), `🌈 ${fmt("2026-09-22")} 무지개다리`);
  assert.equal(line("g2"), `${fmt("2026-09-01")} 실종`);
  assert.equal(line("g3"), `🌈 ${fmt("2026-07-10")} 무지개다리`, "goneDate 가 없으면 폐사 기록 날짜로");
  assert.equal(run(`goneBadge(DB.getIndividuals()[0])`), "🌈 무지개다리");
  assert.equal(run(`goneBadge(DB.getIndividuals()[1])`), "실종");

  const src = await read("src/app.jsx");
  const card = src.slice(src.indexOf("function GeckoCard("), src.indexOf("function WeightChart("));
  const goneBranch = card.slice(card.indexOf(") : gone ? ("), card.indexOf(") : (<>")).replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(goneBranch.includes("goneDayLine(gecko)"));
  assert.ok(!/최근|feedDays|🍽️/.test(goneBranch));
  const sec = src.slice(src.indexOf("function SaleSection("), src.indexOf("function MoneySection("));
  assert.match(sec, /saleFilter === 'gone'\s*\?\s*<GeckoCard gecko=\{gecko\} gone /);
  assert.ok(sec.includes("`🌈 무지개다리 ${goneCount}`") && !sec.includes("🌈 떠남"), "칸 이름");
  // 안내 문장은 목록 위에 한 번만 (아이마다 되풀이되지 않게)
  const loop = sec.slice(sec.indexOf("saleList.map(gecko =>"), sec.indexOf("fillQueue.length > 0 &&"));
  assert.ok(!loop.includes("혈통에는 그대로 남아서") && sec.includes('data-testid="gone-note"'));
  assert.equal((src.match(/<GeckoCard [^>]*\bgone\b/g) || []).length, 1, "무지개다리 카드는 가계부 칸에서만");
});
