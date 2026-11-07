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

/* v1.9.55 대표님 2026-11-07 "데려온 애가 어떻게 MY겠어" */
test("adopted geckos are never auto-MY even with known parents; manual MY still wins", () => {
  assert.match(app, /const isMine = \(i\) => !!i && !i\.cgOff && !i\.isExternal && \(i\.isFromCreGunseol === true \|\| \(!i\.adopted && !i\.adoptFrom && !!\(i\.sireId \|\| i\.damId\)\)\);/);
  /* v1.9.56 같은 종류 점검 — 외부 개체·공유로 받은 아이·추가 화면에서 MY 안 켠 아이·처음 보는 이름 + 데려왔어 */
  assert.match(app, /fromUs: isMine\(gecko\)/, "공유 기록의 '우리 집 출신'도 MY 판정과 같게");
  assert.match(app, /if \(hp\.adopt \|\| hp\.ask\) markAdopted\(saved\.id\);/);
  assert.match(app, /const babies = inds\.filter\(i => \(i\.sireId \|\| i\.damId\) && isMine\(i\)\)/, "엑셀 해칭기록에 데려온 아이 안 들어감");
  assert.match(ex, /adopted: !v\.mine,/, "개체 추가에서 MY 안 켜면 부모를 골라도 MY 아님");
  assert.match(ex, /damId: null, adopted: true,\n    shareCode: newShareCode\(\),\n    adoptFrom: \{/);
  assert.match(app, /if \(source \|\| price !== ''\) markAdopted\(indId\);/, "입양처·입양가 적으면 데려온 아이");
  assert.match(app, /if \(who\) \{ markAdopted\(who\.id\);/, "\"데려왔어\"만 말해도");
  assert.match(app, /if \(markAdoptedFromMemos\(\)\) refreshIndividuals\(\);/, "예전 기록도 한 번만 정리");
  assert.match(app, /g\.isFromCreGunseol !== true\) \{ DB\.updateIndividual\(id, \{ adopted: true \}\)/, "MY 직접 켠 아이는 건드리지 않음");
});

/* v1.9.57 동기화 — 두 기기가 같은 기록을 고쳐도 서로의 칸을 덮지 않게 (대표님 2026-11-07) */
test("sync merges per field instead of overwriting whole records/settings", () => {
  assert.match(app, /return \{ \.\.\.r, updatedAt: t, _ft: stampFields\(p, r, t\) \};/, "고친 칸마다 시각");
  assert.match(app, /const ftOf = \(o, k\) => \(o && o\._ft \? \(o\._ft\[k\] \|\| ''\) : /, "옛 기록은 한 줄 단위로");
  assert.match(app, /const merged = mergeFields\(list\[idx\], incoming, pending\.has\(row\.kind \+ '\|' \+ row\.id\)\);/, "못 올린 기록은 같은 시각이면 이 기기 쪽");
  assert.match(app, /const merged = mergeFields\(settings, incoming, pending\.has\('settings\|main'\)\);/, "설정도 칸마다");
  assert.doesNotMatch(app, /if \(pending\.has\('settings\|main'\)\) return;/, "못 올린 설정이 있다고 서버 것을 통째로 무시하지 않음");
  assert.match(app, /if \(this\.again\) \{ this\.again = false; this\.touch\(\); \}/, "합친 결과를 다시 올림");
  assert.match(app, /if \(dataChanged\) \{ markAdoptedFromMemos\(\);/, "다른 기기에서 온 입양 메모도 반영");
});

/* v1.9.58 전체 점검 (대표님 2026-11-07 "다른 방면에서의 오류는 없었어? 꼼꼼히 살펴보고 리팩토링도") */
test("renames flow into stored partner/sire names; merges move sire links; breeding sires stay out of the sale inbox", () => {
  assert.match(app, /if \(before && p\.name\.trim\(\) && before\.name !== p\.name\) this\.relabel\(id, p\.name\);/, "이름 바꾸면 기록 속 짝·아빠 이름도");
  assert.match(app, /relabelAll\(\) \{/);
  assert.match(app, /if \(x\.data && x\.data\.sireId === dropId\) x = \{ \.\.\.x, data: \{ \.\.\.x\.data, sireId: keepId/, "합치기 뒤 산란 기록 아빠 연결 유지");
  assert.match(app, /const useL = !eq && \(lt > rt \|\| \(!!mine && lt >= rt && lt !== ''\)\);/, "못 올린 변경은 같은 시각이면 이 기기 쪽");
  assert.match(ex, /all\.forEach\(i => \{ if \(i\.sireId\) bred\.add\(i\.sireId\); if \(i\.damId\) bred\.add\(i\.damId\); \}\);/, "부모인 아이는 분양 대기함에 안 뜸");
  assert.match(app, /const APP_PATCHED = '2026-11-07';/, "설정의 최근 업데이트 날짜");
  for (const dead of ["NOTIFY_WINDOW", "CONDITION_STALE", "HATCH_AFTER_LAYING", "FEED_DUE", "const eggDone", "const euro ", "const irang "]) assert.ok(!app.includes(dead), "안 쓰는 코드 정리: " + dead);
});
