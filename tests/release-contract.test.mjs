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

  assert.match(source, /const APP_VERSION = '1\.2'/);
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

  assert.equal(version.app, "1.2");
  assert.equal(version.schema, 1);
  assert.equal(version.minSchema, 1);
  assert.match(worker, /const CACHE = 'creg-v20'/);

  for (const asset of [
    "./index.html",
    "./app.min.js",
    "./vendor/preact-shim.min.js",
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
    "const CALENDAR_FED_EMOJI",         // v5.0: 아이콘 하나로 바뀜 (🦗 충식 / 🥣 슈푸)
    "const CALENDAR_FEED_PLAN_EMOJI",
    "label: r.nth ? `${r.nth}차 산란 예정` : '산란 예정', detail: ''",
    "e.type === 'feeding' ? fedEmoji(e)",
    "🦗 충식 먹인 날",
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
  assert.ok(source.includes("const APP_VERSION = '1.2'"), "APP_VERSION must be 1.2");
});

test("keeps the v5.0 particle, line-break and calendar fixes", async () => {
  const raw = await readFile(file("src/app.jsx"), "utf8");
  // 주석은 빼고 실제로 화면에 나가는 코드만 검사합니다
  const source = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  for (const contract of [
    "const josa = (w, withJong, withoutJong)",
    "const eunneun = (w)",
    "const eulreul = (w)",
    "const gwawa  = (w)",
    "const igunyo = (w)",
    "function euroWord(w)",
    "const fedEmoji = (e)",
  ]) {
    assert.ok(source.includes(contract), `missing v5.0 contract: ${contract}`);
  }

  // 괄호로 얼버무린 조사가 다시 들어오면 FAIL — 한국어는 받침만 보면 규칙이 정해져 있습니다
  assert.doesNotMatch(source, /\((?:이|은|는|을|를|과|와|으)\)/, "use josa helpers, not (이)/(은)/(으)");
  assert.doesNotMatch(source, /(?:은|을|와|이)\((?:는|를|과|가)\)/, "use josa helpers, not 은(는)/을(를)");
  // 먹인 날 아이콘은 하나만 (예전엔 🍽️🥩 두 개가 붙어 있었습니다)
  assert.doesNotMatch(source, /'🍽️🥩'/, "fed emoji must be a single icon");
  // 홈 한 줄은 인사만 합니다 (v5.2 — 할 일은 브리핑 카드가 말합니다)
  assert.doesNotMatch(source, /\[greetLine\(\), what\]/, "home line no longer lists jobs");
  assert.ok(source.includes("APP_VERSION = '1.2'"), "APP_VERSION must be 1.2");

  // 캘린더 먹이 줄에 이모지가 두 번 나오면 안 됩니다 (줄 앞에 이미 🦗/🥣 가 붙습니다)
  assert.ok(source.includes("if (e.type === 'feeding') label = label.replace"), "feed label must drop its own emoji");
  assert.ok(source.includes("[it.name, it.label].filter(Boolean).join(isFeed ? ' ' : ' · ')"), "feed row joins without a dot");
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
  assert.ok(source.includes("const APP_VERSION = '1.2'"), "APP_VERSION must be 1.2");
});

test("keeps the v5.2 nudge contracts", async () => {
  const raw = await readFile(file("src/app.jsx"), "utf8");
  const source = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  for (const contract of [
    "const NUDGE_KEEP =",
    "const NUDGE_BUSY =",
    "function nudgeLog()",
    "function recordNudge(n)",
    "function nudgeCandidates(individuals, events)",
    "function todayNudge(individuals, events)",
    "function nudgeAction(n, navigate)",
  ]) {
    assert.ok(source.includes(contract), `missing v5.2 contract: ${contract}`);
  }

  // 제안 열 가지가 모두 살아 있어야 합니다
  for (const key of ["'ovul'", "'gender'", "'morph'", "'photo'", "'weight'",
                     "'price'", "'lineage'", "'mate'", "'shed'", "'ledger'"]) {
    assert.ok(source.includes(`key: ${key}`), `missing nudge candidate ${key}`);
  }

  // 한 이슈가 여러 자리에서 되풀이되면 안 됩니다 —
  // 브리핑 맨 위와 대화 첫 인사는 할 일을 나열하지 않습니다
  const brief = source.slice(source.indexOf("function briefLines()"),
                             source.indexOf("function voiceSample()"));
  assert.ok(brief.includes("todayNudge()"), "briefLines must lead with today's nudge");
  assert.doesNotMatch(brief, /jobs/, "briefLines must not list jobs any more");
  const hello = source.slice(source.indexOf("function chatHello()"),
                             source.indexOf("function alertLine(r)"));
  assert.doesNotMatch(hello, /briefLines\(\)/, "chat greeting must not repeat the briefing");

  // 오늘 정한 제안은 하루 동안 그대로여야 합니다
  assert.ok(source.includes("log.length && log[0].date === today"), "nudge is recorded once a day");
  // 급한 일이 밀린 날엔 제안이 비켜줍니다
  assert.ok(source.includes("if (busy > NUDGE_BUSY) return null"), "nudge yields on busy days");
  // 화면에서 제안은 눌러서 바로 갈 수 있어야 합니다
  assert.ok(source.includes('data-testid="nudge-go"'), "nudge needs an action button");
  assert.ok(source.includes("recordNudge(nudge)"), "reminders screen must record the nudge");

  assert.ok(source.includes("APP_VERSION = '1.2'"), "APP_VERSION must be 1.2");
});

