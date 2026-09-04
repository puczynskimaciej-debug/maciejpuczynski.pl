import { readFile, readdir, access } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("_site");
const pages = [
  "index.html",
  "projekty/index.html",
  "kontakt/index.html",
  "projekty/maciejpuczynski/index.html",
  "projekty/polacy-w-belgii/index.html",
  "projekty/premiera-aplikacji/index.html",
  "projekty/premiera-narzedzia/index.html",
  "admin/index.html"
];
const failures = [];
for (const page of pages) {
  const file = path.join(output, page);
  try {
    const html = await readFile(file, "utf8");
    if (!/<html lang="pl">/.test(html)) failures.push(`${page}: brak języka dokumentu`);
    if (!/<meta name="viewport"/.test(html)) failures.push(`${page}: brak viewport`);
    if (!page.startsWith("admin/")) {
      if (!/<meta name="description" content="[^"]+"/.test(html)) failures.push(`${page}: brak meta description`);
      if (!/<link rel="canonical" href="https:\/\/maciejpuczynski\.pl/.test(html)) failures.push(`${page}: brak canonical`);
      if (!/href="\/projekty\/"/.test(html) || !/href="\/kontakt\/"/.test(html)) failures.push(`${page}: brak wspólnej nawigacji`);
      if (!/<footer class="site-footer">/.test(html)) failures.push(`${page}: brak wspólnej stopki`);
    }
  } catch { failures.push(`${page}: plik nie istnieje`); }
}
for (const asset of ["assets/css/site.css", "assets/js/site.js", "assets/js/intro-state.js", "assets/images/brand/mp-logo.png", "assets/images/projects/curtain-violet.svg", "assets/images/projects/curtain-coral.svg", "admin/app.js"]) {
  try { await access(path.join(output, asset)); } catch { failures.push(`brak zasobu: ${asset}`); }
}
const generated = await readdir(path.join(output, "projekty"));
if (generated.length < 4) failures.push("nie wygenerowano wszystkich projektów");
console.log(JSON.stringify({ pages: pages.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
