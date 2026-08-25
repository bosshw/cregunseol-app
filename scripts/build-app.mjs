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
  jsxFactory: "React.createElement",
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
