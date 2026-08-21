// Drive the running app as the seeded admin and screenshot each route.
// App-agnostic: works for ANY screen in this app. Read-only - navigates +
// screenshots only, never submits a form.
//
//   BASE_URL  frontend origin (e.g. http://localhost:5173) - required
//   EMAIL / PASSWORD   seeded super-admin (defaults below)
//   ROUTES    space/comma-separated paths to drive - required (the SKILL.md
//             determines these from what you changed, or you pass them)
//
// Uses system Chrome via Playwright's `channel: 'chrome'` - no browser download.

import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.BASE_URL;
if (!BASE) { console.error("BASE_URL is required"); process.exit(1); }
const EMAIL = process.env.EMAIL || "admin@brightfield-lekki.example.com";
const PASSWORD = process.env.PASSWORD || "School@2025";

const targets = (process.env.ROUTES || "")
  .split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
if (!targets.length) {
  console.error("No ROUTES given. Pass routes to drive, e.g. ROUTES='/team-management /finance/ledger'.");
  process.exit(1);
}

const SHOTS = "/tmp/verify-design/shots";
fs.rmSync(SHOTS, { recursive: true, force: true });
fs.mkdirSync(SHOTS, { recursive: true });
const slug = (p) => (p.replace(/^\//, "").replace(/\//g, "-") || "root");

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

try {
  await page.goto(`${BASE}/accounts`, { waitUntil: "networkidle" });
  await page.getByPlaceholder("Enter your email").fill(EMAIL);
  await page.getByPlaceholder("Enter your password").fill(PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL(
  (u) => !u.pathname.includes("/login") && !u.pathname.includes("/accounts"),
  { timeout: 20000 },
);
  console.log("logged in →", page.url());

  for (const path of targets) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(1500);
    const file = `${SHOTS}/${slug(path)}.png`;
    await page.screenshot({ path: file });
    console.log(`shot: ${slug(path)} → ${page.url()}`);
  }
} catch (e) {
  console.log("DRIVE ERROR:", e.message);
  await page.screenshot({ path: `${SHOTS}/error.png` }).catch(() => {});
} finally {
  console.log(`\n=== console/page errors (${errors.length}) ===`);
  errors.slice(0, 30).forEach((e) => console.log(" •", e.slice(0, 240)));
  console.log(`\nscreenshots in ${SHOTS}/ - Read each to judge the design.`);
  await browser.close();
}
