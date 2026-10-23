/* v1.9.33 의견 한 줄 (대표님 2026-10-22)
   - 보내기 / 안 보낼게요 둘 다 있어야 합니다
   - 묻는 카드에도, 안 보낸 뒤 문구에도 "써 주셔서 감사" 가 꼭 들어갑니다
   - 안 보낸 분께는 설정의 오픈채팅으로 언제든 건의해 달라고 알립니다
   - 안 보내면 서버로 아무것도 가지 않습니다 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const ex = (await readFile(new URL("../src/extras.jsx", import.meta.url), "utf8")).replace(/\r\n/g, "\n");
const app = await readFile(new URL("../src/app.jsx", import.meta.url), "utf8");
const sql = await readFile(new URL("../supabase_feedback.sql", import.meta.url), "utf8");
const card = ex.slice(ex.indexOf("function FeedbackCard("), ex.indexOf("function FeedbackInbox("));

test("feedback card has both send and don't-send, and thanks in every state", () => {
  assert.ok(card.length > 500);
  assert.match(card, /data-testid="fb-send"[^\n]*\}>\{busy \? '보내는 중…' : '보내기'\}/);
  assert.match(card, /data-testid="fb-skip"[^\n]*\}>안 보낼게요</);
  const ask = card.slice(card.indexOf('data-testid="fb-card"'));
  const skip = card.slice(card.indexOf('data-testid="fb-skipped"'), card.indexOf('data-testid="fb-card"'));
  const sent = card.slice(card.indexOf('data-testid="fb-sent"'), card.indexOf('data-testid="fb-skipped"'));
  assert.match(ask, /써 주셔서 감사해요/, "asking card thanks the user");
  assert.match(skip, /써 주셔서 정말 감사합니다/, "after don't-send, thanks the user");
  assert.match(sent, /감사합니다/, "after sending, thanks the user");
  const later = card.slice(card.indexOf('data-testid="fb-later"'), card.indexOf('data-testid="fb-later"') + 300);
  assert.match(later, /설정 › 💬 문의·건의 오픈채팅/, "points to the settings open chat");
  assert.match(skip, /\{after\}/, "skip state shows the open-chat note");
});

test("don't-send sends nothing; send only posts to cg_feedback without the login token", () => {
  const skipBtn = card.slice(card.indexOf('data-testid="fb-skip"') - 60, card.indexOf('data-testid="fb-skip"') + 120);
  assert.match(skipBtn, /onClick=\{\(\) => done\('skip'\)\}/);
  const done = card.slice(card.indexOf("const done ="), card.indexOf("const toggle ="));
  assert.doesNotMatch(done, /fetch|SYNC\.api/);
  assert.equal((card.match(/SYNC\.api\(/g) || []).length, 1);
  assert.match(card, /SYNC\.api\('\/rest\/v1\/cg_feedback', \{ method: 'POST'[\s\S]*?\}, false\)/);
  const pay = ex.slice(ex.indexOf("function fbPayload("), ex.indexOf("const fbChat"));
  assert.doesNotMatch(pay, /email|name|userId|uid/i, "no personal data in the payload");
});

test("card shows once, from the 3rd visit (2nd with animals), never for the owner or demo", () => {
  const gate = app.slice(app.indexOf("const fbDue ="), app.indexOf("const fbDue =") + 400);
  assert.match(gate, /DEMO\.on\(\) \|\| TRACK\.off\(\) \|\| localStorage\.getItem\('cg_fb'\)/);
  assert.match(gate, /v >= 3 \|\| \(n > 0 && v > 1\)/);
  assert.match(card, /STORE\.set\('cg_fb'/);
  assert.match(app, /\{view === 'own' && fb && <Extra part="FeedbackCard" onClose=\{\(\) => setFb\(false\)\} \/>\}/);
  assert.match(app, /\{canUseCrevalue\(\) && <Extra part="FeedbackInbox" \/>\}/, "inbox is owner-only");
});

test("feedback table: anyone inserts, only the owner reads, nobody updates", () => {
  assert.match(sql, /for insert to anon, authenticated with check \(true\)/);
  assert.match(sql, /for select to authenticated using \(auth\.uid\(\) = 'fa66ca69-3637-47b9-9cd3-58eac56c91d1'::uuid\)/);
  assert.doesNotMatch(sql, /^\s*create policy[^\n]*\n\s*for (update|delete)/m);
  const keys = [...ex.matchAll(/\{ key: '([a-z]+)', label: '[^']+' \},?\n/g)].map(m => m[1]).filter(k => ["easy","alarm","hard","missing","bug","unsure"].includes(k));
  assert.deepEqual(keys, ["easy","alarm","hard","missing","bug","unsure"]);
  assert.match(sql, /array\['easy','alarm','hard','missing','bug','unsure'\]/);
});
