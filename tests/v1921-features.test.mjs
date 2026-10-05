/* v1.9.21 — 처음 시작(내 아이 1마리) · 시즌 노트 · 분양 카드 · 입양 연결
   실제 앱 코드(app.min.js · extras.min.js)를 가짜 브라우저에 올려 돌립니다. */
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
  vm.runInContext(await read("extras.min.js"), sb);
  const run = (c) => vm.runInContext(c, sb);
  return { run, json: (c) => JSON.parse(run(`JSON.stringify(${c})`)), store, sb };
}

const T = "2026-08-07T09:00:00.000Z";
const I = (id, name, g, x = {}) => ({ id, name, gender: g, morph: "", status: "own", createdAt: T, updatedAt: T, ...x });
const E = (id, ind, type, date, data) => ({ id, individualId: ind, type, date, data, createdAt: T, updatedAt: T });
const SEED = {
  cg_visit_no: "3", cg_settings: { breederName: "크레건설" },
  cg_individuals: [I("a", "루나", "female", { morph: "릴리화이트" }), I("b", "솔", "male", { morph: "할리퀸" }),
    I("k", "베리", "unknown", { damId: "a", sireId: "b", morph: "릴리화이트", hatchDate: "2026-07-14", status: "available", salePrice: "180000" }),
    I("k2", "쿠키", "unknown", { damId: "a", sireId: "b", hatchDate: "2026-07-14" })],
  cg_events: [E("m", "a", "mating", "2026-04-01", { partnerId: "b", partnerName: "솔" }),
    E("l", "a", "laying", "2026-05-01", { eggCount: 2 }), E("h", "a", "hatching", "2026-07-14", { count: 2, layingId: "l" }),
    E("l2", "a", "laying", "2026-06-01", { eggCount: 2 }),
    E("w0", "a", "growth", "2026-03-20", { weight: "50" }), E("w9", "a", "growth", "2026-07-30", { weight: "43" }),
    E("p", "k", "photo", "2026-09-01", { photo: "data:image/jpeg;base64,AAAA" }), E("g1", "k", "growth", "2026-09-28", { weight: "7.4" }),
    E("f1", "k", "feeding", "2026-09-27", { foodType: "슈푸", notes: "" }), E("m1", "k", "memo", "2026-09-20", { notes: "꼬리 끝이 살짝 휨" }),
    E("m2", "k", "memo", "2026-09-25", { notes: "김OO님 20만원 예약 010-1234-5678" }),
    E("d1", "k", "distribution", "2026-09-30", { price: "180000", notes: "분양처: 인스타 DM" }),
    E("lg", null, "ledger", "2026-09-30", { amount: 180000, flow: "in", category: "분양" })],
};

test("입양 보따리는 허용 목록만 담고, 돈·분양·연락처는 절대 담지 않는다", async () => {
  const { json, run } = await loadApp(SEED);
  const X = "window.CREG_EXTRAS";
  assert.deepEqual(json(`${X}.ADOPT_KINDS.filter(k => ${X}.ADOPT_NEVER.indexOf(k) >= 0)`), [], "넘기는 종류와 금지 종류가 겹치면 안 됩니다");
  const memos = json(`${X}.adoptMemos(DB.getIndividuals().find(i => i.id === 'k'))`);
  assert.equal(memos.find(m => m.id === "m2").flagged, true, "돈·전화번호가 있는 메모는 미리 빼 둡니다");
  assert.equal(memos.find(m => m.id === "m1").flagged, false);
  const snap = json(`${X}.adoptSnapshot(DB.getIndividuals().find(i => i.id === 'k'), { skipMemo: ['m2'] })`);
  const txt = JSON.stringify(snap);
  for (const bad of ["180000", "분양처", "010-1234", "20만원", "salePrice", "ledger", "distribution", "price"]) assert.ok(!txt.includes(bad), `보따리에 ${bad} 가 있으면 안 됩니다`);
  assert.deepEqual(snap.events.map(e => e.type).sort(), ["feeding", "growth", "memo", "photo"]);
  assert.equal(snap.breeder, "크레건설");
  assert.deepEqual(snap.parents, { sire: { name: "솔", morph: "할리퀸" }, dam: { name: "루나", morph: "릴리화이트" } });
  assert.deepEqual(snap.litter, ["쿠키"]);
  // 메모를 넣기로 고르면 넘어갑니다(대표님: 메모도 기록)
  assert.equal(json(`${X}.adoptSnapshot(DB.getIndividuals().find(i => i.id === 'k'), { skipMemo: [] }).events.filter(e => e.type === 'memo').length`), 2);
  assert.equal(run(`${X}.looksPrivate('3만원에 예약')`), true);
  assert.equal(run(`${X}.looksPrivate('밥을 잘 먹음')`), false);
});

