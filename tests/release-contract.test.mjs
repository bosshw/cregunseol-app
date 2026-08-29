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

  assert.match(source, /const APP_VERSION = '4\.5'/);
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

  assert.equal(version.app, "4.5");
  assert.equal(version.schema, 1);
  assert.equal(version.minSchema, 1);
  assert.match(worker, /const CACHE = 'creg-v45'/);
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
