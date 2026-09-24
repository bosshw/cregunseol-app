/* v1.8 엑셀·표 가져오기 — 엔진이 여러 모양의 표를 제대로 읽는지 지킵니다.
   엑셀 파일 대신 "격자"를 바로 넣습니다(엑셀 → 격자는 SheetJS 가 합니다). */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import "../src/import-engine.js";

const ENG = globalThis.CREG_IMPORT_ENGINE;
const root = new URL("../", import.meta.url);
const TODAY = "2026-09-24";
const cell = (v) => (v === "" || v == null ? null : typeof v === "number" ? { t: String(v), n: v } : v instanceof Date ? { t: "", d: v.toISOString().slice(0, 10) } : { t: String(v) });
const grid = (sheet, rows) => ({ sheet, rows: rows.map((r) => r.map(cell)), hidden: [] });
const read = (grids, ctx = {}) => ENG.analyze(grids, { individuals: [], events: [], today: TODAY, ...ctx });
const byName = (plan, n) => plan.newInds.find((i) => i.name === n);

test("reads the owner's original sheet shape (title rows, B column start, 만원 numbers, N차 cells)", () => {
  const plan = read([
    grid("애기들 리스트", [
      ["", "크레건설 축양리스트"], [], [],
      ["", "넘버", "이름", "생년원일", "성별", "모프", "모프 특징사항", "점여부", "입양처", "부/모", "입양가", "특이사항", "", "", "분양가 합", 1573, "만원"],
      ["", 1, "크범이", "", "암", "노말 핀타입", "", "", "스타필드옆 매장", "", 30, ""],
      ["", 2, "크산이", "25.05.xx", "숫", "50헷초초", "", "", "리키마루", "YYC혈", 30, ""],
      ["", 3, "크전이", "25.09.09", "암", "100헷초초", "", "", "다이노송파", "선주비원더혈", 0, "여부가 선물준아이"],
    ]),
    grid("메이팅기록", [
      [], [], [],
      ["", "넘버", "메이팅 날짜", "수컷", "암컷", "1차 산란확인일", "2차 산란확인일", "3차 산란확인일"],
      ["", 1, "25.12.01", "크산이", "크범이", "26.01.09", "26.02.02(조산)", "26.05.25(무정2)"],
    ]),
  ]);
  assert.equal(plan.newInds.length, 3);
  assert.equal(byName(plan, "크범이").gender, "female");
  assert.equal(byName(plan, "크전이").hatchDate, "2025-09-09");
  const memo = (n) => plan.events.filter((e) => e.type === "memo" && e.individualId === byName(plan, n).id).map((e) => e.data.notes).join(" | ");
  assert.match(memo("크범이"), /입양처: 스타필드옆 매장 · 입양가 30만원/);      // 가계부가 읽는 글 모양
  assert.match(memo("크산이"), /출생 25\.05\.xx \(일자 미상\)/);
  assert.match(memo("크산이"), /혈통: YYC혈/);
  assert.match(memo("크전이"), /입양가 0 \(무상\/선물\)/);
  const lay = plan.events.filter((e) => e.type === "laying").map((e) => [e.date, e.data.eggCount, e.data.notes || ""]);
  assert.deepEqual(lay, [["2026-01-09", "", ""], ["2026-02-02", "", "조산"], ["2026-05-25", "2", "무정"]]);
  assert.equal(plan.events.filter((e) => e.type === "mating").length, 1);
  assert.ok(!plan.blocks.some((b) => b.fields.some((f) => f.header === "분양가 합")), "제목줄 옆 합계 칸은 표가 아닙니다");
  assert.equal(Math.round(plan.stats.cover * 100), 100);
});

test("understands varied headers, genders and money", () => {
  const plan = read([grid("Sheet1", [
    ["Name", "Sex", "Morph", "Hatch Date", "Price", "Status"],
    ["루비", "0.1", "Red Harlequin", "2024/03/15", "", "Keep"],
    ["썬더", "1.0", "Tricolor", "2023/09/01", "", ""],
    ["베이비", "0.0.1", "Flame", "2025-07-22", "15만", "Available"],
    ["팔린애", "암(추정)", "Pin", "", "20만원", "Sold"],
  ])]);
  assert.equal(byName(plan, "루비").gender, "female");
  assert.equal(byName(plan, "루비").keep, true);
  assert.equal(byName(plan, "썬더").gender, "male");
  assert.equal(byName(plan, "베이비").status, "available");
  assert.equal(byName(plan, "베이비").salePrice, "150000");
  assert.equal(byName(plan, "팔린애").status, "sold");
  assert.equal(plan.events.find((e) => e.type === "distribution").data.price, "200000");
});

test("does not invent a birth year for a yearless birthday", () => {
  const plan = read([grid("보유개체", [["이름", "모프", "생일"], ["♀ 암컷"], ["별이", "릴리", "3/15"], ["합계"]])]);
  const s = byName(plan, "별이");
  assert.equal(s.gender, "female", "구역 제목(♀ 암컷)이 성별이 됩니다");
  assert.equal(s.hatchDate, "");
  assert.match(plan.events.find((e) => e.type === "memo").data.notes, /생일 3\/15 \(연도 모름\)/);
  assert.equal(plan.newInds.length, 1, "합계 줄은 개체가 아닙니다");
});

