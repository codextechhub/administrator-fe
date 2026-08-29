import { chromium } from "playwright";
import fs from "node:fs";
const BASE = "http://localhost:5174";
const routes = fs.readFileSync("/tmp/routes.txt", "utf8").split("\n").filter(Boolean);
const b = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", e => errs.push(`${page.url()} :: ${e.message}`));
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.getByPlaceholder("Enter your email").fill("admin@codexng.com");
await page.getByPlaceholder("Enter your password").fill("Admin@123456");
await page.getByRole("button", { name: /login|sign in/i }).first().click();
await page.waitForURL(u => !u.pathname.includes("/login"), { timeout: 25000 });

const bad = [];
let checked = 0, blank = 0;
for (const r of routes) {
  for (const w of [1440, 390]) {
    await page.setViewportSize({ width: w, height: 800 });
    try { await page.goto(`${BASE}${r}`, { waitUntil: "domcontentloaded", timeout: 20000 }); } catch { continue; }
    await page.waitForTimeout(700);
    const res = await page.evaluate(() => {
      const d = document.documentElement;
      const m = document.querySelector("main");
      return { over: d.scrollWidth - d.clientWidth, hasMain: !!m, mainH: m ? Math.round(m.getBoundingClientRect().height) : 0 };
    });
    checked++;
    if (!res.hasMain || res.mainH < 20) { blank++; if (w === 1440) console.log(`  blank: ${r} hasMain=${res.hasMain} h=${res.mainH} url=${page.url().replace(BASE, "")}`); }
    if (res.over > 1) bad.push(`${r} @${w}  overflow=${res.over}px`);
  }
}
console.log(`checked ${checked} page/width pairs across ${routes.length} routes`);
console.log(`pages with no main or a collapsed one: ${blank}`);
console.log(bad.length ? "OVERFLOWING:\n  " + bad.join("\n  ") : "no page overflows horizontally");
console.log("page errors:", errs.length);
errs.slice(0, 12).forEach(e => console.log("  -", e));
await b.close();