test("keeps the v5.3 public-record contracts", async () => {
  const raw = await readFile(file("src/app.jsx"), "utf8");
  const source = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  for (const contract of [
    "const newShareCode =",
    "const PUBLIC_TABLE = 'cg_public'",
    "const PUBLIC_PAGE  = 'g.html'",
    "const PUBLIC_KINDS =",
    "const PUBLIC_NEVER =",
    "function publicUrl(code)",
    "function publicSnapshot(gecko, allInds, allEvs)",
    "const PUB = {",
    "async put(gecko)",
    "async remove(code)",
  ]) {
    assert.ok(source.includes(contract), `missing v5.3 contract: ${contract}`);
  }

  // ── 돈 이야기는 절대 나가지 않습니다 ──
  const snap = source.slice(source.indexOf("function publicSnapshot("),
                            source.indexOf("const PUB = {"));
  for (const banned of ["salePrice", "saleFree", "ledger", "price", "amount", "buyer", "contact"]) {
    assert.doesNotMatch(snap, new RegExp(banned),
      `public snapshot must not carry ${banned}`);
  }
  // 나가는 기록 종류는 딱 다섯 가지
  assert.ok(source.includes("const PUBLIC_KINDS = ['growth', 'shed', 'feeding', 'health', 'photo']"),
    "public record kinds are fixed");
  // 분양·메모·가계부·메이팅·산란은 금지 목록에 남아 있어야 합니다
  for (const k of ["ledger", "distribution", "memo", "mating", "laying"]) {
    assert.ok(source.includes(`'${k}'`), `${k} must stay listed in PUBLIC_NEVER`);
  }

  // 공개 페이지가 저장소에 실제로 있어야 합니다
  const page = await readFile(file("g.html"), "utf8");
  assert.ok(page.includes("cg_public"), "g.html must read cg_public");
  assert.ok(page.includes("sb_publishable_"), "g.html uses the publishable key");
  assert.doesNotMatch(page, /service_role|sb_secret_/, "g.html must never carry a secret key");
  assert.ok(page.includes("브리딩비서"), "g.html must sign the app");

  // 서버 표를 만드는 SQL 도 함께 올라가야 합니다
  const sql = await readFile(file("supabase_public.sql"), "utf8");
  assert.ok(sql.includes("create table if not exists public.cg_public"), "SQL creates the table");
  assert.ok(sql.includes("enable row level security"), "SQL turns RLS on");
  assert.ok(sql.includes("owner_id = auth.uid()"), "writes are owner-only");

  // 화면 계약
  assert.ok(source.includes('data-testid="public-card"'), "profile needs the public card");
  assert.ok(source.includes('data-testid="public-toggle"'), "public card needs its toggle");
  assert.ok(source.includes("APP_VERSION = '1.2'"), "APP_VERSION must be 1.2");
});

test("keeps the v5.4 away / condition / memory contracts", async () => {
  const raw = await readFile(file("src/app.jsx"), "utf8");
  const source = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  for (const contract of [
    // 곁에 있나 없나는 한 곳에서만 판단합니다
    "const AWAY_STATUS = ['sold', 'gone']",
    "const isHere = (i)",
    "const isAway = (i)",
    "const statusOf = (i)",
    "function whereNow(i)",
    "function awayTag(i)",
    "gone:      { label: '🌈 떠남'",
    "const GONE_ISSUES = ['폐사', '실종·탈출']",
    "function lastDeathDate(id, evs)",
    // 오늘 컨디션
    "const CONDITIONS = [",
    "const CONDITION_RULES = [",
    "function conditionLog(id, evs)",
    "function conditionDip(id, evs)",
    "function setConditionToday(id, level)",
    "{ key: 'condition',    label: '컨디션'",
    // 작년 오늘
    "function onThisDay(individuals, events)",
    "const MEMORY_KINDS = {",
  ]) {
    assert.ok(source.includes(contract), `missing v5.4 contract: ${contract}`);
  }

  // ★ 흩어진 sold 조건이 되살아나면 FAIL — 새 상태가 어딘가에서 새어 나옵니다
  assert.doesNotMatch(source, /\(i\.status \|\| 'own'\) !== 'sold'/,
    "use isHere(), not a scattered sold check");
  assert.doesNotMatch(source, /i\.status !== 'sold' && !i\.external/,
    "the !i.external typo must stay fixed");

  // 떠난 아이도 혈통에서는 빠지지 않습니다 — 혈통은 status 를 보지 않습니다
  const kin = source.slice(source.indexOf("function relationOf(a, b, all)"),
                           source.indexOf("function mateWarning(a, b, all)"));
  assert.doesNotMatch(kin, /status|isHere|isAway/, "kinship must ignore whether the animal is still here");

  // 브리핑 자리 규칙 (v5.2) — 제안이 있으면 작년 오늘은 나오지 않습니다
  const brief = source.slice(source.indexOf("function briefLines()"),
                             source.indexOf("function voiceSample()"));
  assert.ok(brief.indexOf("todayNudge()") < brief.indexOf("onThisDay()"),
    "the nudge comes first; the memory only fills an empty day");
  assert.ok(brief.includes("if (n) { lines.push(n.text); return lines; }"),
    "the nudge must return early so only one line shows");

  // 화면 계약
  for (const id of ["condition-card", "gone-card"]) {
    assert.ok(source.includes(`data-testid="${id}"`), `missing screen contract: ${id}`);
  }
  assert.ok(source.includes("data-testid={`cond-${c.key}`}"), "condition buttons need per-level testids");
  assert.ok(source.includes("APP_VERSION = '1.2'"), "APP_VERSION must be 1.2");
});

