/* v1.9.35 "크빛이 새끼 몇 마리야" (대표님 2026-10-24)
   엄마·아빠 어느 쪽이든 자식 수를 셉니다. 곁에 있는 / 분양 간 / 떠난 아이로 나눠 이름까지.
   예전: 혈통 전체가 나오고(분양·떠난 아이 섞임), "애기 몇 마리야"는 메모로 담겼습니다. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = (await readFile(new URL("../src/app.jsx", import.meta.url), "utf8")).replace(/\r\n/g, "\n");
const q = app.slice(app.indexOf("function answerQuery("), app.indexOf("function answerQuery(") + 4000);

test("offspring count question is answered before the lineage dump", () => {
  const i = q.indexOf("/새끼|자식|애기|아기|베이비|해츨링/.test(text) && /몇|얼마나/.test(text)");
  const lineage = q.indexOf("/혈통|부모|아빠|엄마|아비|어미|자식|새끼|동배|형제|자매|남매/");
  assert.ok(i > 0, "count branch exists");
  assert.ok(i < q.indexOf("const evs = DB.getEventsFor"), "right after the question gate");
  assert.ok(lineage < 0 || i < lineage);
});

test("counts both parents' children, split by here / sold / gone", () => {
  const b = q.slice(q.indexOf("/새끼|자식|애기"), q.indexOf("/새끼|자식|애기") + 900);
  assert.match(b, /i\.sireId === target\.id \|\| i\.damId === target\.id/);
  assert.match(b, /새끼는 모두 \$\{k\.length\}마리예요\./);
  assert.match(b, /\['곁에 있는 아이', k\.filter\(i => !isAway\(i\)\)\]/);
  assert.match(b, /\['분양 간 아이', k\.filter\(i => statusOf\(i\) === 'sold'\)\]/);
  assert.match(b, /\['떠난 아이', k\.filter\(i => statusOf\(i\) === 'gone'\)\]/);
  assert.match(b, /새끼는 아직 기록이 없어요/);
});