test("받는 쪽은 새 개체로 추가만 하고, 같은 링크는 두 번 들어오지 않으며, 실패하면 반쪽이 남지 않는다", async () => {
  const breeder = await loadApp(SEED);
  const snap = breeder.json(`window.CREG_EXTRAS.adoptSnapshot(DB.getIndividuals().find(i => i.id === 'k'), { skipMemo: ['m2'] })`);
  const recv = await loadApp({ cg_visit_no: "2", cg_individuals: [I("z", "모카", "female")] });
  recv.sb.__snap = snap;
  const before = recv.json("DB.getIndividuals()");
  const r1 = await recv.run(`window.CREG_EXTRAS.adoptImport(__snap, 'CODE_AAAAAAAAAAAAAAAAAA', { name: '베리공주' })`);
  assert.equal(r1.ok, true);
  const inds = recv.json("DB.getIndividuals()");
  assert.equal(inds.length, 2, "새 개체 하나만 늘어납니다");
  assert.deepEqual(inds.find(i => i.id === "z"), before[0], "기존 아이는 그대로");
  const got = inds.find(i => i.name === "베리공주");
  assert.notEqual(got.id, "k", "새 번호");
  assert.equal(got.adoptFrom.breeder, "크레건설");
  assert.equal(got.sireId, null); assert.equal(got.damId, null);
  const evs = recv.json(`DB.getEvents().filter(e => e.individualId === '${got.id}').map(e => e.type)`);
  assert.deepEqual(evs.sort(), ["feeding", "growth", "memo", "memo", "photo"], "기록 + 입양 메모 한 줄");
  const r2 = await recv.run(`window.CREG_EXTRAS.adoptImport(__snap, 'CODE_AAAAAAAAAAAAAAAAAA', { name: '다른이름' })`);
  assert.equal(r2.again, true, "같은 링크는 이미 받은 아이로");
  assert.equal(recv.json("DB.getIndividuals()").length, 2);
  const r3 = await recv.run(`window.CREG_EXTRAS.adoptImport(__snap, 'CODE_BBBBBBBBBBBBBBBBBB', { name: '모카' })`);
  assert.equal(r3.ok, false); assert.equal(r3.dupName, true, "이름이 겹치면 받지 않습니다");
  // 기록 저장이 실패하면 들인 개체까지 거둡니다
  recv.run("window.__keep = DB.addEvents; DB.addEvents = () => []");
  const r4 = await recv.run(`window.CREG_EXTRAS.adoptImport(__snap, 'CODE_CCCCCCCCCCCCCCCCCC', { name: '새아이' })`);
  recv.run("DB.addEvents = window.__keep");
  assert.equal(r4.ok, false);
  assert.equal(recv.json("DB.getIndividuals()").some(i => i.name === "새아이"), false, "반쪽짜리가 남지 않습니다");
  // 새 형식(앱보다 높은 버전)은 받지 않습니다
  const r5 = await recv.run(`window.CREG_EXTRAS.adoptImport({ ...__snap, v: 99 }, 'CODE_DDDDDDDDDDDDDDDDDD', { name: '미래' })`);
  assert.equal(r5.ok, false);
});

