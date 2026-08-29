import { chromium } from "playwright";
import fs from "node:fs";
const OUT = "/tmp/verify-design/write"; fs.mkdirSync(OUT, { recursive: true });
const BASE = "http://holy-cross.localhost:5199";
const b = await chromium.launch({ channel: "chrome", headless: true });
const page = await (await b.newContext({ viewport: { width: 1280, height: 820 }, deviceScaleFactor: 2 })).newPage();
const errs = []; page.on("pageerror", e => errs.push(e.message));
await page.goto(`${BASE}/accounts`, { waitUntil: "networkidle" });
await page.getByPlaceholder("Enter your email").fill("admin@holy-cross.example.com");
await page.getByPlaceholder("Enter your password").fill("School@2025");
await page.getByRole("button", { name: "Login" }).click();
await page.waitForURL(u => !u.pathname.includes("/accounts"), { timeout: 20000 });
await page.waitForTimeout(2000);

const mark = page.locator(".school-mark").first();
const ink = mark.locator(".school-mark__ink");
console.log("font actually used:", await ink.evaluate(el => getComputedStyle(el).fontFamily));
console.log("font size:", await ink.evaluate(el => getComputedStyle(el).fontSize));
const clip = { x: 0, y: 0, width: 300, height: 70 };
await page.screenshot({ path: `${OUT}/0-rest.png`, clip });
await mark.hover();
for (const [i, wait] of [[1, 260], [2, 200], [3, 200], [4, 260], [5, 400]]) {
  await page.waitForTimeout(wait);
  const v = await ink.evaluate(el => getComputedStyle(el).getPropertyValue("--school-mark-ink"));
  console.log(`  t${i}: ink=${v.trim()}`);
  await page.screenshot({ path: `${OUT}/${i}-writing.png`, clip });
}
// The worst case the rule can produce: a 34-character name at 12px, and a
// slug, both measured against the 190px face.
const fits = await page.evaluate(() => {
  const probe = document.createElement("span");
  probe.style.cssText = "position:fixed;visibility:hidden;white-space:nowrap;font-family:var(--font-script);font-weight:600;line-height:1";
  document.body.appendChild(probe);
  const at = (text, size) => { probe.style.fontSize = size + "px"; probe.textContent = text; return Math.round(probe.getBoundingClientRect().width); };
  const out = {
    "34ch @12px": at("Command Secondary School Ikeja Ann", 12),
    "30ch @13px": at("Bright Star International Schl", 13),
    "26ch @14px": at("Greenfield Academy Lekki 2", 14),
    "20ch @16px": at("Holy Cross College X", 16),
    "14ch @18px": at("Sunrise Academy", 18),
    "slug @18px": at("gcss-ikeja", 18),
  };
  probe.remove();
  return out;
});
console.log("widths against the 190px face:");
for (const [k, v] of Object.entries(fits)) console.log(`   ${k}: ${v}px ${v <= 190 ? "fits" : "OVERFLOWS"}`);

await page.mouse.move(900, 500);
await page.waitForTimeout(700);
console.log("after leaving:", (await ink.evaluate(el => getComputedStyle(el).getPropertyValue("--school-mark-ink"))).trim());
console.log("errors:", errs.length); errs.forEach(e => console.log(" -", e));
await b.close();
