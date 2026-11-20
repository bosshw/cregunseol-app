/* v1.9.67 못 알아듣던 말 모음 (대표님 2026-11-20 "비슷하게 못 알아먹을 말 찾아봐")
   대화 101문장을 실제 화면에서 돌려 보니 31문장이 "처음 보는 이름이네요"로 새고, 몇 문장은 다른 기록으로 잡혔습니다. */
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
const INDS = JSON.stringify([{ id: "a", name: "가온이" }, { id: "b", name: "밤울" }, { id: "c", name: "밤울4호" }]);

test("대화 중인 아이가 있을 때 이름이 아닌 첫 낱말은 새 이름으로 잡지 않는다", async () => {
  const run = await load();
  for (const q of ["방금 밥 먹었어", "아까 슈푸 먹었어", "좀전에 탈피했어", "지난주에 탈피했어", "엄청 잘먹었어", "드디어 탈피했다", "꼬리 끊겼어", "꼬리끊김",
    "등에 상처났어", "발가락 탈피 남았어", "거식중이야", "컨디션 좋아", "활발해", "기운없어", "축 늘어져있어", "설사해", "릴리화이트야", "초초같아", "헷초초야",
    "습도 70", "온도 25도", "물 줬어", "은신처 바꿔줬어", "칼슘 먹였어", "비타민 줬어", "무지개다리 건넜어", "약 먹였어"])
    assert.equal(run(`return guessNewName(${JSON.stringify(q)}, ${INDS}, true);`), null, q);
  for (const q of ["죽었어", "먹여줬어", "방금 밥 먹었어", "습도 70"]) assert.equal(run(`return guessNewName(${JSON.stringify(q)}, ${INDS}, false);`), null, "아이 없이도: " + q);
});

test("진짜 새 이름은 그대로 묻는다 (모프 낱말로 시작해도·숫자가 붙어도)", async () => {
  const run = await load();
  for (const [q, want] of [["마루 12그램", "마루"], ["코코 탈피했어", "코코"], ["팬텀이 12g", "팬텀이"], ["릴리2 탈피했어", "릴리2"], ["가온이2 12그램", "가온이2"]])
    assert.equal(run(`return guessNewName(${JSON.stringify(q)}, ${INDS}, true);`), want, q);
  assert.equal(run(`return extractNameDecl("이름 바꿀래");`), null, "'바꿀래'는 이름이 아님");
  assert.equal(run(`return extractNameDecl("이름은 마루야");`), "마루");
});

test("이름 바로 뒤에 숫자가 붙으면 다른 아이, 숫자 뒤에 단위면 그 아이", async () => {
  const run = await load();
  assert.deepEqual(run(`return findNamesInText("가온이2 12그램", ${INDS}).map(i => i.name);`), []);
  assert.deepEqual(run(`return findNamesInText("가온이12그램", ${INDS}).map(i => i.name);`), ["가온이"]);
  assert.deepEqual(run(`return findNamesInText("밤울4호 탈피했어", ${INDS}).map(i => i.name);`), ["밤울4호"], "밤울과 밤울4호를 둘 다 잡지 않음");
});

test("기록 종류를 바로 잡는다", async () => {
  const run = await load();
  const types = (q) => run(`return extractFacts(${JSON.stringify(q)}).map(f => f.type + (f.data.issue ? ':' + f.data.issue : '') + (f.data.weight ? ':' + f.data.weight : ''));`);
  assert.deepEqual(types("꼬리가 끊겼어"), ["health:꼬리 자절"]);
  assert.deepEqual(types("무게 12"), ["growth:12"]);
  assert.deepEqual(types("죽었어"), ["health:폐사"]);
  assert.deepEqual(types("귀뚜라미가 죽었어").includes("health:폐사"), false, "귀뚜라미가 죽은 건 아님");
  for (const q of ["물 줬어", "은신처 바꿔줬어", "바닥재 갈아줬어", "약 먹였어"]) assert.equal(types(q).includes("feeding"), false, q);
  for (const q of ["슈푸 줬어", "먹여줬어", "칼슘 넣어줬어", "방금 밥 먹었어"]) assert.equal(types(q).includes("feeding"), true, q);
  assert.equal(run(`return extractMorph("헷초초야");`), "헷초초");
  assert.equal(run(`return extractMorph("50헷초초야");`), "50헷초초");
  assert.deepEqual(run(`return spotsClaim("도살점 3개");`), { value: "도살점 3개" });
});

test("안 먹었다는 말엔 먹이 종류를 묻지 않고, '메모해줘 ○○'는 메모로", async () => {
  const src = await read("src/app.jsx");
  assert.match(src, /!f\.data\.foodType && f\.data\.ate !== false/);
  assert.match(src, /const memoCmd = text\.match\(/);
  assert.match(src, /의 새 이름을 알려주세요/);
});
