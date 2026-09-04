import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:8088";
const executablePath = process.env.BROWSER_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const output = path.resolve("test-results", "responsive");
const viewports = [
  { name: "small-phone", width: 360, height: 740 },
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1024, height: 768 },
  { name: "desktop", width: 1440, height: 900 }
];
const pages = ["/", "/projekty/", "/projekty/maciejpuczynski/", "/kontakt/", "/admin/"];
const failures = [];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
for (const viewport of viewports) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  const page = await context.newPage();
  for (const route of pages) {
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    if (!response?.ok()) failures.push(`${viewport.name}:${route} HTTP ${response?.status()}`);
    const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    if (dimensions.scroll - dimensions.client > 1) failures.push(`${viewport.name}:${route} overflow ${dimensions.scroll - dimensions.client}px`);
  }
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  if (viewport.width <= 760) {
    await page.locator(".nav-toggle").click();
    try { await page.locator(".main-nav.is-open").waitFor({ state: "visible", timeout: 1500 }); }
    catch { failures.push(`${viewport.name}: menu mobilne nie otwiera się`); }
  }
  await page.screenshot({ path: path.join(output, `${viewport.name}-home.png`), fullPage: true });
  await page.goto(`${baseUrl}/projekty/`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(output, `${viewport.name}-projects.png`), fullPage: true });
  await context.close();
}
const sessionContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const sessionPage = await sessionContext.newPage();
await sessionPage.goto(`${baseUrl}/projekty/`, { waitUntil: "networkidle" });
await sessionPage.evaluate(() => sessionStorage.setItem("mp_intro_seen", "true"));
await sessionPage.locator(".brand").first().click();
const introState = await sessionPage.evaluate(() => ({
  active: document.documentElement.classList.contains("intro-active"),
  splashDisplay: document.querySelector("[data-splash]") ? getComputedStyle(document.querySelector("[data-splash]")).display : "removed"
}));
if (introState.active || !["none", "removed"].includes(introState.splashDisplay)) failures.push(`intro miga przy powrocie na stronę główną w tej samej sesji: ${JSON.stringify(introState)}`);
await sessionContext.close();
await browser.close();
console.log(JSON.stringify({ viewports: viewports.length, pages: pages.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
