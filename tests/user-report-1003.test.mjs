/* v1.9.15 — 외부 사용자 제보(2026-10-03)
   ① 산란 탭에서도 직접 등록·수정(메이팅 날짜 · 산란 · 알 부화/대기 · 따로 등록한 아이를 산란과 잇기)
   ② '되돌리기'로 대기가 된 알을 다시 부화로 만들 길이 없음
   ③ 해칭 기록을 2마리로 고쳐도 산란 탭에는 1개 대기가 남음
   ④ 해칭으로 자동 등록된 "n호" 아이의 이름 변경이 저장 안 됨(같은 이름이 있어 막혔는데 안내가 창 뒤에 가려짐)
   그리고 같은 일을 대화로도 할 수 있어야 합니다.
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
  const run = (c) => vm.runInContext(c, sb);
  const json = (c) => JSON.parse(run(`JSON.stringify(${c})`));
  return { run, json };
}

/* 제보 화면 그대로: 미로 1차 알 2개 — 알별 기록에 손댄 적 있고(1 대기 · 2 부화), 해칭 기록은 2마리로 고침.
   크순 1차(6/21 산란, 아빠 크돌) · 따로 등록한 크롱(8/20생, 부모 없음) */
function seed(run) {
  run(`DB.saveIndividuals([
    { id: 'miro', name: '미로', gender: 'female' },
    { id: 'mom', name: '크순', gender: 'female' }, { id: 'dad', name: '크돌', gender: 'male' },
    { id: 'krong', name: '크롱', gender: 'unknown', hatchDate: '2026-08-20' },
  ]);
  DB.saveEvents([
    { id: 'l2', individualId: 'miro', type: 'laying', date: '2025-09-27', data: { eggCount: 2, sireName: '세이블헷(렙타일갤러리)',
      eggUnits: [{ status: 'pending' }, { status: 'hatched', date: '2025-12-11' }] } },
    { id: 'h2', individualId: 'miro', type: 'hatching', date: '2025-12-11', data: { count: '2', layingId: 'l2' } },
    { id: 'm1', individualId: 'mom', type: 'mating', date: '2026-05-20', data: { partnerId: 'dad', partnerName: '크돌' } },
    { id: 'l1', individualId: 'mom', type: 'laying', date: '2026-06-21', data: { eggCount: 2 } },
  ]);`);
}
const stateOf = (json, id) => json(`clutchRows().find(r => r.e.id === '${id}').units.map(u => u.status)`);
const countOf = (run, id) => run(`(DB.getEvents().find(e => e.id === '${id}') || { data: {} }).data.count`);

test("③ fixing the hatch record to 2 shows both eggs hatched, even after the eggs were touched by hand", async () => {
  const { run, json } = await loadApp();
  seed(run);
  assert.deepEqual(stateOf(json, "l2"), ["hatched", "hatched"], "부화 기록 2마리 = 부화 알 2개");
  assert.equal(run(`clutchRows().find(r => r.e.id === 'l2').state`), "부화완료");
  // 줄이면 알도 대기로 돌아옵니다
  run(`DB.updateEvent('h2', { data: { count: '1', layingId: 'l2' } })`);
  assert.deepEqual(stateOf(json, "l2").filter(s => s === "hatched").length, 1);
  // 지우면 부화였던 알이 전부 대기로
  run(`DB.deleteEvent('h2')`);
  assert.deepEqual(stateOf(json, "l2"), ["pending", "pending"]);
});

test("② an egg can go 부화 → 대기 → 부화 again, and the hatch count follows", async () => {
  const { run, json } = await loadApp();
  seed(run);
  assert.equal(run(`EGG.set('l2', 0, 'pending').ok`), true);
  assert.deepEqual(stateOf(json, "l2"), ["pending", "hatched"]);
  assert.equal(countOf(run, "h2"), "1", "대기로 돌리면 부화 기록도 한 마리 줄어듭니다");
  const r = json(`EGG.set('l2', 0, 'hatched', { date: '2025-12-11' })`);
  assert.equal(r.ok, true);
  assert.deepEqual(stateOf(json, "l2"), ["hatched", "hatched"]);
  assert.equal(countOf(run, "h2"), "2", "같은 날 부화 기록에 한 마리 더");
  // 다른 날 부화로 바꾸면 그날 기록이 새로 생깁니다
  run(`EGG.set('l2', 1, 'hatched', { date: '2025-12-13' })`);
  assert.equal(countOf(run, "h2"), "1");
  assert.equal(run(`DB.getEvents().filter(e => e.type === 'hatching' && e.date === '2025-12-13' && e.data.layingId === 'l2').length`), 1);
  // 무정란으로 바꾸면 부화 기록에서 빠집니다
  run(`EGG.set('l2', 1, 'infertile')`);
  assert.equal(run(`DB.getEvents().filter(e => e.type === 'hatching' && e.date === '2025-12-13').length`), 0);
  // 앞날·산란일 이전은 막습니다
  assert.equal(run(`EGG.set('l2', 1, 'hatched', { date: '2025-09-01' }).ok`), false);
  assert.equal(run(`EGG.set('l2', 1, 'hatched', { date: '2999-01-01' }).ok`), false);
});

