// Full-page screenshots of /overview at several widths + horizontal-overflow probe.
// Logs in through the UI exactly like the skill's drive.mjs.
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:5174";
const EMAIL = process.env.EMAIL || "admin@brightfield-lekki.example.com";
const PASSWORD = process.env.PASSWORD || "School@2025";
const ROUTE = process.env.ROUTE || "/overview";
const OUT = process.env.OUT || "/tmp/verify-design/shots-full";
const TAG = process.env.TAG || "after";

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await page.goto(`${BASE}/accounts`, { waitUntil: "networkidle" });
await page.getByPlaceholder("Enter your email").fill(EMAIL);
await page.getByPlaceholder("Enter your password").fill(PASSWORD);
await page.getByRole("button", { name: "Login" }).click();
await page.waitForURL(
  (u) => !u.pathname.includes("/login") && !u.pathname.includes("/accounts"),
  { timeout: 20000 },
);

for (const [name, w, h] of [
  ["desktop", 1440, 900],
  ["laptop", 1280, 900],
  ["tablet", 820, 1000],
  ["phone", 390, 844],
]) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/${TAG}-${name}.png`, fullPage: true });
  const over = await page.evaluate(() => {
    const d = document.documentElement;
    const bad = [];
    if (d.scrollWidth > d.clientWidth) {
      for (const el of document.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (r.right > d.clientWidth + 1 && r.width > 0) {
          bad.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 70)} right=${Math.round(r.right)}`);
        }
      }
    }
    return { over: d.scrollWidth - d.clientWidth, bad: bad.slice(0, 5) };
  });
  console.log(`${name} ${w}px → horizontal overflow ${over.over}px`);
  over.bad.forEach((b) => console.log("    ", b));
}

console.log(`\nconsole errors (${errors.length})`);
errors.slice(0, 15).forEach((e) => console.log(" •", e.slice(0, 200)));
await browser.close();
