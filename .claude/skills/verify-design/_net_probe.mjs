// Login and visit ROUTES, logging every non-2xx response and failed request.
import { chromium } from "playwright";

const BASE = process.env.BASE_URL;
const EMAIL = process.env.EMAIL || "admin@brightfield-lekki.example.com";
const PASSWORD = process.env.PASSWORD || "School@2025";
const targets = (process.env.ROUTES || "").split(/[\s,]+/).filter(Boolean);

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();

page.on("response", async (r) => {
  if (r.status() >= 400) {
    let body = "";
    try { body = (await r.text()).slice(0, 200); } catch { /* stream gone */ }
    console.log(`HTTP ${r.status()} ${r.request().method()} ${r.url()}\n   ${body}`);
  }
});
page.on("requestfailed", (r) => {
  console.log(`FAILED ${r.method()} ${r.url()} - ${r.failure()?.errorText}`);
});

await page.goto(`${BASE}/accounts`, { waitUntil: "networkidle" });
await page.getByPlaceholder("Enter your email").fill(EMAIL);
await page.getByPlaceholder("Enter your password").fill(PASSWORD);
await page.getByRole("button", { name: "Login" }).click();
await page.waitForURL(
  (u) => !u.pathname.includes("/login") && !u.pathname.includes("/accounts"),
  { timeout: 20000 },
);
console.log("logged in");

for (const path of targets) {
  console.log(`\n=== ${path}`);
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
}
await browser.close();
