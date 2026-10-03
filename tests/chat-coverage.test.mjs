/* v1.9.17 — 대화 ↔ 화면 기능 전수 연동 (대표님 지시 2026-10-03)
   "크범이 공유하고 싶어"가 메모로 담긴 제보에서 시작해, 화면에서 되는 일을 40문장으로 실측했고
   못 하던 것을 planAppChat 한 곳에 달았습니다. 이 테스트는
   ① 그 문장들이 제 기능으로 가는지  ② 평소 기록 문장은 건드리지 않는지  를 함께 지킵니다. */
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
  const run = (c) => vm.runInContext(c, sb);
  run(`DB.saveIndividuals([{ id: 'a', name: '크범이', gender: 'female' }, { id: 'b', name: '크한이', gender: 'male' }, { id: 'c', name: '크순이', gender: 'female' }]);
       DB.saveEvents([{ id: 'g1', individualId: 'a', type: 'growth', date: '2026-09-20', data: { weight: '45' } },
                      { id: 'f1', individualId: 'a', type: 'feeding', date: '2026-10-01', data: {} },
                      { id: 'x1', individualId: null, type: 'ledger', date: '2026-10-01', data: { flow: 'out', category: '사료·먹이', amount: 30000 } }]);`);
  // 대화와 같은 방식: 문장 속 이름 → 대상, 없으면 지금 이야기 중인 아이(크범이)
  return (t) => JSON.parse(run(`(() => { const n = findNamesInText(${JSON.stringify(t)}, DB.getIndividuals());
    const p = planAppChat(${JSON.stringify(t)}, n[0] || DB.getIndividuals()[0], n);
    return JSON.stringify(p && { kind: p.kind, what: p.what, value: p.value, op: p.op, on: p.on }); })()`));
}

test("every screen feature can be said in the chat", async () => {
  const plan = await loadApp();
  const cases = [
    ["크범이 공유하고 싶어", { kind: "share", op: "on" }], ["크범이 공유 링크 만들어줘", { kind: "share", op: "on" }],
    ["크범이 기록 보내고 싶어", { kind: "share", op: "on" }], ["크범이 공유 꺼줘", { kind: "share", op: "off" }],
    ["크범이 공유 새 주소로 바꿔줘", { kind: "share", op: "rotate" }], ["크범이 공유 미리보기", { kind: "share", op: "preview" }],
    ["크범이 즐겨찾기 해줘", { kind: "flag", what: "favorite", on: true }], ["크범이 즐겨찾기 빼줘", { kind: "flag", what: "favorite", on: false }],
    ["크범이 킵해줘", { kind: "flag", what: "keep", on: true }], ["크범이 KEEP 풀어줘", { kind: "flag", what: "keep", on: false }],
    ["크범이 우리집에서 나온 애야", { kind: "flag", what: "mine", on: true }], ["크범이 MY 표시 떼줘", { kind: "flag", what: "mine", on: false }],
    ["크범이 산란 시즌 끝났어", { kind: "season", op: "end" }], ["크범이 시즌 다시 시작했어", { kind: "season", op: "open" }],
    ["크범이 삭제해줘", { kind: "delInd" }], ["크범이랑 크순이 같은 애야 합쳐줘", { kind: "merge" }],
    ["크범이 몸무게 47g으로 고쳐줘", { kind: "fixWeight" }], ["크범이 밥 준 거 지워줘", { kind: "delEvent" }],
    ["크범이 대표사진 바꿔줘", { kind: "avatar" }], ["크범이 입양자 연락처 010-1234-5678", { kind: "adopter" }],
    ["크범이 1차 해칭 2차로 옮겨줘", { kind: "moveHatch" }], ["사료 3만원 지출 지워줘", { kind: "delLedger" }],
    ["인큐 온도 24도로 바꿔줘", { kind: "set", what: "incubate", value: 24 }], ["밥 3일마다 줘", { kind: "set", what: "feedInterval", value: 3 }],
    ["밥 월요일 목요일에 줘", { kind: "set", what: "feedDays", value: [1, 4] }], ["5일 안 먹으면 알려줘", { kind: "set", what: "feedWarn", value: 5 }],
    ["베이비 이름 물어보기로 바꿔줘", { kind: "set", what: "babyNaming", value: "ask" }], ["형님이라고 불러줘", { kind: "set", what: "call", value: "형님" }],
    ["말투 친근하게 해줘", { kind: "set", what: "tone", value: "friendly" }], ["브리더 이름 크레건설로 해줘", { kind: "set", what: "breeder", value: "크레건설" }],
    ["다크모드로 바꿔줘", { kind: "set", what: "theme", value: "charcoal" }], ["그린 테마로 해줘", { kind: "set", what: "theme", value: "green" }],
    ["엑셀로 내려줘", { kind: "export", what: "excel" }], ["백업해줘", { kind: "export", what: "backup" }],
    ["다음주 화요일 크범이 병원 알림 해줘", { kind: "remind" }], ["알림 목록 보여줘", { kind: "alerts" }],
    ["캘린더 열어줘", { kind: "go" }], ["설정 열어줘", { kind: "go" }], ["산란 탭 보여줘", { kind: "go" }],
  ];
  for (const [t, want] of cases) {
    const got = plan(t);
    assert.ok(got, `못 알아들음: ${t}`);
    for (const k of Object.keys(want)) assert.deepEqual(got[k], want[k], `${t} → ${k}`);
  }
});

