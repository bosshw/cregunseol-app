/* v1.9.12 — 기록 공유 한 장 (대표님: "공유하니까 너무 뭐가 없다, 공유의 의미가 0")
   먹이 16줄만 나가던 것을 → 한눈에 요약 · 브리딩 이력 · 자식 · 미리 보기로.
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

function seed(run) {
  run(`(() => {
    const iso = (n) => addDaysISO(todayStr(), -n);
    const ind = [{ id: 'k', name: '크범이', gender: 'female', morph: '노말 핀타입', hatchDate: '2024-05-01' },
                 { id: 's', name: '크산이', gender: 'male', morph: '초초' }];
    for (let i = 1; i <= 4; i++) ind.push({ id: 'b' + i, name: '범림' + i + '호', damId: 'k', sireId: 's', morph: '릴리', hatchDate: i <= 2 ? '2026-07-05' : '2026-08-20' });
    DB.saveIndividuals(ind);
    const ev = [];
    for (let i = 0; i < 16; i++) ev.push({ id: 'f' + i, individualId: 'k', type: 'feeding', date: iso(i * 3), data: { foodType: '슈푸' } });
    ev.push({ id: 'm1', individualId: 'k', type: 'mating', date: '2026-04-01', data: { partnerId: 's', partnerName: '크산이', notes: '비밀메모' } });
    ev.push({ id: 'l1', individualId: 'k', type: 'laying', date: '2026-05-10', data: { eggCount: '2', sireId: 's', notes: '비밀메모2' } });
    ev.push({ id: 'h1', individualId: 'k', type: 'hatching', date: '2026-07-05', data: { layingId: 'l1', count: '2' } });
    ev.push({ id: 'l2', individualId: 'k', type: 'laying', date: '2026-06-20', data: { eggCount: '2', sireId: 's' } });
    ev.push({ id: 'h2', individualId: 'k', type: 'hatching', date: '2026-08-20', data: { layingId: 'l2', count: '2' } });
    ev.push({ id: 'sh', individualId: 'k', type: 'shed', date: iso(12), data: {} });
    ev.push({ id: 'memo', individualId: 'k', type: 'memo', date: '2026-02-01', data: { notes: '입양처: 비밀샵 · 입양가 30만원' } });
    DB.saveEvents(ev);
  })()`);
}

test("the shared page now carries a summary, breeding history and children — not 16 feeding lines", async () => {
  const run = await loadApp(); seed(run);
  const snap = JSON.parse(run(`JSON.stringify(publicSnapshot(DB.getIndividuals().find(i => i.id === 'k')))`));
  assert.equal(snap.v, 2);
  assert.equal(snap.logs.filter(l => l.type === 'feeding').length, 0, "먹이는 줄줄이 나가지 않습니다");
  assert.ok(snap.summary.feed30 >= 10, "먹이는 요약으로");
  assert.deepEqual(snap.summary.food, ["슈푸"]);
  assert.equal(snap.summary.sheds, 1);
  assert.equal(snap.breeding.clutches, 2);
  assert.equal(snap.breeding.eggs, 4);
  assert.equal(snap.breeding.hatched, 4);
  assert.deepEqual(snap.breeding.mates, ["크산이"]);
  assert.deepEqual(snap.breeding.kids.map(k => k.name), ["범림1호", "범림2호", "범림3호", "범림4호"]);
  const txt = JSON.stringify(snap);
  assert.doesNotMatch(txt, /비밀|30만원|입양/, "메모 글·입양처·입양가는 나가지 않습니다");
  // 아빠 쪽에서 봐도 같은 이력이 잡힙니다
  const dad = JSON.parse(run(`JSON.stringify(publicSnapshot(DB.getIndividuals().find(i => i.id === 's')))`));
  assert.equal(dad.breeding.clutches, 2);
  assert.deepEqual(dad.breeding.mates, ["크범이"]);
  assert.equal(dad.breeding.kids.length, 4);
});

test("an open link refreshes as soon as records change (not once a day)", async () => {
  const run = await loadApp(); seed(run);
  const a = run(`publicSig(DB.getIndividuals().find(i => i.id === 'k'))`);
  assert.equal(run(`publicSig(DB.getIndividuals().find(i => i.id === 'k'))`), a, "같은 기록이면 같은 값");
  run(`DB.addEvent({ individualId: 'k', type: 'growth', date: todayStr(), data: { weight: '45' } })`);
  assert.notEqual(run(`publicSig(DB.getIndividuals().find(i => i.id === 'k'))`), a, "새 기록이 생기면 다시 올립니다");
  const src = await read("src/app.jsx");
  assert.match(src, /if \(gecko\.publicSig === sig\) return;/);
});

test("the page draws the new sections, still reads old links, and has an in-app preview", async () => {
  const [page, src] = await Promise.all([read("g.html"), read("src/app.jsx")]);
  for (const s of ["✨ 한눈에", "🥚 브리딩 이력", "자식 ", "cgPreviewReady", "cgPreview"]) assert.ok(page.includes(s), s);
  assert.match(page, /logs = logs\.filter\(function \(l\) \{ return l\.type !== 'feeding'; \}\);/, "옛 한 장(v1)도 먹이 줄을 묶어서 보여 줍니다");
  assert.match(src, /data-testid="public-preview"/);
  assert.match(src, /data-testid="public-contents"/);
  assert.match(src, /src=\{PUBLIC_PAGE \+ '\?preview=1'\}/);
});
