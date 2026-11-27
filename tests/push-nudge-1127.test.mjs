/* v1.9.71 (대표님 2026-11-27 "네 말대로 구현해줘")
   ① 시험 환경(localhost·파일·자동 조종 브라우저)은 방문 집계에서 뺌 — 11/20 410회 중 401회가 시험이었음
   ② 자동 크롬 넘김 단계 이름을 표가 받는 onb_… 로 (auto_out 은 서버가 거절)
   ③ 처음 뭔가 적으면 잠깐 뒤 한 번 "부화일 다가오면 알려 드릴까요?" — 계정 없으면 그 자리에서 가입부터 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
const read = (f) => readFile(new URL("../" + f, import.meta.url), "utf8");

test("시험 환경은 안 셈 — localhost·127.0.0.1·파일·webdriver", async () => {
  const app = await read("src/app.jsx");
  assert.match(app, /if \(TRACK_DEV\(\)\) return true;/);
  const fn = app.slice(app.indexOf("const TRACK_DEV = () => {"), app.indexOf("const TRACK = {"));
  const run = (loc, nav) => vm.runInNewContext(fn + "; TRACK_DEV()", { location: loc, navigator: nav || {} });
  assert.equal(run({ protocol: "http:", hostname: "localhost" }), true);
  assert.equal(run({ protocol: "http:", hostname: "127.0.0.1" }), true);
  assert.equal(run({ protocol: "file:", hostname: "" }), true);
  assert.equal(run({ protocol: "https:", hostname: "bosshw.github.io" }, { webdriver: true }), true);
  assert.equal(run({ protocol: "https:", hostname: "bosshw.github.io" }, { webdriver: false }), false, "실제 서비스 주소는 셈");
});

test("자동 크롬 넘김은 onb_autoout 으로 (표의 허용 이름)", async () => {
  const w = await read("src/welcome.jsx");
  assert.match(w, /TRACK\.step\('onb_autoout'\)/);
  assert.doesNotMatch(w, /TRACK\.step\('auto_out'\)/);
  assert.match("onb_autoout", /^onb_[a-z0-9]{1,16}$/);
  assert.match("onb_pushask", /^onb_[a-z0-9]{1,16}$/);
  assert.match("onb_pushsignup", /^onb_[a-z0-9]{1,16}$/);
});

test("첫 기록 뒤 알림 권유 — 한 번만, 상태별로 다르게", async () => {
  const [app, ex] = await Promise.all([read("src/app.jsx"), read("src/extras.jsx")]);
  assert.equal((app.match(/TRACK\.step\('record'\); \} catch \(e\) \{\} pushNudgeArm\(\); \}/g) || []).length, 2, "개체 추가·기록 추가 둘 다");
  const due = app.slice(app.indexOf("function pushNudgeDue()"), app.indexOf("function pushNudgeArm()"));
  assert.match(due, /if \(DEMO\.on\(\)\) return false;/, "예시 구경 중엔 안 물음");
  assert.match(due, /if \(v === 'done'\) return false;/, "한 번 답하면 다시 안 물음");
  assert.match(due, /return st === 'need-install' \|\| st === 'need-login' \|\| st === 'off';/, "이미 켰거나 막혔거나 지원 안 하면 안 물음");
  assert.match(app, /<Extra part="PushNudgeSheet"/);
  const sh = ex.slice(ex.indexOf("function PushNudgeSheet("), ex.lastIndexOf("window.CREG_EXTRAS = {"));
  assert.match(sh, /SYNC\.signUp\(email, form\.password\)/, "계정이 없으면 그 자리에서 가입");
  assert.match(sh, /await PUSH\.enable\(\)/);
  assert.match(sh, /data-testid="pn-enable"/, "가입 뒤엔 [알림 켜기]를 한 번 더 눌러야 허용 창이 뜸");
  assert.match(sh, /mark\(st === 'need-install' \? 'later-ios' : 'done'\)/, "아이폰은 홈 화면 앱으로 열었을 때 한 번 더");
  assert.match(ex, /PushCard, PushNudgeSheet, SyncCard/);
});
