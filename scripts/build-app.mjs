import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "app.min.js");

await build({
  absWorkingDir: root,
  entryPoints: ["src/app.jsx"],
  outfile: output,
  bundle: false,
  minify: true,
  legalComments: "none",
  charset: "utf8",
  jsx: "transform",
  jsxFactory: "BrandElement",
  jsxFragment: "React.Fragment",
  tsconfigRaw: {
    compilerOptions: {
      jsx: "react",
    },
  },
  target: ["es2018"],
});

const built = await stat(output);
console.log(`app.min.js ${built.size} bytes`);

/* v1.8 — 엑셀·표 가져오기는 따로 묶습니다(importer.min.js).
   누를 때만 불러오므로 첫 화면 크기에 들어가지 않습니다.
   엔진(import-engine.js)은 화면을 모르는 순수한 부분이라 node 시험에서 그대로 씁니다. */
import { readFile } from "node:fs/promises";
const importerOut = path.join(root, "importer.min.js");
const importerSrc = (await Promise.all([
  readFile(path.join(root, "src/import-engine.js"), "utf8"),
  readFile(path.join(root, "src/import-screen.jsx"), "utf8"),
])).join("\n;\n");
await build({
  absWorkingDir: root,
  stdin: { contents: importerSrc, loader: "jsx", resolveDir: root, sourcefile: "importer.jsx" },
  outfile: importerOut,
  bundle: false,
  minify: true,
  legalComments: "none",
  charset: "utf8",
  jsx: "transform",
  jsxFactory: "BrandElement",
  jsxFragment: "React.Fragment",
  target: ["es2018"],
});
const imp = await stat(importerOut);
console.log(`importer.min.js ${imp.size} bytes`);

/* v1.9.2 — 처음 온 사람 안내(예시 아이들 · 앱 밖으로/설치 안내)도 따로 묶습니다(welcome.min.js).
   설치 전 폰이나 예시로 구경할 때만 불러옵니다. */
const welcomeOut = path.join(root, "welcome.min.js");
await build({
  absWorkingDir: root,
  entryPoints: ["src/welcome.jsx"],
  outfile: welcomeOut,
  bundle: false,
  minify: true,
  legalComments: "none",
  charset: "utf8",
  jsx: "transform",
  jsxFactory: "BrandElement",
  jsxFragment: "React.Fragment",
  target: ["es2018"],
});
const wel = await stat(welcomeOut);
console.log(`welcome.min.js ${wel.size} bytes`);

/* v1.9.21 — 분양 카드 그리기(QR 포함)는 누를 때만 불러옵니다(card.min.js).
   QR 만드는 부분은 qrcode-generator(MIT)를 함께 묶습니다. */
const cardOut = path.join(root, "card.min.js");
await build({
  absWorkingDir: root,
  entryPoints: ["src/card.js"],
  outfile: cardOut,
  bundle: true,
  format: "iife",
  minify: true,
  legalComments: "none",
  charset: "utf8",
  target: ["es2018"],
});
const crd = await stat(cardOut);
console.log(`card.min.js ${crd.size} bytes`);

/* v1.9.21 — 시즌 노트 · 분양 카드 · 입양 화면(extras.min.js). 누를 때·입양 링크로 왔을 때만 불러옵니다. */
const extrasOut = path.join(root, "extras.min.js");
await build({
  absWorkingDir: root,
  entryPoints: ["src/extras.jsx"],
  outfile: extrasOut,
  bundle: false,
  minify: true,
  legalComments: "none",
  charset: "utf8",
  jsx: "transform",
  jsxFactory: "BrandElement",
  jsxFragment: "React.Fragment",
  target: ["es2018"],
});
const ext = await stat(extrasOut);
console.log(`extras.min.js ${ext.size} bytes`);

// Owner-only preview: not part of the public first-load bundle.
await build({
  absWorkingDir: root, entryPoints: ['src/crevalue/screen.jsx'],
  outfile: path.join(root, 'crevalue.min.js'), bundle: true, format: 'iife',
  minify: true, legalComments: 'none', charset: 'utf8',
  jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment', target: ['es2020'],
});
