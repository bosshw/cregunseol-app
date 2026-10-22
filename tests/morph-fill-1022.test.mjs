/* v1.9.34 모프누락명령 (대표님 2026-10-22)
   명령어는 "모프누락명령"(명령까지). 모프 빈 아이를 하나씩 소개하고 답을 그대로 적습니다.
   모름/넘어가 → 비워 두고 다음 · 그만 → 멈춤 · 취소 → 방금 것 되돌리고 다시 묻기 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const ex = await readFile(new URL("../src/extras.jsx", import.meta.url), "utf8");
const app = await readFile(new URL("../src/app.jsx", import.meta.url), "utf8");
const part = ex.slice(ex.indexOf("const MF = {"), ex.lastIndexOf("window.CREG_EXTRAS = {"));

test("command word is 모프누락명령 (with 명령) and the chat routes every answer there while asking", () => {
  assert.match(part, /const MF_CMD = \/모프\\s\*누락\\s\*명령\//);
  const hook = app.slice(app.indexOf("const process = (text) => {"), app.indexOf("const process = (text) => {") + 600);
  assert.match(hook, /if \(mfRef\.current \|\| \/모프\\s\*누락\\s\*명령\/\.test\(text\)\)/, "first thing in process()");
  assert.match(hook, /mfRef\.current = X\.morphFill\(text, \{ bot, refreshIndividuals \}\)/);
  assert.doesNotMatch("모프누락", /모프\s*누락\s*명령/, "'모프누락' alone is not the command");
});

test("only animals that are here and have an empty morph, oldest first", () => {
  const list = part.slice(part.indexOf("function mfList("), part.indexOf("function mfIntro("));
  assert.match(list, /filter\(g => isHere\(g\) && !String\(g\.morph \|\| ''\)\.trim\(\)\)/);
  assert.match(list, /g\.hatchDate \|\| mfCame\(g, evs\)\.at \|\| String\(g\.createdAt/);
});

test("answers: saved as typed; 모름 skips; 그만 stops; 취소 restores", () => {
  const fill = part.slice(part.indexOf("function morphFill("));
  assert.match(fill, /DB\.updateIndividual\(g\.id, \{ morph: t \}\)/, "saved exactly as typed (trimmed)");
  assert.match(fill, /\^\(모름\|모르겠\|몰라\|넘어가/);
  assert.match(fill, /\^\(그만\|멈춰/);
  assert.match(fill, /\^\(취소\|되돌려/);
  assert.match(fill, /DB\.updateIndividual\(id, \{ morph: prev \|\| '' \}\)/);
  assert.match(fill, /모프 "\$\{t\}"로 기록할게요/);
  assert.match(part, /'013678'\.indexOf\(d\)/, "digit-final names read by sound for 예요/이에요");
});

test("intro only says what the records have (parents · N차 해칭 · 부화일 · 데려온 날/곳)", () => {
  const intro = part.slice(part.indexOf("function mfIntro("), part.indexOf("function mfAsk("));
  assert.match(intro, /\$\{row\.pairName\} \$\{row\.nth\}차 해칭 아이이고/);
  assert.match(intro, /에 태어난 아이예요\./);
  assert.match(intro, /데려왔어요\./);
  assert.match(intro, /모프가 무엇인가요\?/);
});