test("ordinary record sentences are left to the old paths", async () => {
  const plan = await loadApp();
  for (const t of ["크범이 45g", "크범이 밥 먹었어 슈푸", "크범이 탈피했어", "크범이 알 2개 낳았어", "크한이랑 크범이 메이팅했어",
    "크범이 알 해칭했어 2마리", "크범이 모프는 릴리화이트야", "크범이 암컷이야", "크범이 아빠는 크한이야", "크범이 분양했어 30만원",
    "크범이 분양가능 30만원", "크범이 예약됐어", "크범이 거식 3일째", "크범이 온도 25도 습도 70", "크범이 생일 언제야?",
    "크범이 다음 산란 언제야", "이번 달 얼마 썼어?", "사료 3만원 샀어", "크범이 무지개다리 건넜어", "크범이 별로 안 먹어",
    "크범이 우리 집 애 중에 제일 커", "크범이 내가 키운 지 1년", "크범이 색깔이 진해졌어", "크범이 3일 전에 밥 먹었는지 알려줘",
    "애칭은 범범이라고 불러", "크범이 귀엽다", "크범이 사진", "크범이 크한이랑 붙이면 뭐 나와?", "크범이 짝 추천해줘",
    "크범이 혈통 보여줘", "크범이 기록 보여줘", "크영이랑 크범이는 동배야", "크범이 꼬리 빠졌어"]) {
    assert.equal(plan(t), null, t);
  }
});

test("source contracts for the chat ↔ screen bridge", async () => {
  const src = await read("src/app.jsx");
  assert.ok(src.indexOf("const ap = planAppChat(text, t0, names0);") < src.indexOf("const lq = answerLedgerQuery(text);"), "가계부보다 먼저");
  assert.ok(src.indexOf("const ap = planAppChat(text, t0, names0);") < src.indexOf("// 3.5) 새 주체(미등록) 감지"), "새 이름 감지보다 먼저");
  assert.match(src, /kind: 'app-do', value: \{ op: 'del-ind'/, "개체 지우기는 버튼으로 한 번 더 여쭙니다");
  assert.match(src, /kind: 'app-do', value: \{ op: 'merge'/, "합치기도 버튼으로");
  assert.match(src, /await PUB\.put\(\{ \.\.\.g, shareCode: code \}\)/, "공유는 화면과 같은 PUB 를 씁니다");
  assert.match(src, /useState\(!!openShare\)/, "[공유 화면 열기]로 가면 펼친 채로");
  assert.match(src, /제가 아직 못 알아들었어요/, "해 달라는 말을 못 알아들으면 말없이 메모로 담지 않습니다");
});