test("① link a separately registered baby to a laying record (크롱 ← 크순 6/21)", async () => {
  const { run, json } = await loadApp();
  seed(run);
  const r = json(`linkBabyToClutch('l1', 'krong', '')`);
  assert.equal(r.ok, true);
  assert.equal(r.date, "2026-08-20", "생일이 있으면 그날을 부화일로");
  const k = json(`DB.getIndividuals().find(i => i.id === 'krong')`);
  assert.equal(k.damId, "mom"); assert.equal(k.sireId, "dad"); assert.equal(k.hatchDate, "2026-08-20");
  const row = json(`(() => { const r = clutchRows().find(r => r.e.id === 'l1'); return { units: r.units.map(u => u.status), babies: r.babies.map(b => b.name) }; })()`);
  assert.deepEqual(row.units, ["hatched", "pending"]);
  assert.deepEqual(row.babies, ["크롱"], "알 화면 '부화한 아이들'에 크롱이 보입니다");
  assert.equal(json(`linkBabyToClutch('l1', 'krong', '')`).already, true, "두 번 이어도 한 번만");
});

test("① direct mating / laying records keep the chat's side effects", async () => {
  const { run, json } = await loadApp();
  seed(run);
  run(`recordMating({ femaleId: 'miro', partnerName: '세이블헷(렙타일갤러리)', date: '2026-09-01' })`);
  run(`recordLaying({ momId: 'mom', date: '2026-07-20', eggCount: 2 })`);
  const lay = json(`DB.getEvents().find(e => e.type === 'laying' && e.date === '2026-07-20')`);
  assert.equal(lay.data.sireId, "dad", "아빠를 비우면 산란일 이전 마지막 메이팅 상대로");
  assert.equal(lay.data.eggCount, 2);
  const mate = json(`DB.getEvents().find(e => e.type === 'mating' && e.individualId === 'miro')`);
  assert.equal(mate.data.partnerName, "세이블헷(렙타일갤러리)");
  // 남의 집 수컷 이름으로 아기 이름을 지어도 괄호가 끼지 않습니다 ("로)1호" → "로헷1호")
  assert.equal(json(`makeBabyNames('미로', '세이블헷(렙타일갤러리)', 1, [])`)[0], "로헷1호");
  // 산란을 지우면 묶여 있던 부화 기록의 연결만 풀립니다
  run(`DB.deleteEvent('l2')`);
  assert.equal(run(`DB.getEvents().find(e => e.id === 'h2').data.layingId === undefined`), true);
});

test("chat: the same four things can be said", async () => {
  const { run, json } = await loadApp();
  seed(run);
  const plan = (t, who, names) => json(`(() => { const p = planBreedChat(${JSON.stringify(t)}, DB.getIndividuals().find(i => i.id === '${who}'), [${(names || [who]).map(n => `DB.getIndividuals().find(i => i.id === '${n}')`).join(",")}]);
    return p && { kind: p.kind, rows: p.rows ? p.rows.map(r => r.e.id) : undefined, count: p.count, to: p.to, field: p.field, baby: p.baby && p.baby.name, hatch: p.hatch && p.hatch.id, ev: p.ev && p.ev.id }; })()`);
  // 잇기 — 이름 둘이라도 '2마리 해칭'으로 새지 않습니다
  assert.deepEqual(plan("크롱은 크순이 6월 21일 낳은 알에서 나왔어", "krong", ["krong", "mom"]),
    { kind: "link", rows: ["l1"], baby: "크롱" });
  assert.equal(plan("크롱 크순 1차 알에서 태어났어", "krong", ["krong", "mom"]).kind, "link");
  // 부화 마릿수 고치기 — 새 해칭 기록을 하나 더 만들지 않습니다
  assert.deepEqual(plan("미로 해칭 2마리로 고쳐줘", "miro"), { kind: "hatchFix", hatch: "h2", count: 2 });
  // 메이팅 날짜 · 산란일 · 알 개수
  assert.deepEqual(plan("크순 메이팅 5월 3일로 고쳐줘", "mom"), { kind: "mateFix", ev: "m1", to: `${new Date().getFullYear()}-05-03` });
  assert.equal(plan("크순 산란일 6월 20일로 바꿔줘", "mom").field, "date");
  assert.deepEqual(plan("크순 1차 알 3개로 고쳐줘", "mom"), { kind: "layFix", rows: ["l1"], field: "eggCount", to: 3 });
  // 평범한 기록은 건드리지 않습니다
  for (const t of ["크순 알 2개 낳았어", "크순 크돌이랑 메이팅했어", "크순 알 해칭했어 2마리", "크순 12그램"]) {
    assert.equal(plan(t, "mom"), null, t);
  }
  // 알 하나 대기·부화
  assert.deepEqual(json(`extractEggFix("1차 1번 알 대기로 돌려줘")`), { index: 1, status: "pending", reason: "", explicitEgg: true });
  assert.equal(json(`extractEggFix("2번 알 부화로 바꿔줘")`).status, "hatched");
  assert.equal(json(`extractEggFix("1번 알 아직 안 나왔어")`).status, "pending", "'안 나왔'은 부화가 아닙니다");
  assert.equal(json(`extractEggFix("알 아직 안 나왔어")`), null, "알을 짚지 않은 기다림은 기록이 아닙니다");
  assert.equal(json(`extractEggFix("알 2개 낳았어")`), null);
  assert.deepEqual(json(`datesIn("6월 21일 산란 6월 20일로 고쳐줘")`).map(d => d.slice(5)), ["06-21", "06-20"]);
});

