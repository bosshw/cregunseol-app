import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import test from "node:test";

const root = new URL("../", import.meta.url);
const file = (name) => new URL(name, root);

test("ships precompiled application code without runtime Babel", async () => {
  const [html, app] = await Promise.all([
    readFile(file("index.html"), "utf8"),
    readFile(file("app.min.js"), "utf8"),
  ]);

  assert.doesNotMatch(html, /babel(?:-standalone)?|text\/babel|cdnjs\.cloudflare\.com/i);
  /* v1.1 — 화면 엔진을 Preact 로 바꿨습니다. 앱 코드는 그대로 React 이름을 부르고,
     이 껍데기 한 장이 그 이름을 세워줍니다. react·react-dom 두 줄은 되돌릴 때를 위해 저장소에 남겨둡니다. */
  assert.match(html, /<script defer src="\.\/vendor\/preact-shim\.min\.js"><\/script>/);
  assert.doesNotMatch(html, /vendor\/react(-dom)?\.production\.min\.js/);
  assert.match(html, /<script defer src="\.\/app\.min\.js"><\/script>/);
  assert.doesNotMatch(app, /react\/jsx-runtime/);
  assert.doesNotMatch(app, /(^|;)import\s/);
  assert.match(app, /React\.createElement/);
  /* 원본 크기는 참고용 한도입니다. 실제로 오가는 건 gzip 이라
     진짜 관문은 아래 "첫 화면 묶음 gzip 150KB" 쪽입니다. */
  assert.ok(Buffer.byteLength(app) < 300 * 1024, `app.min.js is ${Buffer.byteLength(app)} bytes`);

  const shim = await readFile(file("vendor/preact-shim.min.js"), "utf8");
  assert.match(shim, /window\.React\s*=/, "the shim must define React");
  assert.match(shim, /window\.ReactDOM\s*=/, "the shim must define ReactDOM");
  assert.match(shim, /createRoot/, "createRoot must come from preact/compat/client");
});

test("keeps the first-load application shell within budget", async () => {
  const paths = [
    "index.html",
    "app.min.js",
    "brand-art.js",
    "brand-art.css",
    "vendor/preact-shim.min.js",
  ];
  const buffers = await Promise.all(paths.map((name) => readFile(file(name))));
  const gzipBytes = buffers.reduce((sum, body) => sum + gzipSync(body).length, 0);
  assert.ok(gzipBytes < 150 * 1024, `application shell gzip total is ${gzipBytes} bytes`);
});

test("keeps install icons within their delivery budgets", async () => {
  const [small, large, apple] = await Promise.all([
    stat(file("icon-192.png")),
    stat(file("icon-512.png")),
    stat(file("icon-180.png")),
  ]);
  assert.ok(small.size < 60 * 1024, `icon-192.png is ${small.size} bytes`);
  assert.ok(large.size < 60 * 1024, `icon-512.png is ${large.size} bytes`);
  assert.ok(apple.size < 70 * 1024, `icon-180.png is ${apple.size} bytes`);
});
