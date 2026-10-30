/* v1.9.39 대화 이어 묻기 (대표님 2026-10-30)
   분양 보냈어 → 얼마에·누구에게 / 입양했어 → 얼마에·어디서 / 태어났어 → 모프
   답은 담아 둔 기록(분양·부화)이나 입양 메모에 채우고, 저장 길(DB.recordSale · setAdoptMemo · 해칭 저장)이 연결된 곳(상태·가계부·분양 기록·아기 모프)을 맞춥니다. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const ex = (await readFile(new URL("../src/extras.jsx", import.meta.url), "utf8")).replace(/\r\n/g, "\n");
const app = (await readFile(new URL("../src/app.jsx", import.meta.url), "utf8")).replace(/\r\n/g, "\n");
const part = ex.slice(ex.indexOf("const FU = {"), ex.indexOf("function fuBuild("));
const DB = { getIndividuals: () => [{ id: "a", name: "크윤이" }] };
const { fuPrice, fuWho } = new Function("DB", "wonText", part + "\nreturn { fuPrice, fuWho };")(DB, (n) => n + "원");

test("price answers: 만원 · 원 · bare number · free", () => {
  assert.deepEqual(fuPrice("15만원"), { won: 150000 });
  assert.deepEqual(fuPrice("150,000원"), { won: 150000 });
  assert.deepEqual(fuPrice("15"), { won: 150000 }, "숫자만이면 만원");
  assert.deepEqual(fuPrice("12.5만"), { won: 125000 });
  assert.deepEqual(fuPrice("무료로 줬어"), { free: true, won: 0 });
  assert.equal(fuPrice("크빛이 밥 먹었어"), null, "대답이 아니면 null → 평소대로");
});

test("who answers: trims 님/한테, rejects records and animal names", () => {
  assert.equal(fuWho("홍길동님"), "홍길동");
  assert.equal(fuWho("새벽브리더에서"), "새벽브리더");
  assert.equal(fuWho("크빛이 밥 먹었어"), null);
  assert.equal(fuWho("크윤이"), null, "개체 이름은 사람 이름이 아님");
});

test("questions per record and where answers go", () => {
  const b = ex.slice(ex.indexOf("function fuBuild("), ex.indexOf("function fuNext("));
  assert.match(b, /얼마에 보내셨나요\?/); assert.match(b, /누구에게 보내셨나요\?/);
  assert.match(b, /c\.patch\(f, \{ buyer: w \}\)/, "분양처는 담아 둔 분양 기록의 buyer → 저장 때 recordSale");
  assert.match(b, /얼마에 데려오셨나요\?/); assert.match(b, /어디서\(누구에게서\) 데려오셨나요\?/);
  assert.match(b, /setAdoptMemo\(ind\.id, v\.source, v\.price\)/);
  assert.match(b, /data: \{ \.\.\.m\.data, dated: true \}/, "가계부 그 달 '개체 구입'");
  assert.match(b, /모프는 무엇인가요\?/); assert.match(b, /c\.patch\(f, \{ morph: t \}\)/);
  const f = ex.slice(ex.indexOf("function followUp("), ex.indexOf("function followUp(") + 800);
  assert.match(f, /if \(r == null\) \{ FU\.q = \[\]; fuNext\(\); return 'pass'; \}/, "다른 이야기면 멈추고 평소대로");
});

test("app hooks: after records are put in, before parsing, and on adoption words", () => {
  assert.match(app, /if \(fs\.some\(f => f\.type === 'distribution' \|\| f\.type === 'hatching'\)\) follow\(\{ facts: fs \}\);/);
  assert.match(app, /if \(fuRef\.current && window\.CREG_EXTRAS\) \{\n\s*const r = window\.CREG_EXTRAS\.followUp\(text, null, fuCtx\(\)\);\n\s*fuRef\.current = r === true;\n\s*if \(r !== 'pass'\) return;/);
  assert.match(app, /const adoptSaid = ADOPT_STRONG\.test\(text\)/);
  assert.match(app, /if \(hp\.ask\) follow\(\{ adopt: saved\.id, date: hp\.ask \}\);/, "새 이름은 등록한 뒤 묻기");
  assert.match(app, /DB\.recordSale\(f\.targetId, \{/, "분양 저장은 원래 길 그대로");
});
