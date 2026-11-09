/* v1.9.61 — 새 버전 자동 적용 (대표님 결정 2026-11-09: 아무 말 없이)
   켤 때만 · 홈 화면 · 손대기 전 · 열린 창 없음 · 파일 안 지우고 새 파일 확인 뒤 · 같은 버전 한 번만 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = (f) => readFile(new URL(f, root), "utf8");

/* opts: cacheHas(새 파일이 정말 새 버전인지), installs(새 서비스워커가 설치되는지), offline, activeEl, overlay */
async function loadApp(opts = {}) {
  const store = new Map();
  const noop = () => {};
  const el = () => ({ style: { setProperty: noop }, appendChild: noop, addEventListener: noop, setAttribute: noop });
  const calls = { reload: 0, deleted: 0, update: 0 };
  const worker = {
    state: "installing",
    _l: [],
    addEventListener(t, fn) { this._l.push(fn); },
    go(s) { this.state = s; this._l.forEach(f => f()); },
  };
  const reg = {
    installing: null, waiting: null,
    async update() {
      calls.update++;
      if (opts.offline) throw new Error("offline");
      if (opts.installs) { reg.installing = worker; setTimeout(() => worker.go(opts.installFails ? "redundant" : "activated"), 5); }
    },
  };
  const sb = {
    console, setTimeout, clearTimeout, setInterval, clearInterval, Math, JSON, Promise, URL, URLSearchParams, Date, Intl,
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k), key: i => [...store.keys()][i], get length() { return store.size; } },
    navigator: { userAgent: "node", serviceWorker: { addEventListener: noop, register: () => Promise.resolve(), getRegistration: async () => reg } },
    caches: {
      match: async () => (opts.cacheHas === undefined ? null : { text: async () => `x,APP_VERSION="${opts.cacheHas}",y` }),
      keys: async () => ["creg-v95"],
      delete: async () => { calls.deleted++; return true; },
    },
    document: {
      documentElement: el(), getElementById: el, createElement: el, head: el(), body: el(), addEventListener: noop,
      get activeElement() { return opts.activeEl ? { tagName: opts.activeEl } : { tagName: "BODY" }; },
      querySelector: (q) => (opts.overlay && q.includes(".pe-sheet") ? {} : null),
      querySelectorAll: () => (opts.fixedZ ? [{ style: { position: "fixed", zIndex: String(opts.fixedZ) } }] : []),
    },
    location: { search: opts.search || "", pathname: "/", href: "http://x/", origin: "http://x", reload: () => { calls.reload++; } },
    history: { pushState: noop, replaceState: noop },
    fetch: () => Promise.reject(new Error("offline")), matchMedia: () => ({ matches: false, addEventListener: noop }),
    React: { createElement: () => ({}), Fragment: "f" }, ReactDOM: { createRoot: () => ({ render: noop }) },
    addEventListener: noop, removeEventListener: noop, dispatchEvent: noop, innerHeight: 800, visualViewport: null,
  };
  sb.window = sb; sb.globalThis = sb; sb.self = sb;
  vm.createContext(sb);
  vm.runInContext(await read("app.min.js"), sb);
  const run = (c) => vm.runInContext(c, sb);
  store.set("cg_onb", "done");   // 처음 등록을 마친 기기 (새 기기는 부팅 때 '0' = 진행 중)
  // 서버에 새 버전이 올라와 있는 상태
  run(`VER.latest = { app: '9.9.9', schema: 1, minSchema: 1 }; AUTO_UPD.startedAt = Date.now(); AUTO_UPD.touched = false;`);
  return { run, calls, store, worker };
}
const go = (a, screen = "home") => a.run(`AUTO_UPD.run(() => '${screen}')`);

test("새 버전이 있고 켠 직후 홈 화면이면, 새 파일을 확인한 뒤 아무 말 없이 다시 엽니다", async () => {
  const a = await loadApp({ installs: true, cacheHas: "9.9.9" });
  assert.equal(await go(a), true);
  assert.equal(a.calls.reload, 1);
  assert.equal(a.calls.update, 1);
  assert.equal(a.store.get("cg_auto_upd"), "9.9.9", "같은 버전은 한 번만 — 시도한 버전을 적어 둡니다");
  assert.equal(a.calls.deleted, 0, "캐시를 지우지 않습니다 (인터넷이 끊겨도 앱이 열리게)");
});

test("새 서비스워커가 이미 뒤에서 깔려 있어도(설치 대기 없음) 파일이 새것이면 다시 엽니다", async () => {
  const a = await loadApp({ installs: false, cacheHas: "9.9.9" });
  assert.equal(await go(a), true);
  assert.equal(a.calls.reload, 1);
});

