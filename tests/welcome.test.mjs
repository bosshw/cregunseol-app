/* v1.9.2 처음 온 사람 — 예시로 구경하기가 진짜 기록·서버와 절대 섞이지 않는지,
   그리고 이름이 '브리딩비서'로 바뀌었는지 지킵니다. 실제 앱 코드(app.min.js · welcome.min.js)를 가짜 브라우저에 올려 돌립니다. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = (f) => readFile(new URL(f, root), "utf8");

async function loadApp(seed = {}) {
  const store = new Map(Object.entries(seed));
  const sent = [];
  const noop = () => {};
  const el = () => ({ style: { setProperty: noop }, appendChild: noop, addEventListener: noop, setAttribute: noop });
  const sb = {
    console, setTimeout, clearTimeout, setInterval, clearInterval, Math, JSON, Promise, URL, URLSearchParams, Date, Intl,
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k), key: i => [...store.keys()][i], get length() { return store.size; } },
    navigator: { userAgent: "node", serviceWorker: { addEventListener: noop, register: () => Promise.resolve() } },
    document: { documentElement: el(), getElementById: el, createElement: el, head: el(), body: el(), addEventListener: noop, querySelector: () => null },
    location: { search: "", pathname: "/", href: "http://x/", origin: "http://x" }, history: { pushState: noop, replaceState: noop },
    fetch: (u, o) => { sent.push({ u: String(u), body: o && o.body }); return Promise.reject(new Error("offline")); },
    matchMedia: () => ({ matches: false, addEventListener: noop }),
    React: { createElement: () => ({}), Fragment: "f" }, ReactDOM: { createRoot: () => ({ render: noop }) },
    addEventListener: noop, removeEventListener: noop, dispatchEvent: noop, innerHeight: 800, visualViewport: null,
  };
  sb.window = sb; sb.globalThis = sb; sb.self = sb;
  vm.createContext(sb);
  vm.runInContext(await read("app.min.js"), sb);
  vm.runInContext(await read("welcome.min.js"), sb);
  return { run: c => vm.runInContext(c, sb), store, sent };
}

test("a first visit gets example geckos that never touch real records or the server", async () => {
  const { run, store, sent } = await loadApp();
  assert.equal(run("DEMO.fresh()"), true, "빈 기기는 처음 온 기기입니다");
  assert.equal(run("DEMO.start()"), true);
  assert.equal(run("DEMO.on()"), true);
  assert.equal(store.get("cg_tut"), "0", "연습과 함께 튜토리얼이 처음부터 시작됩니다");
  const names = JSON.parse(run("JSON.stringify(DB.getIndividuals().map(i => i.name))"));
  assert.deepEqual(names, ["루나", "솔", "모카", "도토리", "베리", "쿠키"]);
  assert.equal(store.get("cg_individuals"), undefined, "진짜 기록 칸은 비어 있어야 합니다");
  assert.equal(store.get("cg_events"), undefined);

  // 예시가 살아 있는지 — 앞으로 올 부화 예정, 분양 수입이 보여야 합니다
  const today = run("todayStr()");
  const etas = JSON.parse(run("JSON.stringify(clutchRows().map(r => r.etaISO))"));
  assert.ok(etas.some(d => d > today), "캘린더에 앞으로 올 부화 예정이 있어야 합니다");
  assert.ok(run("ledgerRows().some(r => r.flow === 'in' && r.amount === 150000)"), "가계부에 분양 수입");

  // 구경하며 적어 본 것도 예시 칸에만 — 서버 목록·방문 집계에 안 잡힙니다
  run("DB.addIndividual({ name: '시험', gender: 'unknown' })");
  assert.equal(run("DB.getIndividuals().length"), 7);
  assert.equal(store.get("cg_individuals"), undefined);
  assert.equal(run("SYNC.dirty().length"), 0, "서버에 올릴 목록에 안 들어갑니다");
  assert.equal(store.get("cg_step_record"), undefined, "예시로 적은 건 '기록함'으로 세지 않습니다");
  assert.ok(!sent.some(s => /"step":"record"/.test(s.body || "")));

  // 로그인돼 있어도 구경 중엔 서버와 주고받지 않습니다
  store.set("cg_sync_session", JSON.stringify({ access_token: "t", id: "u" }));
  assert.equal(run("SYNC.active()"), false);
  store.delete("cg_sync_session");

  // 내 것으로 시작 — 예시 칸을 통째로 지우면 빈 앱
  run("DEMO.clear()");
  assert.equal(run("DEMO.on()"), false);
  assert.equal(run("DB.getIndividuals().length"), 0);
  assert.ok(![...store.keys()].some(k => k.startsWith("cg_demo:")), "예시 칸이 남으면 안 됩니다");
  assert.equal(store.get("cg_tut"), undefined, "튜토리얼 진행 칸도 함께 지웁니다");
  assert.equal(run("DEMO.fresh()"), false, "한 번 보여 드렸으면 다시 저절로 켜지지 않습니다");
});

test("people who already have records or an account never land in the example", async () => {
  const withData = await loadApp({ cg_individuals: JSON.stringify([{ id: "a", name: "크한이" }]) });
  assert.equal(withData.run("DEMO.fresh()"), false);
  const loggedIn = await loadApp({ cg_sync_session: JSON.stringify({ access_token: "t" }) });
  assert.equal(loggedIn.run("DEMO.fresh()"), false, "새 폰에서 로그인만 하려는 분도 예시로 안 갑니다");
  const returning = await loadApp({ cg_visit_no: "3" });
  assert.equal(returning.run("DEMO.fresh()"), false);
});

test("the name is 브리딩비서 everywhere a visitor sees it, and the welcome parts stay out of the first load", async () => {
  const [manifest, html, source, worker, app] = await Promise.all([
    read("manifest.json"), read("index.html"), read("src/app.jsx"), read("sw.js"), read("app.min.js"),
  ]);
  const m = JSON.parse(manifest);
  assert.equal(m.name, "브리딩비서");
  assert.equal(m.short_name, "브리딩비서", "설치하면 아이콘 아래 이름");
  assert.match(html, /<meta name="apple-mobile-web-app-title" content="브리딩비서">/, "아이폰 홈 화면 이름");
  assert.match(html, /<title>브리딩비서<\/title>/);
  assert.match(source, /<h1>브리딩비서<\/h1>/);
  assert.doesNotMatch(source, /<h1>크레건설/);
  assert.doesNotMatch(html, /welcome\.min\.js/, "안내 조각은 필요할 때만 불러옵니다");
  assert.match(worker, /'\.\/welcome\.min\.js'/);
  assert.match(app, /welcome\.min\.js/);
  assert.match(source, /data-testid="demo-bar"/);
  assert.match(source, /if \(!DEMO\.on\(\)\) \{ try \{ TRACK\.step\('record'\); \} catch \(e\) \{\} \}/);
});

test("the tutorial walks a real path: chat → say → save → calendar → briefing, on anchors the app keeps", async () => {
  const [source, welcome, built] = await Promise.all([read("src/app.jsx"), read("src/welcome.jsx"), read("welcome.min.js")]);
  for (const a of ['data-tut="home"', 'data-tut="calendar"', 'data-tut="chat"', 'data-tut="reminders"', 'data-tut="chat-bar"', 'data-tut="save-final"', 'data-tut="cal"']) {
    assert.ok(source.includes(a), `튜토리얼이 짚는 자리 ${a} 가 있어야 합니다`);
  }
  assert.match(source, /\{DEMO\.on\(\) && <Welcome part="Tutorial" \/>\}/, "연습 중에만 튜토리얼");
  assert.match(source, /사용법 배우기 \(1분\)/);
  assert.doesNotMatch(source, /예시로 먼저 구경하기/);
  assert.match(welcome, /until: inChat/, "단계는 화면이 나왔는지로 넘어갑니다");
  assert.match(welcome, /DEMO\.exit\('chat'\)/, "끝나면 연습을 지우고 내 아이 대화로");
  assert.match(built, /CREG_WELCOME=\{[^}]*Tutorial/);
  assert.doesNotMatch(built, /\(\?<[=!]/, "옛 아이폰이 못 읽는 정규식 금지");
});
