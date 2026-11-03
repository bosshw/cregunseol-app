/* v1.9.47 대표님 제보(2026-11-03) — "크안이 애기 태어났어 → 2마리 → 모프 넘김 → 저장"에서
   ① 아빠가 이름으로만 적혀 있으면 아빠 없이 "안1호·안2호" ② 아기 둘에 모프 한 칸 ③ 이름 맞추기가 기존 "안울1호"를 "안3호"로 바꾸자고 함 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const rd = async (p) => (await readFile(new URL("../" + p, import.meta.url), "utf8")).replace(/\r\n/g, "\n");
const app = await rd("src/app.jsx"), ex = await rd("src/extras.jsx");

test("baby names use the clutch's father, even a name-only one", () => {
  const p = app.slice(app.indexOf("function hatchBabyPlan("), app.indexOf("function makeBabyNames("));
  assert.match(p, /const row = d\.layingId \? clutchRows\(\)\.find\(c => c\.e\.id === d\.layingId\) : null;/);
  assert.match(p, /\(row && row\.dadName\)/, "이름으로만 적힌 아빠도 이름 짓기에 씁니다");
  assert.match(p, /makeBabyNames\(mom \? mom\.name : '', dad \? dad\.name : dadName,/);
  assert.match(app, /const \{ dadId, count, names, morphOf \} = hatchBabyPlan\(f\);/, "저장과 확인 화면이 같은 답");
});

test("each baby gets its own morph", () => {
  assert.match(app, /const mo = morphOf\(k\);/);
  assert.match(app, /data-testid=\{'hm-' \+ k\}/, "확인 화면에 아기마다 한 칸");
  assert.match(ex, /if \(n > 1 && parts\.length === n\) \{ c\.patch\(f, \{ morph: '', morphs: parts \}\);/, "대화로 쉼표 답하면 아기별로");
  assert.match(ex, /\{ label: '🤷 모름 \(나중에\)', kind: 'reply', value: '모름' \}/, "모프 질문에 [모름] 칩");
  assert.match(app, /kind === 'reply' && value/);
});

test("name fix: older siblings' names win a tie and keep their spacing", () => {
  const n = app.slice(app.indexOf("function nameFixPlan("), app.indexOf("function applyNameFixes("));
  assert.match(n, /b\[1\] - a\[1\] \|\| first\[a\[0\]\]\.localeCompare\(first\[b\[0\]\]\)/);
  assert.match(n, /const to = `\$\{main\}\$\{sp\}\$\{next\}호`;/);
});