test("같은 버전을 이미 한 번 해 봤으면 다시 하지 않습니다 (새로고침 반복 방지)", async () => {
  const a = await loadApp({ installs: true, cacheHas: "9.9.9" });
  a.store.set("cg_auto_upd", "9.9.9");
  assert.equal(await go(a), false);
  assert.equal(a.calls.reload, 0);
  assert.equal(a.calls.update, 0);
});

test("받은 파일이 아직 옛것이면(CDN 지연) 다시 열지 않고 안내 막대로 넘깁니다", async () => {
  const a = await loadApp({ installs: true, cacheHas: "1.9.60" });
  assert.equal(await go(a), false);
  assert.equal(a.calls.reload, 0);
  assert.equal(a.run("AUTO_UPD.busy"), false, "막대가 다시 보이게");
  assert.equal(a.store.get("cg_auto_upd"), undefined, "다시 열지 않았으니 다음에 켤 때 또 시도해도 됩니다");
  assert.equal(await go(a), false, "이번에 켠 동안은 다시 시도하지 않습니다");
  assert.equal(a.calls.update, 1);
});

test("인터넷이 끊겼거나 새 파일 받기가 실패하면 지금 버전 그대로", async () => {
  const off = await loadApp({ offline: true, cacheHas: "9.9.9" });
  assert.equal(await go(off), false);
  assert.equal(off.calls.reload, 0);
  const bad = await loadApp({ installs: true, installFails: true, cacheHas: "9.9.9" });
  assert.equal(await go(bad), false);
  assert.equal(bad.calls.reload, 0);
});

test("쓰는 도중에는 바꾸지 않습니다 — 손댄 뒤·다른 화면·열린 창·입력 칸·처음 등록·입양 받기·예시", async () => {
  const cases = [
    [{}, "chat", "대화창"],
    [{ overlay: true }, "home", "열린 시트"],
    [{ fixedZ: 210 }, "home", "사진 크게 보기 같은 팝업"],
    [{ activeEl: "INPUT" }, "home", "입력 중인 칸"],
    [{ search: "?adopt=abc" }, "home", "입양 받기"],
  ];
  for (const [o, screen, why] of cases) {
    const a = await loadApp({ installs: true, cacheHas: "9.9.9", ...o });
    assert.equal(await go(a, screen), false, why);
    assert.equal(a.calls.reload, 0, why);
  }
  const touched = await loadApp({ installs: true, cacheHas: "9.9.9" });
  touched.run("AUTO_UPD.touched = true");
  assert.equal(await go(touched), false, "켠 뒤 이미 누르셨으면");
  const late = await loadApp({ installs: true, cacheHas: "9.9.9" });
  late.run("AUTO_UPD.startedAt = Date.now() - 60000");
  assert.equal(await go(late), false, "켠 지 오래됐으면");
  const onb = await loadApp({ installs: true, cacheHas: "9.9.9" });
  onb.store.set("cg_onb", "2");
  assert.equal(await go(onb), false, "처음 등록 진행 중");
});

test("새 파일을 받는 사이에 화면을 누르시면 그만둡니다", async () => {
  const a = await loadApp({ installs: true, cacheHas: "9.9.9" });
  const p = go(a);
  a.run("AUTO_UPD.touched = true");
  assert.equal(await p, false);
  assert.equal(a.calls.reload, 0);
});

test("새 버전이 없으면 아무것도 하지 않습니다", async () => {
  const a = await loadApp({ installs: true, cacheHas: "9.9.9" });
  a.run("VER.latest = { app: APP_VERSION, schema: 1, minSchema: 1 }");
  assert.equal(await go(a), false);
  assert.equal(a.calls.update, 0);
});

test("화면 연결 — 켤 때·돌아올 때 확인 뒤 자동 적용, 바꾸는 동안 안내 막대 숨김, 알리는 말 없음", async () => {
  const src = await read("src/app.jsx");
  assert.match(src, /VER\.check\(\)\.then\(auto\)/);
  assert.match(src, /AUTO_UPD\.busy \? null : VER\.blocked\(\)/);
  assert.match(src, /screenNameRef\.current = screen\.name/);
  const block = src.slice(src.indexOf("const AUTO_UPD = {"), src.indexOf("const SYNC = {"));
  assert.doesNotMatch(block, /showToast|caches\.delete/, "토스트도, 캐시 지우기도 없습니다");
});
