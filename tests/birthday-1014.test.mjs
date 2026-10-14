/* v1.9.28 — 아기들 생일 (대표님 2026-10-14)
   생일날 홈 축하 팝업(하루 한 번, 멘트 여러 개, 끄기) · 브리핑 맨 위 생일 문구 · 설정 켜기/끄기 */
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


const T = "2026-01-01T00:00:00.000Z";
const I = (id, name, x = {}) => ({ id, name, gender: "unknown", morph: "", status: "own", createdAt: T, updatedAt: T, ...x });
const SEED = {
  cg_individuals: [
    I("a", "크한이", { hatchDate: "2025-10-14" }),
    I("b", "크범이", { hatchDate: "2023-10-14", status: "available" }),
    I("c", "보리", { hatchDate: "2024-10-14", status: "sold" }),
    I("d", "구름", { hatchDate: "2024-10-14", status: "gone" }),
    I("e", "남의아이", { hatchDate: "2024-10-14", isExternal: true }),
    I("f", "아기", { hatchDate: "2026-10-14" }),
    I("g", "윤이", { hatchDate: "2024-02-29" }),
    I("h", "빈칸", {}),
    I("i", "예약", { hatchDate: "2025-10-14", status: "reserved" }),
  ],
};

test("생일 — 곁에 있는 아이만, 부화한 해는 빼고 1살부터, 2월 29일생은 평년 2월 28일", async () => {
  const { json } = await loadApp(SEED);
  const names = (d) => json(`birthdaysToday(null, '${d}').map(b => b.g.name + b.age)`);
  assert.deepEqual(names("2026-10-14").sort(), ["예약1", "크범이3", "크한이1"].sort(), "분양완료·무지개다리·남의 아이·올해 태어난 아이·부화일 없는 아이는 빠짐");
  assert.deepEqual(names("2026-10-15"), []);
  assert.deepEqual(names("2026-02-28"), ["윤이2"], "평년엔 2월 28일에");
  assert.deepEqual(names("2028-02-28"), [], "윤년엔 2월 28일이 아니라");
  assert.deepEqual(names("2028-02-29"), ["윤이4"], "2월 29일에");
  assert.equal(json(`bdayLine(birthdaysToday(null, '2026-10-14').filter(b => b.g.id === 'a'))`), "🎂 오늘은 크한이 1살 생일이에요!");
});

test("생일 팝업 — 하루 한 번, 끄면 안 뜨고, 멘트는 여러 개 중 같은 날엔 같은 것", async () => {
  // 팝업은 진짜 오늘 날짜로 판단하므로, 오늘이 생일인 아이들을 만들어 둡니다
  const now = new Date(), pad = (n) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const ago = (y) => `${now.getFullYear() - y}${today.slice(4)}`;
  const { json, run, store } = await loadApp({ cg_individuals: [I("a", "크한이", { hatchDate: ago(1) }), I("b", "크범이", { hatchDate: ago(3) }), I("c", "보리", { hatchDate: ago(2), status: "sold" })] });
  assert.equal(json(`todayStr()`), today);
  assert.equal(json(`bdayPopList().length`), 2);
  store.set("cg_bday_seen", today);
  assert.equal(json(`bdayPopList()`), null, "오늘 이미 봤으면 안 뜸");
  store.set("cg_bday_seen", "2000-01-01");
  assert.equal(json(`bdayPopList().length`), 2, "예전에 본 건 상관없음");
  run(`DB.saveSettings({ ...(DB.getSettings() || {}), bdayPopupOff: true })`);
  assert.equal(json(`bdayPopList()`), null, "끄면(팝업 체크·설정 같은 값) 안 뜸");
  run(`DB.saveSettings({ ...(DB.getSettings() || {}), bdayPopupOff: false })`);
  const X = "window.CREG_EXTRAS";
  assert.ok(json(`${X}.BDAY_LINES.length`) >= 6, "멘트가 여러 개");
  assert.ok(json(`${X}.BDAY_LINES`).includes("오늘은 특식 어떨까요? 🍽️"));
  const a = json(`${X}.bdayPick(birthdaysToday(null, '2026-10-14'), '2026-10-14')`);
  assert.equal(json(`${X}.bdayPick(birthdaysToday(null, '2026-10-14'), '2026-10-14')`), a, "같은 날·같은 아이면 같은 멘트");
  const picks = new Set(json(`Array.from({ length: 40 }, (_, i) => ${X}.bdayPick([{ g: { name: '크한이' } }], '2026-' + String(1 + (i % 12)).padStart(2, '0') + '-' + String(1 + i % 28).padStart(2, '0')))`));
  assert.ok(picks.size >= 4, "날마다 멘트가 바뀜");
});