test("시즌 노트 숫자는 기록에서 계산하고, 브리더가 적은 것만 저장한다", async () => {
  const { json, run, store } = await loadApp(SEED);
  const X = "window.CREG_EXTRAS";
  const st = json(`${X}.seasonNoteStats(DB.getIndividuals().find(i => i.id === 'a'), '2026')`);
  assert.equal(st.clutches, 2); assert.equal(st.eggs, 4); assert.equal(st.hatched, 2);
  assert.equal(st.gap, 31);
  assert.equal(st.rate, null, "아직 품는 알이 있으면 부화율을 내지 않습니다");
  assert.equal(st.weight.pct, -14);
  assert.ok(st.facts.some(f => /14% 줄었/.test(f)), "몸무게가 많이 줄면 사실로 알려 줍니다");
  assert.deepEqual(st.kids.map(k => k.name).sort(), ["베리", "쿠키"]);
  const male = json(`${X}.seasonNoteStats(DB.getIndividuals().find(i => i.id === 'b'), '2026')`);
  assert.equal(male.clutches, 2); assert.equal(male.pairs[0].mate, "루나");
  run(`${X}.saveSeasonNote('a', '2026', { dir: 'rest', good: '꾸준함' })`);
  run(`${X}.toggleTrait('k', '색 진함')`);
  const a = json("DB.getIndividuals().find(i => i.id === 'a')");
  assert.equal(a.seasonNotes["2026"].dir, "rest");
  assert.equal(a.seasonNotes["2026"].clutches, undefined, "숫자는 저장하지 않습니다");
  assert.deepEqual(json("DB.getIndividuals().find(i => i.id === 'k').traits"), ["색 진함"]);
  assert.ok(JSON.parse(store.get("cg_dirty")).includes("individual|a"), "서버에도 올라갑니다");
  assert.match(run(`${X}.seasonSummaryText(DB.getIndividuals().find(i => i.id === 'a'), ${X}.seasonNoteStats(DB.getIndividuals().find(i => i.id === 'a'), '2026'), { dir: 'rest' })`), /다음 시즌: 한 시즌 쉬기/);
});

test("분양 카드 글자 — 분양가는 켰을 때만, 미구분은 그대로, QR은 공유가 켜졌을 때만", async () => {
  const { json, run } = await loadApp(SEED);
  const d = json(`window.CREG_EXTRAS.saleCardData(DB.getIndividuals().find(i => i.id === 'k'), { badge: '분양 중' })`);
  assert.equal(d.gender, "미구분"); assert.equal(d.breeder, "크레건설"); assert.equal(d.badge, "분양 중");
  assert.equal(d.qrUrl, ""); assert.equal(d.weight, "7.4"); assert.equal(d.sire, "솔 (할리퀸)");
  assert.ok(!JSON.stringify(d).includes("180,000"));
  const p = json(`window.CREG_EXTRAS.saleCardData(DB.getIndividuals().find(i => i.id === 'k'), { badge: '분양 중', price: true })`);
  assert.match(p.badge, /180,000원/);
  run("DB.updateIndividual('k', { publicOn: true, shareCode: 'ABC123' })");
  assert.match(json(`window.CREG_EXTRAS.saleCardData(DB.getIndividuals().find(i => i.id === 'k'), {})`).qrUrl, /g\.html\?c=ABC123$/);
  assert.equal(json(`window.CREG_EXTRAS.saleCardData(DB.getIndividuals().find(i => i.id === 'k'), { noBreeder: true })`).breeder, "");
});

test("대화로도 — 시즌 노트·다음 시즌·자식 특징·분양 카드·입양 보내기 (기존 말은 그대로)", async () => {
  const { json } = await loadApp(SEED);
  const k = (t, who) => json(`(planAppChat(${JSON.stringify(t)}, DB.getIndividuals().find(i => i.name === '${who}'), []) || {}).kind || null`);
  assert.equal(k("루나 시즌 정리해줘", "루나"), "note");
  assert.equal(k("루나 다음 시즌은 쉬게 할래", "루나"), "noteDir");
  assert.equal(k("베리 크레스트 풍성해", "베리"), "trait");
  assert.equal(k("베리 색이 진해", "베리"), "trait");
  assert.equal(k("베리 분양 카드 만들어줘", "베리"), "card");
  assert.equal(k("베리 입양 보내기", "베리"), "adoptSend");
  assert.equal(k("베리 공유하고 싶어", "베리"), "share");
  assert.equal(k("베리 몸무게 7.5g", "베리"), null);
  assert.equal(k("베리 입양했어 30만원", "베리"), null, "데려온 기록(입양가)은 입양 보내기가 아닙니다");
  assert.equal(k("루나 시즌 끝났어", "루나"), "season");
});