test("reads laying sheets with merged mothers and hatch dates across the new year", () => {
  const plan = read([grid("2025 산란", [
    ["어미", "페어", "산란일", "알", "부화일", "부화수"],
    ["달이", "해님x달이", "11/20", "2(1무정)", "2/10", 1],
    ["", "", "12/19", 1, "", ""],
  ])]);
  const lays = plan.events.filter((e) => e.type === "laying");
  assert.deepEqual(lays.map((e) => e.date), ["2025-11-20", "2025-12-19"]);
  assert.equal(lays[0].data.sireName, "해님");
  assert.equal(lays[0].data.eggUnits.filter((u) => u.status === "infertile").length, 1);
  const h = plan.events.find((e) => e.type === "hatching");
  assert.equal(h.date, "2026-02-10", "부화일은 산란일 뒤의 해로 읽습니다");
  assert.equal(h.data.layingId, lays[0].id);
});

test("reads weight grids, O/X feeding calendars and ledgers", () => {
  const w = read([grid("체중관리", [["이름", "1/5", "2/5"], ["별이", 30, 32.5]])]);
  assert.deepEqual(w.events.filter((e) => e.type === "growth").map((e) => [e.date, e.data.weight]), [["2026-01-05", "30"], ["2026-02-05", "32.5"]]);
  const f = read([grid("먹이 기록", [["이름", "9/1", "9/3"], ["별이", "O", "X"]])]);
  assert.deepEqual(f.events.map((e) => e.data.ate === false), [false, true]);
  const l = read([grid("가계부", [["날짜", "구분", "내용", "금액"], ["2026.08.02", "지출", "판게아", "3만"], ["", "수입", "베이비 분양", 150000], ["합계", "", "", 180000]])]);
  assert.deepEqual(l.events.map((e) => [e.date, e.data.flow, e.data.category, e.data.amount]),
    [["2026-08-02", "out", "사료·먹이", 30000], ["2026-08-02", "in", "분양", 150000]]);
});

test("merges into existing animals without overwriting, and a second import adds nothing", () => {
  const existing = [{ id: "a1", name: "크한이", gender: "unknown", morph: "초초", status: "own" }];
  const g = [grid("정리", [["이름", "성별", "모프", "무게", "측정일"], ["크한", "수", "릴리", 31.5, "2026-09-20"]])];
  const p1 = read(g, { individuals: existing });
  assert.equal(p1.newInds.length, 0, "'크한'은 '크한이'와 같은 아이입니다");
  assert.deepEqual(p1.patches[0].set, { gender: "male" }, "비어 있던 성별만 채우고 모프는 안 덮습니다");
  const p2 = read(g, { individuals: existing, events: p1.events });
  assert.equal(p2.events.length, 0);
  assert.ok(p2.dupSkipped >= 1);
});

test("keeps the importer out of the first load and friendly to older phones", async () => {
  const [html, worker, app, importer, source] = await Promise.all([
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("sw.js", root), "utf8"),
    readFile(new URL("app.min.js", root), "utf8"),
    readFile(new URL("importer.min.js", root), "utf8"),
    readFile(new URL("src/app.jsx", root), "utf8"),
  ]);
  assert.doesNotMatch(html, /importer\.min\.js/, "가져오기 도구는 누를 때만 불러옵니다");
  assert.match(worker, /'\.\/importer\.min\.js'/);
  assert.match(app, /importer\.min\.js/);
  assert.doesNotMatch(importer, /\(\?<[=!]/, "옛 아이폰(iOS 16.3 이하)이 못 읽는 뒤돌아보기 정규식 금지");
  assert.match(source, /opening: !\(e\.data && e\.data\.dated\)/, "입양일을 아는 입양가는 그 달에 셉니다");
  assert.ok(!/localStorage\.setItem/.test(importer), "저장은 STORE.set 한 곳에서만");
});

test("reads a free-form memo list (one animal per line, dot separated)", () => {
  const text = [
    "1 - 해롱. 릴리. 250721. 여왕x진격. 키큰남자 : 시루",
    "2 - 호롱. 노멀 바브라인. 5-6월생 추정. 트익할",
    "4 - 방울. 노멀. 2503월생. 암추",
    "5 - 다울. 차콜. 250818 부-알파. 섀도우",
    "10 - 소피. 크림시클. 250125. 슈슈x제니. 크레본부. 암",
    "(선주 윌리-심바x만시/부개체-슈슈제니 라인)",
    "25 - 마스. spt. 베누스게코. 숫",
    "",
    "미키. 솔리드트라이. 250830. 땅콩x클로에. 나비",
  ].join("\n");
  const plan = read(ENG.gridsFromText(text, "메모"));
  assert.deepEqual(plan.newInds.map((i) => i.name), ["해롱", "호롱", "방울", "다울", "소피", "마스", "미키"]);
  const n = (x) => byName(plan, x);
  assert.equal(n("해롱").morph, "릴리");
  assert.equal(n("해롱").hatchDate, "2025-07-21");
  assert.equal(n("방울").gender, "female");
  assert.equal(n("다울").hatchDate, "2025-08-18", "점이 빠진 '250818 부-알파'도 가릅니다");
  assert.equal(n("마스").gender, "male");
  assert.equal(n("마스").morph, "spt");
  const memo = (x) => plan.events.filter((e) => e.type === "memo" && e.individualId === n(x).id).map((e) => e.data.notes).join(" | ");
  assert.match(memo("해롱"), /입양처: 키큰남자 : 시루/);
  assert.match(memo("해롱"), /혈통: 여왕x진격/);
  assert.match(memo("호롱"), /출생 5-6월생 추정/);
  assert.match(memo("방울"), /출생 25\.03 \(일자 미상\)/);
  assert.match(memo("소피"), /선주 윌리-심바x만시\/부개체-슈슈제니 라인/, "괄호 줄은 위 아이의 메모로");
  assert.equal(Math.round(plan.stats.cover * 100), 100);
});
