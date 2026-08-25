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
  assert.match(html, /<script defer src="\.\/vendor\/react\.production\.min\.js"><\/script>/);
  assert.match(html, /<script defer src="\.\/vendor\/react-dom\.production\.min\.js"><\/script>/);
  assert.match(html, /<script defer src="\.\/app\.min\.js"><\/script>/);
  assert.doesNotMatch(app, /react\/jsx-runtime/);
  assert.doesNotMatch(app, /(^|;)import\s/);
  assert.match(app, /React\.createElement/);
  assert.ok(Buffer.byteLength(app) < 280 * 1024, `app.min.js is ${Buffer.byteLength(app)} bytes`);
});

test("keeps the first-load application shell within budget", async () => {
  const paths = [
    "index.html",
    "app.min.js",
    "vendor/react.production.min.js",
    "vendor/react-dom.production.min.js",
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
