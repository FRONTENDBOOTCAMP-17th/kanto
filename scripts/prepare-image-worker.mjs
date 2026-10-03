import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const packageRoot = dirname(require.resolve("browser-image-compression/package.json"));
const destination = fileURLToPath(new URL("../public/vendor/", import.meta.url));
await mkdir(destination, { recursive: true });
await Promise.all([
  copyFile(join(packageRoot, "dist/browser-image-compression.js"), join(destination, "browser-image-compression.js")),
  copyFile(join(packageRoot, "LICENSE"), join(destination, "browser-image-compression.LICENSE")),
]);
console.log("Prepared same-origin image compression worker dependency and license.");