test("처음 시작·실험 깃발·서버 규칙·캐시 목록 계약", async () => {
  const welcome = await read("src/welcome.jsx");
  assert.match(welcome, /function Onboard\(/);
  assert.match(welcome, /data-testid="onb-skip"/, "모든 단계에 건너뛰기");
  assert.match(welcome, /type: 'feeding'/, "첫 기록은 밥");
  assert.match(welcome, /onb-browse/, "구경만 할게요");
  const app = await read("src/app.jsx");
  assert.match(app, /STORE\.set\('cg_onb', '0'\)/, "처음 온 기기는 첫 등록부터");
  assert.match(app, /const LABS = \{/);
  assert.match(app, /\{LABS\.on\(\) && !gecko\.isExternal && \(/, "카드·입양 보내기 버튼은 실험 깃발이 켜진 기기에서만");
  const sql = await read("supabase_adopt.sql");
  assert.doesNotMatch(sql, /for update/i, "보따리를 고치는 정책은 없습니다");
  assert.match(sql, /claimed_at is null and not revoked and expires_at > now\(\)/, "한 번만·취소 안 됨·기한 안");
  assert.match(sql, /grant execute on function public\.cg_adopt_claim\(text, text\) to anon, authenticated/);
  assert.match(sql, /grant execute on function public\.cg_adopt_revoke\(text\) to authenticated;/);
  assert.match(sql, /interval '7 days'/);
  const sw = await read("sw.js");
  for (const f of ["./extras.min.js", "./card.min.js", "./welcome.min.js"]) assert.ok(sw.includes(`'${f}'`), `${f} 캐시`);
  const ex = await read("src/extras.jsx");
  assert.match(ex, /const ADOPT_DAYS = 7;/);
  assert.match(ex, /randomCode\(16\)/, "받아가는 링크는 추측할 수 없게 길게");
});

test("v1.9.22 축양 화면 검색란 옆 [개체 추가] — 직접 입력으로 등록", async () => {
  const app = await read("src/app.jsx");
  assert.match(app, /data-testid="home-add"/, "검색란 옆 버튼");
  assert.match(app, /className="input brand-search"\s+style=\{\{flex:1, minWidth:0\}\}/, "검색란은 반만");
  assert.match(app, /<Extra part="AddGeckoSheet"/);
  const ex = await read("src/extras.jsx");
  assert.match(ex, /function AddGeckoSheet\(/);
  assert.match(ex, /isBadName\(nm\)/, "비속어 막기");
  assert.match(ex, /all\.some\(i => i\.name === nm\)/, "같은 이름 막기");
  assert.match(ex, /DB\.addIndividual\(\{/, "대화와 같은 등록 자리");
  const { json } = await loadApp(SEED);
  assert.equal(json("typeof window.CREG_EXTRAS.AddGeckoSheet"), "function");
});

test("v1.9.24 사용법 배우기가 화면 여는 단계에서 멈추지 않는다", async () => {
  const w = await read("src/welcome.jsx");
  assert.match(w, /const openAndGo = \(\) =>/, "[캘린더 열기] 등은 열고 바로 다음으로");
  assert.match(w, /onClick=\{openAndGo\} data-testid="tut-tap"/);
  assert.match(w, /setTimeout\(\(\) => setStall\(true\), 6000\)/, "6초 뒤 [다음 ›]");
  assert.match(w, /data-testid="tut-force"/);
  assert.match(w, /TRACK\.step\('onb_tut' \+ n\)/, "어느 단계까지 갔는지 셈");
});
