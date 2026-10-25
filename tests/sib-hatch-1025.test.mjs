/* v1.9.36 "빛산5호 태어났어" (대표님 2026-10-25)
   빛산1~4호가 있는데 처음 보는 "빛산5호"가 태어났다고 하면, 새 등록을 묻지 않고
   형제들 엄마(크산이)의 해칭 1마리(이름 빛산5호)로 담습니다. 아빠는 평소 해칭처럼 그 알의 짝으로 이어집니다. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = (await readFile(new URL("../src/app.jsx", import.meta.url), "utf8")).replace(/\r\n/g, "\n");
const grab = (start, end) => app.slice(app.indexOf(start), app.indexOf(end, app.indexOf(start)));
const lib = grab("const NAME_NO_RE", "function nameFixPlan(");
const sibParentOf = new Function(lib + "\nreturn sibParentOf;")();

const L = [
  { id: "m", name: "크산이" }, { id: "d", name: "크빛이" },
  { id: "1", name: "빛산1호", damId: "m", sireId: "d" }, { id: "2", name: "빛산2호", damId: "m", sireId: "d" },
  { id: "3", name: "빛산3호", damId: "m", sireId: "d" }, { id: "4", name: "빛산4호", damId: "m", sireId: "d" },
  { id: "5", name: "마동 1호", damId: "x" }, { id: "6", name: "마동 2호", damId: "x" }, { id: "x", name: "엄마" },
];

test("finds the siblings' mother and keeps the siblings' spacing", () => {
  assert.deepEqual(sibParentOf("빛산5호 태어났어", L), { mom: L[0], dad: L[1], name: "빛산5호" });
  assert.deepEqual(sibParentOf("어제 빛산 6호 태어났어", L), { mom: L[0], dad: L[1], name: "빛산6호" });
  assert.equal(sibParentOf("마동3호 태어났어", L).name, "마동 3호", "형제들이 띄어 쓰면 띄어서");
  assert.equal(sibParentOf("빛산4호 태어났어", L), null, "이미 있는 이름은 건드리지 않음");
  assert.equal(sibParentOf("크뽀야 태어났어", L), null, "형제 없는 이름은 평소처럼 새 등록을 묻습니다");
  assert.equal(sibParentOf("솔산1호 태어났어", L), null);
});

test("chat turns it into the mother's 1-baby hatching and does not touch the mother's birthday", () => {
  const blk = grab("const sibHatch = ", "// 4) 새 개체 등록 플로우");
  assert.match(blk, /!names\.length && facts\.find\(f => f\.type === 'hatching'\)/);
  assert.match(blk, /count: '1', babyNames: \[sib\.name\], sireId: sib\.dad && sib\.dad\.id/);
  assert.match(blk, /\(엄마\)\$\{sib\.dad \? ' × ' \+ sib\.dad\.name \+ '\(아빠\)' : ''\}/, "엄마·아빠를 둘 다 말합니다");
  assert.match(app, /const dadId = f\.data\.sireId \|\| \(lay && lay\.data\.sireId\)/, "저장 때 형제들 아빠");
  assert.match(blk, /target = sib\.mom; setTarget\(sib\.mom\); newSubject = null;/);
  assert.match(app, /if \(!sib\) \{   \/\/ v1\.9\.36[^\n]*\n\s*const cur = DB\.getIndividuals\(\)\.find\(i => i\.id === target\.id\) \|\| target;\n\s*const plan = planProfileFix/);
  assert.match(app, /if \(hf && babyNamingMode\(\) === 'ask' && !hf\.data\.babyNames\)/, "이름을 이미 알면 다시 묻지 않음");
});

/* v1.9.37 "크산이 새끼 2마리 나왔어"도 부화(예전엔 메모) */
test("hatching words allow a count between 새끼 and 나왔", () => {
  const re = new Function(app.slice(app.indexOf("const RE_HATCH"), app.indexOf("\n", app.indexOf("const RE_HATCH"))) + "\nreturn RE_HATCH;")();
  for (const t of ["크빛이 새끼 2마리 나왔어", "새끼 두 마리 나왔어", "애기 1마리 나옴", "알에서 새끼 나왔어"]) assert.ok(re.test(t), t);
  assert.ok(!re.test("크빛이 새끼 몇 마리야"), "질문은 부화가 아님");
});

/* v1.9.37 아빠 이름으로 말한 부화 — "크산이 새끼 2마리 나왔어"(크산이 수컷) */
test("a hatching said with the father's name goes to the mother carrying his eggs", () => {
  const blk = grab("const dadHatch = ", "// 4) 새 개체 등록 플로우");
  assert.match(blk, /target\.gender === 'male' && facts\.find\(f => f\.type === 'hatching'\)/);
  assert.match(blk, /sireId: target\.id/, "아빠는 말한 그 수컷");
  assert.match(blk, /clutchRows\(\)\.filter\(r => r\.waiting && r\.dadId === target\.id\)/, "그 수컷의 알을 품은 엄마만");
  assert.match(blk, /kind: 'hatch-clutch'/, "엄마가 여럿이면 고르게");
  assert.match(blk, /수컷이라 알을 품은 엄마가 필요해요/, "알이 없으면 수컷을 엄마로 저장하지 않음");
  assert.match(blk, /target = mom; setTarget\(mom\);/);
});
