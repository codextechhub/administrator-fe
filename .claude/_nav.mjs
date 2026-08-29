import { chromium } from "playwright";
const BASE = "http://holy-cross.localhost:5199";
const b = await chromium.launch({ channel: "chrome", headless: true });
const page = await (await b.newContext({ viewport: { width: 1280, height: 820 } })).newPage();
await page.goto(`${BASE}/accounts`, { waitUntil: "networkidle" });
await page.getByPlaceholder("Enter your email").fill("admin@holy-cross.example.com");
await page.getByPlaceholder("Enter your password").fill("School@2025");
await page.getByRole("button", { name: "Login" }).click();
await page.waitForURL(u => !u.pathname.includes("/accounts"), { timeout: 20000 });
await page.waitForTimeout(1500);

const target = "/academic-structure/classes";

// SOFT: click the sidebar link, measure to first paint of page content.
await page.goto(`${BASE}/students`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const t0 = Date.now();
await page.evaluate(() => window.history.pushState({}, "", "/academic-structure/classes"));
await page.goto(`${BASE}${target}`, { waitUntil: "commit" });
const softNav = Date.now() - t0;

// HARD: a full browser load of the same route, cold-ish.
for (const label of ["warm", "warm2"]) {
  const s = Date.now();
  await page.goto(`${BASE}${target}`, { waitUntil: "load" });
  const load = Date.now() - s;
  const idle = await page.evaluate(() => {
    const n = performance.getEntriesByType("navigation")[0];
    return { domContentLoaded: Math.round(n.domContentLoadedEventEnd), loadEvent: Math.round(n.loadEventEnd), transfer: n.transferSize };
  });
  await page.waitForLoadState("networkidle");
  const settled = Date.now() - s;
  console.log(`${label} full reload: load=${load}ms  networkIdle=${settled}ms  DCL=${idle.domContentLoaded}ms`);
}

// How many requests does the app shell fire on a cold load, before the page's own?
const reqs = [];
page.on("request", r => { if (r.url().includes("/v1/")) reqs.push(r.url().split("/v1/")[1].split("?")[0]); });
const s2 = Date.now();
await page.goto(`${BASE}${target}`, { waitUntil: "networkidle" });
console.log(`\nfull reload of ${target}: ${Date.now() - s2}ms to settle`);
console.log(`API calls on that one reload: ${reqs.length}`);
[...new Set(reqs)].forEach(r => console.log("   ", r));
await b.close();
