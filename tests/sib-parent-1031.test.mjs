/* v1.9.40 혈통 말하기 (대표님 2026-10-31 제보)
   "근데 얘 아빠가 마인이야" → 예전엔 "마인"(이야를 잘라냄)이 미등록이라 하고 대상도 마인이로 바뀌었습니다.
   "마동이들이랑 아빠가 같아" → "같아"를 이름으로 읽었습니다.
   이제: 등록된 이름 + 끝말로 읽고, 부모 이름만 있으면 방금 그 아이("얘")에게, 형제 무리(마동1호~10호)의 부모를 그대로 잇습니다.
   아빠만 같아도(반동배) 교배 불가 — 근친 판정 danger. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const ex = (await readFile(new URL("../src/extras.jsx", import.meta.url), "utf8")).replace(/\r\n/g, "\n");
const app = (await readFile(new URL("../src/app.jsx", import.meta.url), "utf8")).replace(/\r\n/g, "\n");

const nf = app.slice(app.indexOf("function nameFromWord("), app.indexOf("function findNamesInText("));
const nameFromWord = new Function(nf + "\nreturn nameFromWord;")();
const part = ex.slice(ex.indexOf("const SIB_PAR_RE ="), ex.indexOf("const SIB = { last: null };"));
const X = new Function(part + "\nreturn { SIB_PAR_RE, SIB_MORE_RE, sibGroupOf, sibParentsPlan, sibParentKeys };")();

const L = [
  { id: "mi", name: "마인이", gender: "male" }, { id: "kd", name: "크동이", gender: "female" }, { id: "ma", name: "마인" },
  ...[1, 2, 3, 4, 5, 6].map(n => ({ id: "md" + n, name: n === 5 ? "마동 5호" : `마동${n}호`, sireId: "mi", damId: "kd" })),
  { id: "kh", name: "크한이" }, { id: "ky", name: "크얌이" },
];

test("parent word: registered name + ending, longest wins", () => {
  assert.equal(nameFromWord("마인이야", L).id, "mi", "마인이 + 야 (예전: 마인)");
  assert.equal(nameFromWord("마인이에요", L).id, "mi");
  assert.equal(nameFromWord("크동이고", L).id, "kd");
  assert.equal(nameFromWord("마인", L).id, "ma", "딱 맞는 이름");
  assert.equal(nameFromWord("크뿡이야", L), null, "없는 이름은 null → 미등록 안내");
  assert.equal(nameFromWord("누구야", L), null);
});

test("sibling phrases and groups", () => {
  const m = "마동이들이랑 아빠가같아".match(X.SIB_PAR_RE);
  assert.ok(m); assert.equal(m[1], "마동"); assert.equal(m[2], "아빠");
  assert.equal(X.sibGroupOf("마동", L).length, 6, "마동1호~6호(띄어 쓴 '마동 5호' 포함)");
  assert.deepEqual(X.sibGroupOf("크한", L).map(g => g.id), ["kh"], "크한이랑 → 크한이 한 마리");
  assert.ok("크얌이는 크한이랑 엄마가 같아".match(X.SIB_PAR_RE));
  assert.ok("마동이들이랑 부모가 똑같아".match(X.SIB_PAR_RE));
  assert.ok(X.SIB_MORE_RE.test("엄마도 같아"));
  assert.deepEqual(X.sibParentKeys("부모"), ["sireId", "damId"]);
  assert.equal("크얌이 아빠가 마인이야".match(X.SIB_PAR_RE), null);
});

test("plan takes the parent the group shares", () => {
  const grp = L.filter(i => /^md/.test(i.id));
  const p = X.sibParentsPlan(L.find(i => i.id === "ky"), grp, ["sireId"], L);
  assert.deepEqual(p.patch, { sireId: "mi" });
  assert.match(p.L[0], /아빠 마인이 🧬 연결 완료/);
  const q = X.sibParentsPlan(L.find(i => i.id === "ky"), [L.find(i => i.id === "kh")], ["damId"], L);
  assert.deepEqual(q.miss, ["엄마"], "형제도 비어 있으면 묻기");
});

test("app wiring: 얘 = 방금 그 아이, half-siblings are danger", () => {
  assert.match(app, /const prevTarget = geckoRef\.current;/);
  assert.match(app, /else if \(prevTarget && !parentNames\.includes\(prevTarget\.name\)\)/);
  assert.match(app, /X\.sibParents\(text, \{ names, prev: prevTarget, bot, setTarget, refreshIndividuals \}\)/);
  assert.match(app, /kind: 'half', level: 'danger'/, "아빠만 같아도 교배 불가");
  assert.match(ex, /const ids = new Set\(grp\.map\(g => g\.id\)\.concat\(\.\.\.grp\.map\(g => \[g\.sireId, g\.damId\]\)\)\);/, "무리와 그 부모(마인이)는 대상이 아님");
  assert.match(app, /<Extra part="PushCard" showToast=\{showToast\} \/>/);
  assert.match(ex, /function PushCard\(\{ showToast \}\)/);
});
