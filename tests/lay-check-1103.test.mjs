/* v1.9.44 산란 체크표 · 산란 예정 폰 알림 · 색 테마 4가지 (대표님 2026-11-03, 오픈채팅 건의)
   ★ 체크는 따로 저장하지 않습니다 — [낳았어요] = 산란 기록 한 줄(recordLaying). 그래서 전체 데이터가 저절로 이어집니다. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const rd = async (p) => (await readFile(new URL("../" + p, import.meta.url), "utf8")).replace(/\r\n/g, "\n");
const app = await rd("src/app.jsx"), ex = await rd("src/extras.jsx");
const fn = await rd("supabase/functions/push/index.ts"), sql = await rd("supabase_push.sql");

test("checklist: 3 days ahead, until laid, season-ended folded away", () => {
  assert.match(app, /const LAYCHK_AHEAD = 3;/);
  assert.match(app, /layingForecasts\(inds, evs\)\.filter\(f => !f\.seasonEnded && f\.late >= -LAYCHK_AHEAD\)/);
  const d = ex.slice(ex.indexOf("function layCheckData("), ex.indexOf("(function lcCss()"));
  assert.match(d, /const rest = fcs\.filter\(f => f\.seasonEnded\)/, "시즌 닫은 아이는 따로 접어 둠");
  assert.doesNotMatch(d, /LAY_GRACE/, "알림처럼 6~13일 조용히 숨기지 않음");
});

test("checking = a real laying record (no separate check store)", () => {
  const s = ex.slice(ex.indexOf("function LayCheckSheet("), ex.indexOf("function LayCheck("));
  assert.match(s, /recordLaying\(\{ momId: f\.indId, date, eggCount: n, \.\.\.sire \}\)/);
  assert.doesNotMatch(ex, /cg_laycheck|layChecked/, "체크 상태를 따로 두지 않음");
  assert.match(app, /layExpected\(o\.momId, date, data\);\n\s*return DB\.addEvent\(\{ individualId: o\.momId, type: 'laying'/, "예정일·늦은 날수는 기록 안에");
  assert.match(app, /dadId, dadName,/, "체크한 산란도 같은 짝으로 이어짐");
});

test("laying tab shows the checklist and the chip shows how many to check", () => {
  assert.match(app, /<Extra part="LayCheck" navigate=\{navigate\}/);
  assert.match(app, /k === 'laying' && layDueN > 0 && <span className="lc-badge">/);
  assert.match(ex, /AddGeckoSheet, chat, LayCheck,/);
});

test("push: laying 3 days ahead + the day, own toggle, opens the checklist", () => {
  const p = app.slice(app.indexOf("function pushPlan("), app.indexOf("const PUSH = {"));
  assert.match(p, /k: 'lay', t: `\$\{t0\} 산란 예정이 3일 뒤예요 🥚`/);
  assert.match(p, /if \(f\.eta >= today\) out\.push\(\{ d: f\.eta, k: 'lay'/);
  assert.match(p, /if \(f\.seasonEnded \|\| f\.eta > until\) return;/);
  assert.match(app, /lay: s\.pushLay !== false/, "기본 켬");
  assert.match(app, /hatch: p\.hatch, feed: p\.feed, lay: p\.lay/);
  assert.match(app, /if \(name === 'laying'\) navigate\('home', \{ view: 'laying' \}\)/);
  assert.match(fn, /lay: 'laying'/); assert.match(fn, /k === 'lay' \? s\.lay !== false/);
  assert.match(fn, /hatch,feed,lay'/);
  assert.match(sql, /add column if not exists lay boolean not null default true/);
});

test("themes: 연하늘 · 연핑크 · 핫핑크 · 화이트, readable buttons", () => {
  for (const k of ["sky", "pink", "hotpink", "white"]) assert.match(app, new RegExp(`key: '${k}'`));
  assert.match(app, /\[\/핫\\s\*핑크\|진한\\s\*\(\?:핑크\|분홍\)\/, 'hotpink'\], \[\/연\\s\*핑크\|핑크\|분홍\/, 'pink'\]/, "핫핑크를 먼저 봐야 '핑크'에 안 먹힘");
  const L = (h) => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const cr = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  for (const m of app.matchAll(/tv\(\[(?:'#[0-9A-F]{6}',){5}'(#[0-9A-F]{6})'/g)) assert.ok(cr(m[1], "#FFFFFF") >= 4.5, `버튼 글씨가 읽혀야 함 ${m[1]}`);
});

test("winter (Oct–Apr due dates) waits 3 weeks before asking about the season; button says 산란", () => {
  assert.match(app, /const LAY_LATE_WARN_WINTER = 21;/);
  assert.match(app, /return m >= 10 \|\| m <= 4 \? LAY_LATE_WARN_WINTER : LAY_LATE_WARN;/);
  assert.match(app, /overdue: late >= warn,/);
  assert.match(ex, /data-testid="lc-go">산란<\/button>/);
  assert.doesNotMatch(ex, />낳았어요</);
});

test("winter laying push also 3 days after the due date", () => {
  const p = app.slice(app.indexOf("function pushPlan("), app.indexOf("const PUSH = {"));
  assert.match(p, /const post = addDaysISO\(f\.eta, PUSH_AHEAD\);/);
  assert.match(p, /if \(layWarnDays\(f\.eta\) === LAY_LATE_WARN_WINTER && post >= today && post <= until\)/);
  assert.match(p, /산란 예정일이 3일 지났어요 🥚/);
});
