/* v1.9.30 — 산란 화면 '알 수'가 122로 나오던 것 (대표님 제보 2026-10-15)
   대화로 적은 알 개수가 글자("2")로 저장돼, 12 + "2" → "122" 처럼 이어 붙었습니다. 실제는 14개. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = (f) => readFile(new URL(f, root), "utf8");

test("알 개수가 글자로 저장돼 있어도 숫자로 더한다", async () => {
  const store = new Map();
  const noop = () => {};
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
  const T = "2026-01-01T00:00:00.000Z", today = new Date();
  const ago = (n) => new Date(today.getTime() - n * 86400000).toISOString().slice(0, 10);
  const inds = [{ id: "m", name: "크밤이", gender: "female", status: "own", createdAt: T, updatedAt: T }];
  const evs = Array.from({ length: 7 }, (_, i) => ({ id: "l" + i, individualId: "m", type: "laying", date: ago(10 + i * 5), data: { eggCount: i === 0 ? "2" : 2 }, createdAt: T, updatedAt: T }));
  sb.__inds = inds; sb.__evs = evs;
  const rows = JSON.parse(vm.runInContext("JSON.stringify(clutchRows(__inds, __evs).map(r => [typeof r.eggs, r.eggs, r.waiting]))", sb));
  assert.ok(rows.every(([t]) => t === "number"), "알 개수는 숫자");
  const sum = rows.filter(r => r[2]).reduce((s, r) => s + r[1], 0);
  assert.equal(sum, 14);
  const src = await read("src/app.jsx");
  assert.match(src, /const eggSum = rows\.filter\(r => r\.waiting\)\.reduce\(\(s, r\) => s \+ \(parseInt\(r\.eggs, 10\) \|\| 0\), 0\)/);
  assert.doesNotMatch(src, /eggCount: String\(/, "대화로 적어도 숫자로 저장");
  assert.match(src, /품는 알\(확인분\)/);
});
