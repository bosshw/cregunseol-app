/* v1.9.38 캘린더 부화 줄 (대표님 2026-10-28)
   같은 클러치(크빛이 × 크산이 4차)에서 25일·26일 하루씩 나왔는데, 26일은 "크빛이 · 1마리 부화"로만 나왔습니다.
   첫 부화(r.hatched)만 짝 이름을 붙이던 것 → 그 클러치의 모든 부화(r.hatches)에 붙입니다. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = (await readFile(new URL("../src/app.jsx", import.meta.url), "utf8")).replace(/\r\n/g, "\n");

test("every hatch of a clutch gets the pair name on the calendar", () => {
  assert.match(app, /const byHatchEv = \{\}; cRows\.forEach\(r => \(r\.hatches \|\| \[\]\)\.forEach\(h => \{ byHatchEv\[h\.id\] = r; \}\)\);/);
  assert.doesNotMatch(app, /if \(r\.hatched\) byHatchEv\[r\.hatched\.id\] = r;/);
  assert.match(app, /name = byHatchEv\[e\.id\]\.pairName; label = `\$\{byHatchEv\[e\.id\]\.nth\}차 부화`;/);
});