test("생일 — 화면 연결(홈 팝업·브리핑 맨 위·설정)과 중복 정리 카드 이동", async () => {
  const app = await readFile(new URL("src/app.jsx", root), "utf8");
  const ex = await readFile(new URL("src/extras.jsx", root), "utf8");
  assert.match(app, /screen\.name === 'home' && bdayPop && !onb && !adoptCode && !DEMO\.on\(\)/, "홈에서만, 첫 등록·입양 받기·연습 중엔 안 뜸");
  const rem = app.slice(app.indexOf("function RemindersScreen"), app.indexOf("function RemindersScreen") + 4000);
  assert.ok(rem.indexOf('data-testid="bday-brief"') > 0 && rem.indexOf('data-testid="bday-brief"') < rem.indexOf('data-testid="today-brief"'), "브리핑 맨 위");
  assert.match(app, /data-testid="bday-set"[\s\S]{0,300}bdayPopupOff: !e\.target\.checked/, "설정에서 켜고 끄기");
  assert.match(ex, /STORE\.set\('cg_bday_seen', todayStr\(\)\)/, "닫으면 오늘은 다시 안 뜸");
  assert.match(ex, /bdayPopupOff: true/, "팝업 체크 = 설정 끄기");
  assert.match(ex, /앞으로 생일 팝업 띄우지 않기/);
  assert.match(ex, /gecko-transparent\.webp/, "손이 안 보이는 크한이");
  assert.doesNotMatch(ex.slice(ex.indexOf("function BirthdayPopup"), ex.indexOf("function BirthdayPopup") + 3000), /good\.webp|sad\.webp|normal\.webp|down\.webp/);
  assert.doesNotMatch(app, /function DupMergeCard/, "중복 정리 카드는 extras 로");
  assert.match(ex, /function DupMergeCard/);
  assert.match(app, /DB\.findDuplicateNames\(\)\.length > 0 && <Extra part="DupMergeCard"/);
});

test("v1.9.29 생일 팝업 — 등록한 사진이 있으면 그 아이 사진, 못 불러오면 크한이", async () => {
  const ex = await readFile(new URL("src/extras.jsx", root), "utf8");
  const pop = ex.slice(ex.indexOf("function BirthdayPopup"), ex.indexOf("function BirthdayPopup") + 4000);
  assert.match(pop, /avatarSrc\(b\.g\)/, "앱 카드와 같은 사진 고르기(대표 사진 → 프로필 → 첫 사진)");
  assert.match(pop, /\.slice\(0, 3\)/, "여러 마리면 3장까지");
  assert.match(pop, /onError=\{\(\) => setBad/, "못 불러온 사진은 빼고");
  assert.match(pop, /pics\.length \? \([\s\S]*?\) : <img className="bday-hero"/, "사진이 하나도 없으면 크한이");
  const { json } = await loadApp({ cg_individuals: [I("a", "크한이", { hatchDate: "2025-10-14", avatar: "data:image/jpeg;base64,AAAA" }), I("b", "크범이", { hatchDate: "2025-10-14" })] });
  assert.equal(json(`avatarSrc(DB.getIndividuals()[0])`), "data:image/jpeg;base64,AAAA");
  assert.equal(json(`avatarSrc(DB.getIndividuals()[1])`), null);
});
