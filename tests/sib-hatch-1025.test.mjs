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
  assert.deepEqual(sibParentOf("빛산5호 태어났어", L), { mom: L[0], name: "빛산5호" });
  assert.deepEqual(sibParentOf("어제 빛산 6호 태어났어", L), { mom: L[0], name: "빛산6호" });
  assert.equal(sibParentOf("마동3호 태어났어", L).name, "마동 3호", "형제들이 띄어 쓰면 띄어서");
  assert.equal(sibParentOf("빛산4호 태어났어", L), null, "이미 있는 이름은 건드리지 않음");
  assert.equal(sibParentOf("크뽀야 태어났어", L), null, "형제 없는 이름은 평소처럼 새 등록을 묻습니다");
  assert.equal(sibParentOf("솔산1호 태어났어", L), null);
});

test("chat turns it into the mother's 1-baby hatching and does not touch the mother's birthday", () => {
  const blk = grab("const sibHatch = ", "// 4) 새 개체 등록 플로우");
  assert.match(blk, /!names\.length && facts\.find\(f => f\.type === 'hatching'\)/);
  assert.match(blk, /count: '1', babyNames: \[sib\.name\]/);
  assert.match(blk, /target = sib\.mom; setTarget\(sib\.mom\); newSubject = null;/);
  assert.match(app, /if \(!sib\) \{   \/\/ v1\.9\.36[^\n]*\n\s*const cur = DB\.getIndividuals\(\)\.find\(i => i\.id === target\.id\) \|\| target;\n\s*const plan = planProfileFix/);
  assert.match(app, /if \(hf && babyNamingMode\(\) === 'ask' && !hf\.data\.babyNames\)/, "이름을 이미 알면 다시 묻지 않음");
});
