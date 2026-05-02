/**
 * GitHub Pages serves 404.html when a path has no file (e.g. /repo/track).
 * Copying the SPA entry lets React Router handle the URL.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, "..", "dist");
const indexHtml = path.join(dist, "index.html");
const notFoundHtml = path.join(dist, "404.html");

if (!fs.existsSync(indexHtml)) {
  console.error("gh-pages-spa-fallback: dist/index.html missing — run vite build first.");
  process.exit(1);
}
fs.copyFileSync(indexHtml, notFoundHtml);
console.log("gh-pages-spa-fallback: dist/index.html → dist/404.html");
