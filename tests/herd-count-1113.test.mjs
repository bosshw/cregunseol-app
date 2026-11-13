/* v1.9.63 대화로 마릿수 묻기 (대표님 2026-11-13)
   "초초 몇 마리야?" · "초초 관련 몇 마리" · "모프별 몇 마리" · "암컷 몇 마리" — 이름 없이 물으면 곁에 있는 아이를 셉니다.
   예전엔 "등록하려는 아이가 누구인가요?"로 빠졌습니다. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = (f) => readFile(new URL(f, root), "utf8");

async function load() {
  const store = new Map(), noop = () => {};
  const el = () => ({ style: { setProperty: noop }, appendChild: noop, addEventListener: noop, setAttribute: noop });
  const sb = { console, setTimeout, clearTimeout, setInterval, clearInterval, Math, JSON, Promise, URL, URLSearchParams, Date, Intl, Uint8Array,
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k), key: i => [...store.keys()][i], get length() { return store.size; } },
    navigator: { userAgent: "node" }, document: { documentElement: el(), getElementById: el, createElement: el, head: el(), body: el(), addEventListener: noop, querySelector: () => null },
    location: { search: "", pathname: "/", href: "http://x/", origin: "http://x" }, history: { pushState: noop, replaceState: noop }, fetch: () => Promise.reject(new Error("offline")),
    matchMedia: () => ({ matches: false, addEventListener: noop }), React: { createElement: () => ({}), Fragment: "f" }, ReactDOM: { createRoot: () => ({ render: noop }) },
    addEventListener: noop, removeEventListener: noop, dispatchEvent: noop, innerHeight: 800 };
  sb.window = sb; sb.globalThis = sb; sb.self = sb;
  vm.createContext(sb);
  vm.runInContext(await read("app.min.js"), sb);
  const T = "2026-01-01T00:00:00.000Z";
  const mk = (id, name, gender, morph, status = "own") => ({ id, name, gender, morph, status, createdAt: T, updatedAt: T });
  sb.__inds = [mk("a", "가온이", "female", "50헷초초"), mk("b", "나래", "female", "릴리화이트 헷초초"), mk("c", "다솜", "male", "초초"),
    mk("d", "라온3호", "unknown", "50헷초초"), mk("e", "마루", "female", "릴리화이트"), mk("f", "바다", "male", "할리퀸"),
    mk("g", "사랑1호", "unknown", ""), mk("h", "아라", "male", "초초", "sold")];
  return (q) => { sb.__q = q; return vm.runInContext("answerHerdQuery(__q, __inds)", sb); };
}

test("모프 말이 들어 있으면 그 글자가 들어간 아이를 모두 세고, 모프별로 나눠 보여 준다", async () => {
  const ask = await load();
  const a = ask("나 초초 몇마리있어?");
  assert.match(a, /초초 들어간 아이는 4마리예요\. \(암 2 · 수 1 · 미구분 1\)/);
  assert.match(a, /· 50헷초초 2마리 — 가온이, 라온3호/);
  assert.match(a, /· 릴리화이트 헷초초 1마리 — 나래/);
  assert.match(a, /분양 간·떠난 아이 1마리는 뺐어요/, "분양 간 아라는 빼고 센다");
  assert.equal(ask("초초 관련 몇마리야"), a, "'관련'을 붙여도 같은 답");
  assert.match(ask("헷초초 몇 마리?"), /헷초초 들어간 아이는 3마리예요/, "헷초초는 초초 비주얼을 빼고");
  assert.match(ask("초초 암컷 몇 마리"), /초초 들어간 암컷 아이는 2마리예요\./);
  assert.match(ask("릴리랑 초초 몇마리"), /릴리·초초 들어간 아이는 1마리예요/);
  assert.match(ask("팬텀 몇마리야"), /팬텀 들어간 아이는 지금 곁에 없어요/);
});

test("모프 없이 물으면 전체·성별, '모프별'이면 모프마다 (미입력은 맨 끝)", async () => {
  const ask = await load();
  assert.match(ask("나 몇마리 있어?"), /지금 곁에 있는 아이는 7마리예요\.\n암 3 · 수 2 · 미구분 2/);
  assert.match(ask("암컷 몇마리"), /지금 곁에 있는 암컷 아이는 3마리예요/);
  const b = ask("모프별 몇 마리야?");
  assert.match(b, /모프별로는요\n· 50헷초초 2마리/);
  assert.match(b, /· 모프 미입력 1마리$/);
});

test("이름이 있거나 새끼·부화·분양 물음이면 다른 답에 맡긴다", async () => {
  const ask = await load();
  for (const q of ["가온이 새끼 몇 마리야", "몇 마리 나왔어", "분양 몇마리 했어", "가온이 몇 마리야", "알 몇 개 낳았어"]) assert.equal(ask(q), null, q);
  const src = await read("src/app.jsx");
  assert.match(src, /const hq = answerHerdQuery\(text\);\n    if \(hq\) \{ bot\(hq\); return; \}\n\n    \/\/ 2\.95\) 가계부/, "가계부·새 개체 등록보다 먼저 봅니다");
});