test("keeps the v1.0 laying-season contracts", async () => {
  const raw = await readFile(file("src/app.jsx"), "utf8");
  const source = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  for (const contract of [
    "const LAY_LATE_WARN = 14",
    "const LAY_GIVE_UP",
    "const SEASON_SNOOZE",
    "const SEASON_RESULTS = [",
    "const seasonResultOf =",
    "function seasonState(id, evs)",
    "function recordSeasonCheck(id, key, when)",
    "function reopenSeason(id)",
    "{ key: 'season',       label: '산란 시즌'",
    "'에그바인딩'",
  ]) {
    assert.ok(source.includes(contract), `missing v1.0 contract: ${contract}`);
  }

  // 고를 수 있는 답 네 가지 — 시즌을 닫는 건 '끝났어요' 하나뿐입니다
  for (const k of ["'ended'", "'ok'", "'trouble'", "'bad'"]) {
    assert.ok(source.includes(`key: ${k}`), `missing season result ${k}`);
  }
  assert.equal((source.match(/ends: true/g) || []).length, 1, "only one answer may close the season");

  // ★ 계산은 멈추지 않습니다 — 거르는 건 화면(allAlerts)이지 계산(layingForecasts)이 아닙니다
  const fc = source.slice(source.indexOf("function layingForecasts(individuals, events)"),
                          source.indexOf("const KIDS ="));
  assert.doesNotMatch(fc, /if \(.*seasonEnded.*\) return;/, "forecasts must keep computing for closed seasons");
  assert.ok(fc.includes("seasonEnded: ss.ended"), "forecasts must flag, not drop");
  assert.ok(source.includes("layingForecasts().filter(f => !f.seasonEnded && !f.snoozeLeft && !f.quiet)"),
    "alerts are where closed and quiet seasons get hidden");

  // 예정일이 한참 지나도 확인 전에는 사라지면 안 됩니다 (예전 21일 컷 제거)
  assert.doesNotMatch(source, /daysUntil\(eta\) < -21/, "the old 21-day cutoff must stay removed");

  // 다시 산란하면 저절로 시즌이 열립니다
  assert.ok(source.includes("mine.some(e => e.type === 'laying' && after(e))"), "a new laying reopens the season");

  // 화면 계약
  for (const id of ["season-card"]) {
    assert.ok(source.includes(`data-testid="${id}"`), `missing screen contract: ${id}`);
  }
  assert.ok(source.includes("data-testid={`season-${r.key}`}"), "each answer needs its own testid");

  // 정식 출시 — 버전은 1.0
  assert.ok(source.includes("APP_VERSION = '1.2'"), "APP_VERSION must be 1.2");
});

/* ══════════════════════════════════════════
   v1.2 — 저장 칸: 한 곳에서만 적고, 실패는 반드시 말한다
   ══════════════════════════════════════════ */
