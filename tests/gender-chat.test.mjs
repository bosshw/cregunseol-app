/* v1.9.9 — 대화에서 성별 알아듣기 (대표님 제보 2026-09-28)
   "크범이 암컷이야"만 알아듣고 "크범이 암컷" · "크범이 암컷으로 바꿔줘"는 메모로 흘려보냈습니다.
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

test("gender is understood however it is said", async () => {
  const run = await loadApp();
  const g = (t) => { const r = JSON.parse(run(`JSON.stringify(genderClaim(${JSON.stringify(t)}))`)); return r && r.value; };
  for (const t of ["크범이 암컷", "크범이 암컷으로 바꿔줘", "크범이 암컷이야", "크범이 암컷임", "크범이 성별 암컷으로 변경",
                   "크범이 수컷 아니고 암컷이야", "크범이 암컷 산란 2개", "하늘이 암컷 릴리화이트", "하늘이 릴리화이트 암컷",
                   "크범이 암컷인 것 같아", "크범이 성별은 암", "크범이 암컷!", "크범이 암컷으로 해줘", "크범이 암놈"]) {
    assert.equal(g(t), "female", t);
  }
  for (const t of ["크산이 수컷", "크산이 수컷으로 바꿔줘", "크산이 숫컷", "크산이 수컷이에요"]) assert.equal(g(t), "male", t);
  // 성별 선언이 아닌 말은 건드리지 않습니다
  for (const t of ["크범이 수컷이랑 합사했어", "크범이 암컷이야?", "크범이 암컷인지 모르겠어", "암컷 몇 마리야",
                   "새끼 암컷 2마리 수컷 1마리", "크범이 암컷 아니야", "크범이 암컷한테 밥 줬어", "암컷 짝 추천해줘",
                   "크범이 산란 2개", "암컷들 밥 줬어"]) {
    assert.equal(g(t), null, t);
  }
  // 고쳐 달라는 말인지
  const ch = (t) => JSON.parse(run(`JSON.stringify(genderClaim(${JSON.stringify(t)}))`)).change;
  assert.equal(ch("크범이 암컷으로 바꿔줘"), true);
  assert.equal(ch("크범이 수컷 아니고 암컷이야"), true);
  assert.equal(ch("크범이 암컷"), false);
});

test("an empty gender is filled, an explicit '바꿔줘' changes it, a plain conflicting claim asks first", async () => {
  const run = await loadApp();
  const plan = (gender, text) => JSON.parse(run(`JSON.stringify(planProfileFix({ id: 'k', name: '크범이', gender: ${JSON.stringify(gender)} }, ${JSON.stringify(text)}, []))`));
  // 비어 있으면 뒤의 '성별 반영' 단계가 바로 적습니다 (다른 기록과 함께 담기도록 여기서는 비켜 줍니다)
  assert.equal(plan("unknown", "크범이 암컷"), null);
  assert.equal(plan("female", "크범이 암컷"), null);
  assert.deepEqual(plan("male", "크범이 암컷으로 바꿔줘"), { kind: "apply", field: "gender", from: "male", to: "female" });
  assert.equal(plan("male", "크범이 암컷").kind, "ask");
});

test("the chat screen uses the one gender reader everywhere", async () => {
  const src = await read("src/app.jsx");
  const chat = src.slice(src.indexOf("function SmartChatScreen("), src.indexOf("function ProfileScreen("));
  assert.doesNotMatch(chat, /\(수컷\|암컷\)\(\?:이야/, "옛 좁은 규칙이 되살아나면 안 됩니다");
  assert.equal((chat.match(/genderClaim\(text\)/g) || []).length, 3, "새 이름 판단 · 등록 · 성별 반영 세 곳");
  assert.match(src, /이미 \$\{euroWord\(genderLabel\(gv\)\)\} 적혀 있어요/);
});
