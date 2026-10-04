/* v1.9.19 — 대표님 요청(2026-10-04): 대화로 "알 낳았어"라고 하면 몇 개인지, "태어났어"라고 하면 몇 마리인지 묻기.
   칩으로 골라도, "두 개요"·"2마리"처럼 글로 답해도 담겨야 합니다. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const src = await readFile(new URL("../src/app.jsx", import.meta.url), "utf8");

test("산란에 알 개수가 없으면 저장 전에 몇 개인지 묻는다", () => {
  assert.match(src, /const askLayCount = \(fact, rest, target, head\)/);
  assert.match(src, /몇 개 낳았나요\?/);
  assert.match(src, /layFact && !\(parseInt\(layFact\.data && layFact\.data\.eggCount, 10\) > 0\)/);
  assert.match(src, /label: '아직 몰라요', kind: 'lay-count'/);
});

test("칩 대신 글로 답한 개수·마릿수도 받는다 (두 번 담지 않음)", () => {
  assert.match(src, /const layAskRef = useRef\(null\)/);
  assert.match(src, /const hatchAskRef = useRef\(null\)/);
  assert.match(src, /\(한\|하나\|두\|둘\|세\|셋\|네\|넷\)\\s\*\(개\|알\)/);
  assert.match(src, /\(한\|하나\|두\|둘\|세\|셋\|네\|넷\)\\s\*\(마리\|명\|개\)/);
  assert.match(src, /if \(layAskRef\.current !== value\.fact\)/);
  assert.match(src, /hatchAskRef\.current\.fact !== value\.fact/);
});

test("다른 말로 넘어가도 산란 기록은 개수 없이 남는다", () => {
  const i = src.indexOf("if (layAskRef.current) {");
  const body = src.slice(i, i + 1200);
  assert.ok(i > 0);
  assert.equal((body.match(/pushPending\(\[f\], \{ name: f\.targetName \}\)/g) || []).length, 2);
});