test("keeps the v1.2 storage contracts", async () => {
  const source = await readFile(file("src/app.jsx"), "utf8");

  // ① 브라우저 칸에 글을 적는 곳은 STORE 하나뿐입니다
  const writes = source.match(/localStorage\.setItem\(/g) || [];
  assert.equal(writes.length, 1, "localStorage.setItem may appear only inside STORE.set");
  const removes = source.match(/localStorage\.removeItem\(/g) || [];
  assert.equal(removes.length, 1, "localStorage.removeItem may appear only inside STORE.drop");
  const store = source.slice(source.indexOf("const STORE = {"), source.indexOf("const withoutPhoto"));
  assert.match(store, /localStorage\.setItem\(key, val\)/, "the one write must live in STORE.set");
  assert.match(store, /catch \(e\) \{ this\.full = true; this\.say\(STORE_MSG\.full\(\)\); return false; \}/,
    "a full store must be reported, never swallowed");

  // ② 저장 실패는 위로 전해집니다 — 못 본 척하면 기록이 조용히 사라집니다
  assert.ok(source.includes("const ok = STORE.set(key, JSON.stringify(out));"), "save must look at the result");
  assert.ok(source.includes("if (!ok) return false;"), "save must report failure");
  assert.ok(source.includes("if (!this.saveEvents([...this.getEvents(), ...added]))"),
    "addEvents must notice a failed save");
  assert.ok(source.includes("STORE.say(STORE_MSG.photoDropped());"),
    "dropping the photo to save the record must be told");

  // ③ 같은 사진을 두 벌 두지 않습니다 — 얼굴은 기록을 가리키기만 합니다
  assert.doesNotMatch(source, /\{ avatar: src \}/, "the avatar must not copy the photo");
  assert.doesNotMatch(source, /avatar: photoView\.src/, "the avatar must not copy the photo");
  assert.doesNotMatch(source, /avatar: ev\.data\.photo/, "the avatar must not copy the photo");
  assert.ok(source.includes("{ avatarRef: ev.id }"), "the first photo is pointed at, not copied");
  assert.ok(source.includes("{ avatarRef: photoView.id, avatar: '' }"), "picking a face points at the record");

  // ④ 얼굴을 찾는 곳은 avatarSrc 하나뿐이고, 옛 사진도 계속 보여야 합니다
  const av = source.slice(source.indexOf("function avatarSrc(gecko, allEvents)"),
                          source.indexOf("/* ══════════════════════════════════════════", source.indexOf("function avatarSrc(gecko, allEvents)")));
  assert.match(av, /gecko\.avatarRef/, "avatarSrc must read the pointer");
  assert.match(av, /if \(gecko\.avatar\) return gecko\.avatar;/, "old copies must keep showing");
  assert.ok(source.includes("avatar: avatarSrc(gecko, evs) || ''"), "the public record must go through avatarSrc");

  // ⑤ 한 번 도는 정리는 짝이 있는 것만 건드립니다
  const dd = source.slice(source.indexOf("function dedupeAvatars()"), source.indexOf("function purgeStoredHatchReminders()"));
  assert.match(dd, /if \(!hit\) return i;/, "an avatar with no matching record must be left alone");
  assert.match(dd, /avatarRef: hit\.id, avatar: ''/, "the copy is replaced by a pointer");

  // ⑥ 문장은 VOICE 한 곳에서만
  const msg = source.slice(source.indexOf("const STORE_MSG = {"), source.indexOf("/* 날짜 수는 숫자로 씁니다"));
  for (const k of ["full:", "photoDropped:", "near:"]) assert.ok(msg.includes(k), `missing STORE_MSG.${k}`);
  assert.equal((msg.match(/say\(/g) || []).length, 3, "each storage message must go through say()");

  // ⑦ 화면 계약
  for (const id of ["storage-card", "store-bar"]) {
    assert.ok(source.includes(`data-testid="${id}"`), `missing screen contract: ${id}`);
  }
  assert.ok(source.includes("const STORE_LIMIT = 5000000;"), "the measured limit must stay explicit");
});

/* ══════════════════════════════════════════
   v1.3 — 사진은 서버로. 나가고 들어오는 곳은 PHOTO 하나뿐
   ══════════════════════════════════════════ */
test("keeps the v1.3 photo contracts", async () => {
  const source = await readFile(file("src/app.jsx"), "utf8");
  const photo = source.slice(source.indexOf("const PHOTO = {"), source.indexOf("function compressImage(file, cb)"));

  // ① 버킷 이름과 올리기·지우기는 PHOTO 안에서만
  assert.equal((source.match(/PHOTO_BUCKET/g) || []).length,
    (photo.match(/PHOTO_BUCKET/g) || []).length + 1,
    "PHOTO_BUCKET may only appear in its own declaration and inside PHOTO");
  assert.match(photo, /\/storage\/v1\/object\/' \+ PHOTO_BUCKET/, "uploads live in PHOTO");
  const outside = source.replace(photo, "");
  assert.doesNotMatch(outside, /storage\/v1\/object/, "no screen may talk to storage directly");

  // ② 사진을 받는 입구는 takePhoto 하나. compressImage 는 takePhoto 만 부릅니다
  const calls = source.match(/compressImage\(/g) || [];
  assert.equal(calls.length, 2, "compressImage: one declaration + one call from takePhoto");
  const take = source.slice(source.indexOf("function takePhoto(file, cb)"));
  assert.match(take.slice(0, 400), /compressImage\(file, \(dataUrl\)/, "takePhoto is the only caller");
  assert.ok(source.includes("takePhoto(f, (src)"), "screens must use takePhoto");
  assert.equal((source.match(/takePhoto\(/g) || []).length, 5, "4 screens + the declaration");

  // ③ 못 올리면 폰에 담는다 — 인터넷이 없다고 기록이 사라지면 안 됩니다
  assert.match(take, /if \(!PHOTO\.ready\(\)\) return cb\(dataUrl\);/, "offline still returns a photo");
  assert.match(take, /PHOTO\.put\(dataUrl\)\.then\(url => cb\(url \|\| dataUrl\)\)/, "a failed upload falls back");
  assert.match(photo, /if \(!url\) break;/, "flush stops at the first failure instead of hammering");

  // ④ 올리기는 동기화보다 먼저 — 아니면 base64 가 기록에 실려 올라갑니다
  const run = source.slice(source.indexOf("async run(reason = 'manual')"));
  const iFlush = run.indexOf("PHOTO.flush(");
  const iPush = run.indexOf("await this.push()");
  assert.ok(iFlush > 0 && iFlush < iPush, "photos must be uploaded before records are pushed");

  // ⑤ 기록이 사라지면 서버 사진도 — 다만 실패가 삭제를 막으면 안 됩니다
  assert.ok(source.includes("if (isPhotoUrl(gp)) { try { PHOTO.remove(gp); } catch (e) {} }"),
    "a removed record takes its server photo with it, quietly");

  // ⑥ 화질은 700px · 0.65 (다중 사용자 용량 때문에 900px 에서 내렸습니다)
  assert.ok(source.includes("const PHOTO_MAX      = 700;"), "PHOTO_MAX must be 700");
  assert.ok(source.includes("const PHOTO_Q        = 0.65;"), "PHOTO_Q must be 0.65");
  assert.doesNotMatch(source, /const max = 500;/, "the old 500px cap must stay removed");

  // ⑦ ★ 옛 사진은 말 없이 옮기지 않습니다
  //   옮기고 나면 사진을 볼 때 인터넷이 필요해집니다. 그건 대표님이 정하실 일입니다.
  assert.ok(source.includes("PHOTO.flush(null, PHOTO_PER_SYNC, PHOTO.era())"),
    "the automatic upload must be limited to photos taken after v1.4");
  const era = source.slice(source.indexOf("  era() {"), source.indexOf("  pending(since)"));
  assert.match(era, /set\.photoEra/, "the cut-off time must be remembered");
  const pend = source.slice(source.indexOf("  pending(since) {"), source.indexOf("  async flush("));
  assert.match(pend, /const inds = since \? \[\] :/, "old faces are never swept up automatically");
  assert.ok(source.includes("const pend = PHOTO.pending().count;"),
    "the button, unlike the sync, offers to move everything");

  // ⑧ 화면 계약
  for (const id of ["photo-move", "storage-photos"]) {
    assert.ok(source.includes(`data-testid="${id}"`), `missing screen contract: ${id}`);
  }
});

/* 서버가 자지 않게 — 무료 프로젝트는 일주일 조용하면 정지됩니다 */
test("keeps the server awake", async () => {
  const wf = await readFile(file(".github/workflows/supabase-keepalive.yml"), "utf8");
  assert.match(wf, /schedule:/, "the ping must be scheduled, not manual only");
  assert.match(wf, /cron: '17 3 \* \* \*'/, "once a day");
  assert.match(wf, /rest\/v1\/cg_public\?select=code&limit=1/, "a light read is enough");
  // 진짜 비밀 키가 들어갔는지만 봅니다 (주석의 "넣지 마세요" 경고문은 통과해야 합니다)
  assert.doesNotMatch(wf, /sb_secret_[A-Za-z0-9]/, "never put the secret key in a workflow");
  assert.doesNotMatch(wf, /eyJ[A-Za-z0-9_-]{20,}/, "never put a service-role JWT in a workflow");
  assert.match(wf, /sb_publishable_/, "the publishable key is the one that belongs here");
  assert.match(wf, /exit 1/, "a paused project must fail loudly, not pass silently");
});

/* ══════════════════════════════════════════
   v1.5 — 화면에서 덜어낸 것들
   지운 것을 다시 들이지 않게, 여기서 "없어야 한다"를 못 박습니다.
   ══════════════════════════════════════════ */
test("keeps the v1.5 decluttering", async () => {
  const raw = await readFile(file("src/app.jsx"), "utf8");
  const source = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  // ① 브리더 이름은 설정 맨 위(비서 카드) 안에 있습니다
  const voice = source.slice(source.indexOf('data-testid="voice-card"'), source.indexOf('data-testid="app-info"'));
  assert.match(voice, /data-testid="breeder-name"/, "the breeder name belongs in the top card");
  assert.equal((source.match(/data-testid="breeder-name"/g) || []).length, 1, "only one place edits it");

  // ② 앱 정보는 버전과 최근 업데이트 날짜만
  const info = source.slice(source.indexOf('data-testid="app-info"'));
  const infoEnd = info.indexOf("</div>\n        </div>");
  const card = info.slice(0, infoEnd);
  assert.match(card, /APP_VERSION/, "the version stays");
  assert.match(card, /APP_PATCHED/, "the patch date stays");
  assert.doesNotMatch(card, /엑셀|동기화|캘린더|산란 간격/, "the feature list must stay out of the app");
  assert.match(source, /const APP_PATCHED = '\d{4}-\d{2}-\d{2}'/, "the patch date must be a real date");

  // ③ 해칭 이름 규칙은 두 가지뿐 ('직접 등록'은 '물어보기'와 같은 일이었습니다)
  assert.ok(source.includes("const BABY_NAMING = ["), "the two modes live in one place");
  assert.equal((source.match(/\['combo'|\['ask'/g) || []).length, 2, "exactly two naming modes");
  assert.doesNotMatch(source, /'off', '자동 등록 안 함/, "the third mode must stay removed");
  assert.doesNotMatch(source, /mode !== 'off'/, "no code may branch on the removed mode");
  assert.match(source, /v === 'ask' \|\| v === 'off' \? 'ask'/, "an old 'off' setting must land on 'ask'");

  // ④ 분양가는 이미 보낸 아이에게만 여쭤봅니다
  assert.ok(source.includes("soldMissingPrice(individuals).forEach"), "the price nudge reads sold animals");
  assert.doesNotMatch(source, /i\.status === 'available' && !String\(i\.salePrice/, "'분양가능' must not be nagged about price");
  const nud = source.slice(source.indexOf("function nudgeCandidates(individuals, events)"), source.indexOf("function todayNudge(individuals, events)"));
  assert.ok(nud.indexOf("soldMissingPrice") > nud.indexOf("inds.forEach"),
    "sold animals are not isHere, so the price check must sit outside that loop");

  // ⑤ 시즌을 닫은 뒤에는 아무것도 띄우지 않습니다
  assert.ok(source.includes("if (ss.ended) return null;"), "a closed season shows nothing on the profile");
  assert.doesNotMatch(source, /이번 산란 시즌은 끝난 걸로 해뒀어요/, "the long closed-season card must stay removed");
  assert.doesNotMatch(source, /다시 열기/, "no manual reopen button — a new laying reopens it");
  assert.ok(source.includes("mine.some(e => e.type === 'laying' && after(e))"), "a new laying still reopens the season");

  // ⑥ 무지개다리는 이상 기록 안에서만
  assert.doesNotMatch(source, /data-testid="gone-open"/, "the standalone rainbow button must stay removed");
  assert.doesNotMatch(source, /🌈 곁을 떠났어요/, "and its label with it");
  assert.ok(source.includes("const isGoneIssue = (issue)"), "one place decides which issue means gone");
  const add = source.slice(source.indexOf("  addEvents(events) {"), source.indexOf("  addEvent(ev) {"));
  assert.match(add, /if \(!isGoneIssue\(ev\.data\.issue\)\) return;/,
    "recording 폐사·실종 must tidy the list, whether typed or tapped");
  assert.match(add, /status: 'gone', keep: false/, "and it sets the status in that one place");
});

/* ══════════════════════════════════════════
   v1.6 — 밥 주는 요일 · 재촉하지 않기
   ══════════════════════════════════════════ */
test("keeps the v1.6 contracts", async () => {
  const raw = await readFile(file("src/app.jsx"), "utf8");
  const source = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  // ① 밥 주는 날은 간격이든 요일이든 nextDay 하나로 모입니다
  assert.ok(source.includes("const feedMode = (s)"), "one place decides the mode");
  assert.ok(source.includes("const feedDays = (s)"), "one place reads the chosen weekdays");
  assert.ok(source.includes("function nextFeedDay(days, fromISO)"), "one place finds the next weekday");
  assert.ok(source.includes("function feedSchedule(untilISO, plan)"), "the calendar must not walk dates itself");
  const cal = source.slice(source.indexOf("const fp = feedPlan(individuals, calendarEvents);"), source.indexOf("const cRows = clutchRows(individuals, calendarEvents);"));
  assert.match(cal, /feedSchedule\(last, fp\)/, "the calendar asks feedSchedule");
  assert.doesNotMatch(cal, /fp\.interval \* 86400000/, "no hand-rolled interval maths in the calendar");
  assert.match(source, /const planLabel = byDays \?/, "one label covers both modes");
  for (const id of ["feed-mode-days", "feed-days"]) {
    assert.ok(source.includes(`data-testid="${id}"`), `missing screen contract: ${id}`);
  }
  assert.doesNotMatch(source, /마지막으로 준 날 \+ 이 간격이 되면/, "the long explanation must stay removed");

  // ② 호칭은 네 가지, 늘 무언가로 부릅니다
  assert.equal((source.match(/\['breeder'|\['boss'|\['sajang'|\['custom'|\['nim'|\['none'/g) || []).length, 4,
    "exactly four call options");
  assert.doesNotMatch(source, /\['nim', '님'\]|\['none', '안 부름'\]/, "'님' and '안 부름' must stay removed");
  assert.doesNotMatch(source, /if \(v\.call === 'none'\) return '';/, "there is no silent mode any more");
  assert.match(source, /return callLabel\(v\.call\) \|\| callLabel\(CALL_DEFAULT\);/,
    "an old setting must fall back to a real name");

  // ③ 메이팅은 다 큰 암컷에게만 여쭤봅니다
  assert.ok(source.includes("const MATE_AGE = 400;"), "the age lives in one place");
  assert.match(source, /if \(i\.gender === 'female' && hasMale && age !== null && age >= MATE_AGE/,
    "only females, and only when a male exists");
  assert.doesNotMatch(source, /const other = i\.gender === 'male' \? hasFemale/, "males must not be nagged");
  assert.doesNotMatch(source, /age >= 300 && countOf\(i\.id, 'mating'\)/, "the old 300-day rule must stay removed");

  // ④ 산란 예정일 — 5일까지만, 6~13일은 조용히, 14일에 확인
  assert.ok(source.includes("const LAY_GRACE     = 5;"), "the grace window is explicit");
  assert.ok(source.includes("quiet: late > LAY_GRACE && late < LAY_LATE_WARN"), "the quiet window is computed, not guessed");
  const fc = source.slice(source.indexOf("function layingForecasts(individuals, events)"), source.indexOf("const KIDS ="));
  assert.doesNotMatch(fc, /if \(.*quiet.*\) return;/, "forecasts must keep computing through the quiet window");
  assert.ok(source.includes("!f.seasonEnded && !f.snoozeLeft && !f.quiet"), "hiding happens only in allAlerts");
});

/* ══════════════════════════════════════════
   화면 정리 — 설정 가는 길 · 기록 공유 · 혈통 성별 · 활동 기록 두 칸 · 부화 문장
   (2026-09-10 배포. 이때 화면 버전 이름을 1.7 → 1.0 으로 되돌렸으므로
    이 묶음은 버전 숫자가 아니라 내용으로 부릅니다)
   ══════════════════════════════════════════ */
test("keeps the screen-tidying contracts", async () => {
  const raw = await readFile(file("src/app.jsx"), "utf8");
  const source = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  // ① 설정 톱니는 한 곳에서만 만들고, 대화를 뺀 네 화면이 같이 씁니다
  assert.ok(source.includes("function GearBtn({ navigate })"), "one place makes the settings button");
  assert.ok(source.includes('data-testid="gear-btn"'), "missing screen contract: gear-btn");
  assert.equal((source.match(/<GearBtn navigate=\{navigate\} \/>/g) || []).length, 4,
    "홈·캘린더·브리핑·가계부 네 화면에 정확히 하나씩");
  assert.equal((source.match(/aria-label="설정"/g) || []).length, 1,
    "톱니를 손으로 다시 그린 곳이 있으면 안 됩니다");
  const chat = source.slice(source.indexOf("function SmartChatScreen("), source.indexOf("function ProfileScreen("));
  assert.doesNotMatch(chat, /<GearBtn/, "대화 화면에는 설정이 올라가지 않습니다");

  // ② 기록 공개 → 기록 공유
  assert.ok(source.includes("🔗 기록 공유"), "카드 제목은 '기록 공유'");
  assert.ok(source.includes("이 아이를 어떻게 키웠는지 공유할 수 있어요."), "설명도 공유로");
  assert.ok(source.includes("'공유 끄기' : '공유하기'"), "버튼도 공유로");
  assert.doesNotMatch(source, /🔗 기록 공개|'공개 끄기' : '공개하기'/, "'공개'라는 말은 화면에서 빠졌습니다");

  // ③ 혈통 칩에는 성별을 보이지 않습니다
  const ped = source.slice(source.indexOf("function PedigreeCard({ gecko, navigate })"), source.indexOf("function awayTag(i)"));
  assert.doesNotMatch(ped, /genderEmoji/, "혈통 칩은 성별을 그리지 않습니다");

  // ④ 활동 기록은 피딩 / 활동 두 칸, 나누는 기준은 한 곳
  assert.ok(source.includes("const LOG_TABS = ["), "나누는 기준은 LOG_TABS 한 곳");
  assert.match(source, /\['feed', '🍽️ 피딩', \(e\) => e\.type === 'feeding'\]/, "피딩 칸은 밥 기록만");
  assert.match(source, /\['etc',  '📋 활동', \(e\) => e\.type !== 'feeding'\]/, "나머지는 전부 활동 칸으로");
  for (const id of ["log-tab-", "gear-btn"]) {
    assert.ok(source.includes(`data-testid=`) && raw.includes(id), `missing screen contract: ${id}`);
  }
  assert.ok(source.includes("const [logOpen, setLogOpen] = useState('')"), "열려 있는 칸은 한 곳에서 기억합니다");
  assert.ok(source.includes("const sortedEvents = useMemo("), "정렬은 한 번만 하고 두 칸이 나눠 씁니다");

  // ⑤ 부화 예정 문장은 산란과 헷갈리지 않습니다
  assert.ok(source.includes("차 알에서 아기가 태어날 것 같아요 🐣"), "부화는 '태어난다'로 말합니다");
  assert.doesNotMatch(source, /차 알이 나올 것 같아요/, "'알이 나온다'는 산란처럼 들려 빠졌습니다");
});

/* ══════════════════════════════════════════
   v1.1 — 출시 전 다듬기 (한글 줄바꿈 · 안전영역 · 도트 그림 · 미구분 · 누르는 자리)
   ══════════════════════════════════════════ */
test("keeps the v1.1 polish contracts", async () => {
  const raw = await readFile(file("src/app.jsx"), "utf8");
  const source = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const html = await readFile(file("index.html"), "utf8");

  // ① 한글이 낱말 안에서 끊기지 않습니다
  assert.match(html, /word-break: keep-all/, "한글 줄바꿈 규칙이 빠졌습니다");
  assert.match(html, /overflow-wrap: break-word/, "아주 긴 낱말은 그래도 끊어줘야 합니다");

  // ② 아이폰 안전영역이 실제로 동작합니다 (viewport-fit 없으면 env() 가 0 입니다)
  assert.match(html, /viewport-fit=cover/, "viewport-fit=cover 가 있어야 안전영역 값이 들어옵니다");
  assert.match(html, /--safe-top: env\(safe-area-inset-top/, "위쪽 안전영역");
  assert.match(html, /--safe-bottom: env\(safe-area-inset-bottom/, "아래쪽 안전영역");
  assert.match(html, /\.header \{ background: var\(--bg2\); padding: calc\(12px \+ var\(--safe-top\)\)/, "헤더가 상태바를 피해야 합니다");

  // ③ 도트 그림은 한 곳에서만 만듭니다
  assert.ok(source.includes("function pixelSvg(rows, pal)"), "도트 그림 만드는 곳은 한 군데");
  assert.ok(source.includes("const DOT_GECKO_URI"), "도마뱀 그림");
  assert.ok(source.includes("const DOT_EGG_URI"), "알 그림");

  // ④ 성별을 모르면 물음표가 아니라 "미구분"
  assert.match(source, /GENDER_MARK = \{ female: '♀', male: '♂', unknown: '미구분' \}/, "물음표는 빠졌습니다");
  assert.doesNotMatch(source, /genderMark = g => GENDER_MARK\[g\] \|\| '\?'/, "기본값도 물음표가 아닙니다");

  // ⑤ 좁은 화면에서 밥 정보가 잘리지 않습니다
  assert.ok(source.includes("const fmtDateShort ="), "카드용 짧은 날짜");
  assert.match(source, /flexShrink:0, color: feedDays >= 3/, "밥 정보는 줄어들지 않습니다");

  // ⑥ 손끝으로 누르는 자리
  assert.match(html, /\.taprow > button \{ min-height: 34px/, "글자만 있는 버튼도 누를 높이가 있어야 합니다");
  assert.match(html, /\.chip-btn \{ padding: 8px 13px; min-height: 36px;/, "칩도 마찬가지");

  // ⑦ 설정에도 뒤로가기
  const st = source.slice(source.indexOf("function SettingsScreen("));
  assert.match(st, /‹ 뒤로/, "설정에서 돌아갈 길이 있어야 합니다");

  // ⑧ 예정 카드가 "언제"를 두 번 말하지 않습니다
  assert.doesNotMatch(source, /\$\{whenWord\(r\.date\)\} \$\{r\.nth\}차/, "아랫줄이 이미 말합니다");

  // ⑨ 말풍선 문장에 들여쓰기 공백이 남아 있으면 안 됩니다 (pre-line 이라 그대로 보입니다)
  assert.doesNotMatch(source, /\\n  한쪽만|\\n  아직 브리더들|\\n     붙이시는/, "줄바꿈 뒤 공백이 화면에 보입니다");
});

/* ══════════════════════════════════════════
   v1.2 — 캘린더 석 달치 · 말로 부화 기록 · 이름 두 번 찍히던 것
   ══════════════════════════════════════════ */
test("keeps the v1.2 contracts", async () => {
  const raw = await readFile(file("src/app.jsx"), "utf8");
  const source = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  // ① 캘린더가 앞으로 보여주는 범위는 한 곳에서만 정합니다 (대표님 확정: 석 달)
  assert.ok(source.includes("const CALENDAR_AHEAD_DAYS = 92;"), "범위는 한 곳에서만");
  assert.match(source, /new Date\(todayStr\(\)\)\.getTime\(\) \+ CALENDAR_AHEAD_DAYS \* 86400000/,
    "기준은 오늘 — 급여일이 멀면 범위가 밀리면 안 됩니다");
  assert.doesNotMatch(source, /fp\.nextDay\)\.getTime\(\) \+ 31 \* 86400000/, "옛 한 달치 계산은 빠졌습니다");
  assert.match(source, /guard\+\+ < 200/, "매일 주셔도 석 달이면 92번이라 넉넉해야 합니다");

  // ② 대상을 안 말씀하셔도 부화를 적을 수 있습니다
  //    (예전엔 "누구인가요?" 하고 물어서 다음에 말한 이름을 새 개체로 등록했습니다)
  assert.match(source, /const hatchOnly = facts\.find\(f => f\.type === 'hatching'\);/,
    "대상 없이 부화만 말씀하신 경우를 따로 봅니다");
  assert.match(source, /clutchRows\(\)\.filter\(r => r\.waiting\)/, "지금 품고 있는 알만 보여드립니다");
  assert.ok(source.includes("지금 품고 있는 알이 없어요"), "알이 없으면 그렇게 말씀드립니다");
  // 고른 뒤 길은 대상이 있을 때와 같아야 합니다 (사본을 만들지 않습니다)
  assert.equal((source.match(/kind: 'hatch-clutch'/g) || []).length, 2, "부화 클러치 고르기는 두 자리에서만");

  // ③ 애기·베이비 같은 말이 새 개체 이름으로 잡히면 안 됩니다
  for (const w of ["애기", "아기", "베이비", "새끼", "해츨링"]) {
    assert.ok(new RegExp(`\\|${w}\\||\\|${w}\\)`).test(source) || source.includes(`|${w}|`) || source.includes(`|${w})`),
      `KEYWORD_START 에 ${w} 가 있어야 합니다`);
  }

  // ④ 이름이 두 번 찍히던 것 — josa() 가 이미 이름을 붙여서 돌려줍니다
  assert.doesNotMatch(source, /"\$\{newSubject\}"\$\{eunneun\(newSubject\)\}/, '이름이 두 번 나옵니다');
  assert.doesNotMatch(source, /"\$\{rt\.name\}"\$\{eunneun\(rt\.name\)\}/, '이름이 두 번 나옵니다');
});