test("source contracts: one place for egg state, visible warnings, merge offer", async () => {
  const src = await read("src/app.jsx");
  const html = await read("index.html");
  const z = (sel) => Number((html.match(new RegExp("\\." + sel + " \\{[^}]*z-index: (\\d+)")) || [])[1]);
  assert.ok(z("toast") > z("pe-bg"), "안내(토스트)가 수정 창보다 위에 떠야 합니다 — ④의 원인");
  assert.match(src, /data-testid="pe-dup"/, "같은 이름이면 합치기를 제안합니다");
  assert.match(src, /DB\.mergeIndividuals\(keep\.id, gecko\.id, 'keep'\)/);
  assert.match(src, /const r = EGG\.set\(layingId, i, ef\.status/, "대화의 알별 수정도 EGG.set 을 씁니다");
  assert.match(src, /const r = EGG\.set\(ev\.id, i, status, opt\)/, "알 화면도 EGG.set 을 씁니다");
  assert.doesNotMatch(src, /\{!hatched && \(\s*<button className="btn btn-primary btn-sm" style=\{\{flex:1\}\} data-testid=\{'egg-hatch-'/, "부화 버튼이 부화 기록이 있다고 사라지면 안 됩니다");
  for (const id of ["lay-add", "mate-add", "lay-edit", "link-baby", "egg-sheet", "es-baby", "bs-save"]) {
    assert.ok(src.includes(`data-testid="${id}"`), `missing screen contract: ${id}`);
  }
  // 대화: 잇기·고치기는 여러 아이 담기보다 먼저
  assert.ok(src.indexOf("const bp = planBreedChat(text, target, names);") < src.indexOf("/* 3.1) 여러 아이에게 같은 기록"));
});

/* v1.9.16 — 제보 후속(2026-10-03): 알을 부화로 적었다가 되돌리면 그때 자동 등록된 아기(별산1호)가 남았습니다.
   이제 알을 대기로 돌리면 남은 아기를 알려주고, 고르시면 지웁니다(말없이 지우지 않습니다). */
test("undoing a hatch reports the auto-registered baby, and deletes it only when asked", async () => {
  const { run, json } = await loadApp();
  run(`DB.saveIndividuals([{ id: 'mom', name: '새별이', gender: 'female' }, { id: 'dad', name: '크산이', gender: 'male' }]);
       DB.saveEvents([{ id: 'm', individualId: 'mom', type: 'mating', date: '2026-06-26', data: { partnerId: 'dad', partnerName: '크산이' } },
                      { id: 'l', individualId: 'mom', type: 'laying', date: '2026-07-28', data: { eggCount: 2 } }]);`);
  const h = json(`EGG.set('l', 0, 'hatched', { date: '2026-10-03', newBaby: true })`);
  assert.equal(h.baby, "별산1호");
  // 실제 제보 데이터 모양: 예전 '되돌리기'로 알만 대기, 부화 기록·아기는 남음
  run(`DB.setEggUnits('l', [{ status: 'pending', date: '2026-10-03' }, { status: 'pending' }])`);
  assert.deepEqual(stateOf(json, "l"), ["hatched", "pending"], "부화 기록이 남아 있으니 부화로 보입니다");
  const r = json(`EGG.set('l', 0, 'pending')`);
  assert.deepEqual(r.orphans.map(b => b.name), ["별산1호"], "남은 아기를 알려줍니다");
  assert.equal(run(`DB.getEvents().filter(e => e.type === 'hatching').length`), 0, "부화 기록은 지워집니다");
  assert.equal(run(`DB.getIndividuals().some(i => i.name === '별산1호')`), true, "아기는 고르기 전까지 그대로");
  assert.deepEqual(json(`EGG.dropBabies(${JSON.stringify(r.orphans.map(b => b.id))})`), ["별산1호"]);
  assert.equal(run(`DB.getIndividuals().some(i => i.name === '별산1호')`), false);
  // 무정란 → 대기 같은 변경에는 묻지 않습니다
  run(`EGG.set('l', 1, 'infertile')`);
  assert.deepEqual(json(`EGG.set('l', 1, 'pending')`).orphans, []);
  const src = await read("src/app.jsx");
  assert.ok(src.includes('data-testid="orphan-ask"') && src.includes("kind: 'drop-baby'"), "화면·대화 모두 여쭙습니다");
});
