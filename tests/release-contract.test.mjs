import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const file = (name) => new URL(name, root);

test("keeps storage, synchronization, and core workflows intact", async () => {
  const source = await readFile(file("src/app.jsx"), "utf8");

  for (const contract of [
    "cg_individuals",
    "cg_events",
    "cg_reminders",
    "cg_settings",
    "cg_dirty",
    "cg_tombstones",
    "firstSync()",
    "pullReplace()",
    "compressImage(file, cb)",
    "function SmartChatScreen",
    "recordSale(id, opt)",
    "function buildWorkbook",
    "ReactDOM.createRoot",
  ]) {
    assert.ok(source.includes(contract), `missing contract: ${contract}`);
  }

  assert.match(source, /const APP_VERSION = '4\.9'/);
  assert.match(source, /Powered by cre_construct · CC/);
  assert.doesNotMatch(source, /Powered by 크레건설/);
  assert.match(source, /addEvents\(events\)/);
  assert.match(source, /DB\.addEvents\(additions\)/);
  assert.doesNotMatch(
    source.match(/const allAte = \(\) => \{[\s\S]*?\n  \};/)?.[0] ?? "",
    /DB\.addEvent\(/,
  );
});

test("keeps service worker and release metadata aligned", async () => {
  const [worker, version] = await Promise.all([
    readFile(file("sw.js"), "utf8"),
    readFile(file("version.json"), "utf8").then(JSON.parse),
  ]);

  assert.equal(version.app, "4.9");
  assert.equal(version.schema, 1);
  assert.equal(version.minSchema, 1);
  assert.match(worker, /const CACHE = 'creg-v49'/);

  for (const asset of [
    "./index.html",
    "./app.min.js",
    "./vendor/react.production.min.js",
    "./vendor/react-dom.production.min.js",
  ]) {
    assert.ok(worker.includes(asset), `service worker is missing ${asset}`);
  }
  assert.doesNotMatch(worker, /babel|cdnjs\.cloudflare\.com/i);
  await access(file("app.min.js"));
});

test("keeps the v4.4 calendar and compact-question fixes", async () => {
  const source = await readFile(file("src/app.jsx"), "utf8");

  for (const contract of [
    "💬 대화로 등록부터 기록까지",
    "const compactQ =",
    "label: '먹이 예정'",
    "const CALENDAR_FED_EMOJI = '🍽️🥩'",
    "const CALENDAR_FEED_PLAN_EMOJI = '🍽️'",
    "label: r.nth ? `${r.nth}차 산란 예정` : '산란 예정', detail: ''",
    "e.type === 'feeding' ? CALENDAR_FED_EMOJI",
    "{CALENDAR_FED_EMOJI} 먹인 날",
    "차 산란 예정",
    "차 부화 예정",
    "function CalendarScreen",
    "openCalendarItem",
    "data-testid=\"calendar-month-item\"",
    "data-testid=\"status-grid\"",
    "gridTemplateColumns:'repeat(4,minmax(0,1fr))'",
  ]) {
    assert.ok(source.includes(contract), `missing v4.4 contract: ${contract}`);
  }
});

test("keeps the v4.5 conversation upgrades", async () => {
  const source = await readFile(file("src/app.jsx"), "utf8");

  for (const contract of [
    "function relDate(text)",
    "function countIn(text, unit)",
    "const KNUM_ALT",
    "const RE_EGGPHOTO",
    "const RE_UNDO_ALL",
    "function extractEggFix(text)",
    "key: 'env'",
    "const markEggPhoto",
    "const eggLikely",
    "type: 'eggphoto'",
    "DB.recordSale(f.targetId",
  ]) {
    assert.ok(source.includes(contract), `missing v4.5 contract: ${contract}`);
  }

  // 알 사진은 개체가 아니라 산란 기록에 붙습니다 (저장 두 번째 차례)
  assert.match(source, /list\.filter\(f => f\.type === 'eggphoto'\)/);
  // "분양 취소"는 담긴 기록 취소로 새지 않습니다
  assert.match(source, /!\/분양\|예약\|보유\/\.test\(text\)/);
});

test("keeps the v4.6 assistant voice in one place", async () => {
  const source = await readFile(file("src/app.jsx"), "utf8");

  for (const contract of [
    "const KIDS = '애깅이들'",
    "const CALL_DEFAULT = 'breeder'",
    "const TONE_DEFAULT = 'polite'",
    "function briefLines()",
    "function homeLine()",
    "function chatHello()",
    "function alertLine(r)",
    "function whenWord(iso)",
    "function agoWord(iso)",
    "const dayWord =",
    "function todaySituation()",
    'data-testid="today-brief"',
    'data-testid="voice-card"',
  ]) {
    assert.ok(source.includes(contract), `missing v4.6 contract: ${contract}`);
  }

  // 문구는 VOICE 한 곳에서만 만듭니다 — 화면이 옛 라벨을 그대로 박아두면 FAIL
  assert.doesNotMatch(source, /header-sub">💬 대화로 등록부터 기록까지/);
  assert.ok(source.includes("{homeLine()}"), "home subtitle must come from homeLine()");
  assert.ok(source.includes("{alertLine(r)}"), "reminder card must come from alertLine()");
});

test("keeps the v4.8 kinship, morph and voice contracts", async () => {
  const source = await readFile(file("src/app.jsx"), "utf8");

  for (const contract of [
    // 말투 — 세 갈래를 한 자리에서 고릅니다
    "const say = (polite, friendly, short)",
    "const twoLine = (head, tail)",
    "function greetCore()",
    "function voiceSample()",
    "const naWord =",
    // 혈연 — 판정은 relationOf 한 곳에서만
    "function relationOf(a, b, all)",
    "function mateWarning(a, b, all)",
    "function littermatesOf(gecko, all)",
    "function sibIdsOf(id, byId, list)",
    "linkClutch(ids)",
    "unlinkClutch(id)",
    // 모프 — 확률로 말할 수 있는 것만
    "function readGenes(gecko)",
    "function morphForecast(a, b)",
    "function morphAnswer(a, b)",
    "function mateSuggestions(target, all, evs)",
    "function mateAnswer(target)",
  ]) {
    assert.ok(source.includes(contract), `missing v4.8 contract: ${contract}`);
  }

  // 긴 문장은 화면에서 줄이 살아야 합니다
  assert.ok(source.includes("whiteSpace:'pre-line'"), "long sentences need pre-line rendering");
  // 혈연 판정을 화면에서 따로 세면 결론이 갈립니다 — mateWarning 만 씁니다
  assert.ok(source.includes("mateWarning(byId[p.male.id], byId[p.female.id], individuals)"),
    "mating pairs must use mateWarning()");
  // 설정 미리보기는 고정 견본으로 — 데이터가 없는 날에도 차이가 보여야 합니다
  assert.ok(source.includes("{voiceSample().map("), "settings preview must use voiceSample()");
  // 버전 문자열 4곳
  assert.ok(source.includes("const APP_VERSION = '4.9'"), "APP_VERSION must be 4.9");
});

test("keeps the v4.9 hatching, morph and wording fixes", async () => {
  const source = await readFile(file("src/app.jsx"), "utf8");

  for (const contract of [
    // 해칭·알별 기록은 "지금 품고 있는 알"에 붙어야 합니다
    "function waitingClutches(individualId, rows)",
    "explicitEgg: index !== null || all",
    "ef.status !== 'hatched' || ef.explicitEgg",
    "kind: 'hatch-clutch'",
    "kind: 'hatch-count'",
    "const askHatchCount =",
    "const applyEggFix =",
    // 모프 — 사실대로
    "function incDomSplit(a, b)",
    "const SABLE_WORDS = ['슈퍼세이블', '슈퍼 세이블', '세이블', 'sable']",
    "const AXAN_WORDS  = ['아잔틱', '악산틱', '액산틱', 'axanthic']",
  ]) {
    assert.ok(source.includes(contract), `missing v4.9 contract: ${contract}`);
  }

  // 잘못 쓴 모프 이름은 다시 들어오면 안 됩니다
  assert.doesNotMatch(source, /사블레/, "Sable must be 세이블");
  assert.doesNotMatch(source, /액시안식/, "Axanthic must be 아잔틱");
  // 프라푸치노는 카푸치노 + 릴리화이트입니다 (세이블 아님)
  assert.ok(source.includes("프라푸치노(카푸치노+릴리)"), "Frappuccino = Cappuccino + Lily White");
  // 날짜는 숫자로 — 세는 말은 못 알아듣는 분이 많습니다
  assert.doesNotMatch(source, /'하루', '이틀', '사흘'/, "date words must be numeric");
  assert.ok(source.includes("const dayWord = (n) => `${Math.abs(Math.round(Number(n) || 0))}일`"), "dayWord must be numeric");
  // 탭 이름
  assert.ok(source.includes("브리핑"), "reminders tab is now 브리핑");
  assert.ok(source.includes("const APP_VERSION = '4.9'"), "APP_VERSION must be 4.9");
});
