// Capture a route's LOADING and ERROR render states - the two states a normal
// drive can never screenshot (the request resolves too fast, or never fails).
// For each route it holds the matching API call(s) open and screenshots
// mid-load, then aborts them and screenshots the error UI. Born from the
// "dashboard looks blank" bug: invisible skeletons only show up in exactly
// this state.
//
//   BASE_URL  frontend origin (e.g. http://localhost:5173) - required
//   ROUTES    space/comma-separated paths to drive (default: the two dashboards)
//   PATTERN   regex of API URLs to delay/abort (default: the dashboard reports)
//   EMAIL / PASSWORD   seeded super-admin (defaults below)
//
// Shots land in /tmp/verify-design/shots-probe/<route>-{loading,error}.png.
// NOTE: the error phase intentionally aborts requests, so the run always
// reports net::ERR_FAILED console errors - those are the probe, not a bug.

import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.BASE_URL;
if (!BASE) { console.error("BASE_URL is required"); process.exit(1); }
const EMAIL = process.env.EMAIL || "admin@brightfield-lekki.example.com";
const PASSWORD = process.env.PASSWORD || "School@2025";
const routes = (process.env.ROUTES || "/finance /procurement")
  .split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
const PATTERN = new RegExp(
  process.env.PATTERN || "/(finance|procurement)/reports/dashboard/",
);

const SHOTS = "/tmp/verify-design/shots-probe";
fs.rmSync(SHOTS, { recursive: true, force: true });
fs.mkdirSync(SHOTS, { recursive: true });
const slug = (p) => (p.replace(/^\//, "").replace(/\//g, "-") || "root");

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
console.log("logged in");

// 1) LOADING state: hold matching calls open for 15s, shoot at 2.5s.
await ctx.route(PATTERN, async (route) => {
  await new Promise((r) => setTimeout(r, 15000));
  await route.continue();
});
for (const path of routes) {
  await page.goto(`${BASE}${path}`).catch(() => {});
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${SHOTS}/${slug(path)}-loading.png` });
  console.log(`shot ${path} loading`);
}
await ctx.unroute(PATTERN);

// 2) ERROR state: fail matching calls outright.
await ctx.route(PATTERN, (route) => route.abort("failed"));
for (const path of routes) {
  await page.goto(`${BASE}${path}`).catch(() => {});
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${SHOTS}/${slug(path)}-error.png` });
  console.log(`shot ${path} error`);
}

console.log(`\n=== console/page errors (${errors.length}) ===`);
console.log("(net::ERR_FAILED entries are expected - the error phase aborts the calls)");
errors.slice(0, 20).forEach((e) => console.log(" •", e.slice(0, 200)));
console.log(`\nscreenshots in ${SHOTS}/ - Read each to judge the states.`);
await browser.close();
