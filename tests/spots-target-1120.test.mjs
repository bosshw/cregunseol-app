/* v1.9.66 "점이 많아" (대표님 2026-11-20)
   크온이와 이야기하던 중 "점이많아"·"점이 많아"라고 하면 '점 많음'으로 적어야 하는데,
   "점이많아"·"점이"를 새 이름으로 잡아 "처음 보는 이름이네요. 새 개체로 등록할까요?"를 물었습니다. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const read = (f) => readFile(new URL("../" + f, import.meta.url), "utf8");
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
  return (code) => JSON.parse(vm.runInContext(`JSON.stringify((() => { ${code} })())`, sb));
}

test("'점이많아'·'점이 많아'·'점 많아'는 점 이야기로 알아듣는다", async () => {
  const run = await load();
  for (const q of ["점이많아", "점이 많아", "점 많아", "점이 많아요"]) assert.deepEqual(run(`return spotsClaim(${JSON.stringify(q)});`), { value: "점 많음" }, q);
});

test("점 이야기 속 낱말은 새 이름 후보로 쓰지 않는다", async () => {
  const src = await read("src/app.jsx");
  assert.match(src, /const c = c0 && spotsC && \/점\/\.test\(c0\) \? null : c0;/);
});
