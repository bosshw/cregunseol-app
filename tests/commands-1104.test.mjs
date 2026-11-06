/* v1.9.50 대화 명령 묶음 (대표님 2026-11-04) — 무게체크명령 · 기록점검명령 · 분양준비명령 · 명령어
   + 아이별 산란 리듬(겨울/봄·여름 간격 따로) */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const rd = async (p) => (await readFile(new URL("../" + p, import.meta.url), "utf8")).replace(/\r\n/g, "\n");
const app = await rd("src/app.jsx"), ex = await rd("src/extras.jsx");
const part = ex.slice(ex.indexOf("v1.9.50 대화 명령 묶음"), ex.lastIndexOf("window.CREG_EXTRAS = {"));

test("command words end with 명령 and the chat keeps routing answers to the running command", () => {
  assert.match(app, /\[\/무게\\s\*체크\\s\*명령\/, 'weightCheck'\]/);
  assert.match(app, /\[\/기록\\s\*점검\\s\*명령\/, 'healthCheck'\]/);
  assert.match(app, /\[\/분양\\s\*준비\\s\*명령\|킵\\s\*체크\\s\*명령\|KEEP\\s\*체크\\s\*명령\/i, 'saleReady'\]/);
  assert.match(app, /cmdRef\.current = X\[cmd\]\(text, \{ bot, refreshIndividuals, navigate \}\) \? cmd : null;/);
  assert.match(app, /if \(\/모프\\s\*누락\\s\*명령\/\.test\(text\)\) cmdRef\.current = null; else if \(CMD_RUN\.some/, "새 명령이 하던 명령을 내려놓음");
  assert.doesNotMatch("무게 체크", /무게\s*체크\s*명령/, "'무게 체크'만으로는 명령이 아님");
  for (const k of ["weightCheck", "healthCheck", "saleReady", "cmdHelp", "HealthCard", "SaleReady"]) assert.match(ex, new RegExp(`\\b${k}\\b,`));
});

test("weight check: number only, same-day replaces, drop flagged, undo restores", () => {
  assert.match(part, /const WC_NUM = /);
  assert.ok(/^(\d+(?:\.\d+)?)\s*(g|그램|그람|지)?\s*(이요|요|이에요|예요)?$/i.test("12.5g"));
  assert.match(part, /e\.type === 'growth' && e\.date === today/, "같은 날 다시 재면 고쳐 적음");
  assert.match(part, /if \(d <= -1 \|\| \(before\.w > 0 && d \/ before\.w <= -0\.05\)\)/);
  assert.match(part, /else DB\.deleteEvent\(evId\);/, "취소 = 방금 적은 것만");
  assert.match(part, /isHere\(g\)/);
});

test("health check only links (never renames) and asks before fixing", () => {
  const p = part.slice(part.indexOf("function healthPlan("), part.indexOf("function HealthCard("));
  assert.match(p, /sireByName\(d\.sireName, inds\)/);
  assert.match(p, /sireByName\(d\.partnerName, inds\)/);
  assert.match(p, /if \(!b\.sireId\) kidFix\.push/);
  assert.doesNotMatch(p, /updateIndividual\([^)]*name:/, "이름은 바꾸지 않음");
  assert.match(p, /지금 이어 둘까요\?/);
  assert.match(app, /<Extra part="HealthCard"/);
});

test("sale decision inbox (v1.9.53): one line only when something to decide, KEEP or sale makes it disappear", () => {
  const p = part.slice(part.indexOf("const SALE_DEF"), part.indexOf("/* ── 근친점검명령"));
  assert.match(p, /const SALE_DEF = \{ w: 5, d: 90 \};/);
  assert.match(p, /s\.saleMinWeight/); assert.match(p, /s\.saleMinDays/);
  assert.match(p, /statusOf\(g\) !== 'own' \|\| g\.isExternal \|\| g\.keep \|\| bred\.has\(g\.id\)/, "KEEP·번식 아이는 대기함에 안 뜸");
  assert.match(p, /if \(!list\.length && !open\) return null;/, "정할 게 없으면 아무것도 안 보임");
  assert.match(p, /how === 'keep' \? \{ keep: true \} : \{ status: 'available', keep: false \}/);
  assert.match(p, /나머지 전부 🔒 KEEP/);
  assert.match(p, /나머지는 🔒 KEEP으로 둘게요/);
  assert.match(p, /이렇게 할까요\?/, "대화는 한 번 더 묻고 바꿈");
  assert.match(app, /<Extra part="SaleReady" navigate=\{navigate\}/);
  assert.match(p, /if \(lw && lw\.w < r\.w\) return;/, "v1.9.54 무게 기록이 없으면 나이만 봄");
  assert.match(p, /'무게 없음'/);
});

test("laying rhythm: winter and spring/summer gaps are learned separately per animal", () => {
  assert.match(app, /const isWinterDay = \(d\) =>/);
  assert.match(app, /if \(ownW\.length >= 2\) \{ interval = median\(ownW\); basis = `본인 \$\{sw\} 간격/);
  assert.match(app, /else if \(herdW\[w\]\.length >= 3\)/);
});

/* v1.9.51 근친점검명령 · 월간보고명령 (대표님 2026-11-04) */
test("kin check uses the one relationOf judge and is honest about missing parents", () => {
  assert.match(app, /\[\/근친\\s\*점검\\s\*명령\/, 'kinCheck'\]/);
  const p = part.slice(part.indexOf("function kinData("), part.indexOf("function mrMonth("));
  assert.match(p, /relationOf\(f, m, inds\)/);
  assert.doesNotMatch(p, /function relationOf/, "판정을 따로 만들지 않음");
  assert.match(p, /혈연을 알 수 없어 판정에서 빠져요/);
  assert.match(p, /isHere\(g\) && isGrown\(g\)/);
});

test("monthly report counts records of that month only and never invents zeros", () => {
  assert.match(app, /\[\/월간\\s\*보고\\s\*명령\/, 'monthReport'\]/);
  const p = part.slice(part.indexOf("function mrMonth("), part.lastIndexOf("/* v1.9.35"));
  assert.match(p, /if \(\/지난\\s\*달\|저번\\s\*달\|전달\/\.test\(t\)\)/);
  assert.match(p, /ledgerRows\(evs, inds\)\.filter\(r => !r\.opening && inM\(r\.date\)\)/);
  assert.match(p, /if \(D\.lay\) B\.push/, "기록이 있는 칸만 말함");
  assert.match(p, /월간보고명령 \$\{mrShift\(ym, -1\)\.slice\(0, 4\)\}년/, "지난달 칩은 해까지 적어 1년 넘게 거슬러가도 맞음");
});
