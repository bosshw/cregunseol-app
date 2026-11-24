/* v1.9.70 앱으로 쓰는 길 줄이기 (대표님 2026-11-24 "줄일 수 있는 건 줄여봐")
   ① 인스타·카톡 안에서 열면 누르지 않아도 크롬(카톡은 기본 브라우저)으로 넘김 — 안드로이드·카톡만, 한 번만
   ② 넘어간 쪽은 ?inst=1 로 "넘어왔어요 + 설치 버튼 하나" — 주소에서는 지움
   ③ 크롬 없는 안드로이드는 기본 브라우저로 (browser_fallback_url)
   ④ 설치 단계는 [다음]으로 넘기지 않고 한 화면에 다 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (f) => readFile(new URL("../" + f, import.meta.url), "utf8");

test("인스타·카톡 안 — 자동으로 바깥 브라우저로, 이번 방문 한 번만", async () => {
  const w = await read("src/welcome.jsx");
  assert.match(w, /function autoOutside\(\)/);
  assert.match(w, /if \(!\(TRACK\.device\(\) === 'android' \|\| INAPP === '카카오톡'\)\) return false;/, "아이폰 인스타는 버튼 그대로");
  assert.match(w, /sessionStorage\.setItem\(AUTO_OUT_KEY, '1'\)/, "되돌아와도 또 넘기지 않음");
  assert.match(w, /if \(!hide && !TRACK\.standalone\(\) && os !== 'pc'\) autoOutside\(\);/, "기록이 있는 브라우저(hide)에선 안 넘김");
  assert.match(w, /S\.browser_fallback_url=/, "크롬 없는 폰은 기본 브라우저로");
  assert.match(w, /location\.pathname \+ '\?inst=1'/);
});

test("넘어온 쪽 — 주소의 inst=1 은 지우고 '넘어왔어요' 한 줄", async () => {
  const w = await read("src/welcome.jsx");
  assert.match(w, /q\.get\('inst'\) !== '1'/);
  assert.match(w, /history\.replaceState\(/);
  assert.match(w, /CAME_OUT \?/);
  assert.match(w, /넘어왔어요!/);
});

test("설치 단계 — 한 화면에 1·2·3 다 (넘기기 없음)", async () => {
  const [w, h] = await Promise.all([read("src/welcome.jsx"), read("index.html")]);
  assert.match(w, /data-testid="gate-guide"/);
  assert.match(w, /steps\.map\(\(x, i\) =>/);
  assert.doesNotMatch(w, /data-testid="gate-next"/, "[다음] 버튼 없음");
  assert.match(h, /\.gate-list \{/);
});
