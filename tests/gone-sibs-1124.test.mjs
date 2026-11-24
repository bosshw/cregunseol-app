/* v1.9.69 떠난 형제는 혈통 칩에서 뺀다 (대표님 2026-11-24 "떠난 아이가 여기 왜 있지? 어차피 교배 못 하는데")
   근친 판정(kinship)은 떠난 아이를 통해서도 그대로 이어져야 합니다. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/app.jsx", import.meta.url), "utf8");

test("혈통 카드 — 동배·반동배 칩에서 떠난(gone) 아이는 빼고 센다", () => {
  const card = app.slice(app.indexOf("function PedigreeCard("), app.indexOf("function awayTag("));
  assert.match(card, /const alive = \(x\) => statusOf\(x\) !== 'gone';/);
  assert.match(card, /littermatesOf\(gecko, all\)\.filter\(alive\)/);
  assert.match(card, /h\.list\.filter\(alive\)[\s\S]*\.filter\(h => h\.list\.length\)/, "다 떠난 반동배 묶음은 줄째 숨김");
  assert.match(card, /동배 \(같은 클러치\) \{mates\.length\}마리/, "개수도 남은 아이만");
  assert.match(card, /부 \{sire\.name\}\{awayTag\(sire\)\}/, "부모·자식은 떠났어도 그대로 보임");
});

test("대화 혈통 답 — 동배에서 떠난 아이 빼기 · 근친 판정 함수는 그대로", () => {
  assert.match(app, /littermatesOf\(target, all\)\.filter\(x => statusOf\(x\) !== 'gone'\)/);
  const lit = app.slice(app.indexOf("function littermatesOf("), app.indexOf("function littermatesOf(") + 600);
  assert.doesNotMatch(lit, /gone/, "판정용 원본 목록은 떠난 아이 포함");
});
