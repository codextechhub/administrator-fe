// Drive the overview rails: dot clicks, swipe, auto-advance, and the
// stop-on-engage rule. Asserts behaviour rather than screenshotting it.
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:5174";
const EMAIL = process.env.EMAIL || "admin@brightfield-lekki.example.com";
const PASSWORD = process.env.PASSWORD || "School@2025";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
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
await page.goto(`${BASE}/overview`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

const ok = [];
const bad = [];
const check = (name, pass, detail = "") =>
  (pass ? ok : bad).push(`${name}${detail ? ` - ${detail}` : ""}`);

const track = (label) => page.locator(`[aria-label="${label}"][aria-roledescription="carousel"]`);
const metrics = track("Platform overview metrics");
const spotlight = track("Workspace spotlight");

check("metric rail present", await metrics.count() === 1);
check("spotlight rail present", await spotlight.count() === 1);

const slideCount = await metrics.locator('[aria-roledescription="slide"]').count();
check("metric rail has all cards", slideCount === 6, `${slideCount} slides`);

const dots = page.locator('button[aria-label^="Go to slide"]');
const totalDots = await dots.count();
check("dots rendered for both rails", totalDots === 6 + 4, `${totalDots} dots`);

// --- dot click moves the rail and updates aria-current ---
const metricDots = metrics.locator("xpath=../div/button");
await metricDots.nth(3).click();
await page.waitForTimeout(700);
const left = await metrics.evaluate((el) => el.scrollLeft);
const width = await metrics.evaluate((el) => el.clientWidth);
check("dot click scrolls to that slide", Math.round(left / width) === 3, `index ${Math.round(left / width)}`);
const current = await metricDots.nth(3).getAttribute("aria-current");
check("active dot reflects position", current === "true", `aria-current=${current}`);

// --- programmatic swipe updates the active dot (scroll drives state) ---
await metrics.evaluate((el) => el.scrollTo({ left: el.clientWidth * 1, behavior: "instant" }));
await page.waitForTimeout(400);
const afterSwipe = await metricDots.nth(1).getAttribute("aria-current");
check("swipe updates the active dot", afterSwipe === "true", `aria-current=${afterSwipe}`);

// --- the metric rail must NEVER auto-advance: those are numbers being read ---
await metrics.evaluate((el) => el.scrollTo({ left: 0, behavior: "instant" }));
await page.waitForTimeout(8000);
const metricDrift = await metrics.evaluate((el) => el.scrollLeft);
check("metric rail never auto-advances", metricDrift === 0, `scrollLeft ${metricDrift}`);

// --- auto-advance on an untouched rail ---
const page2 = await ctx.newPage();
await page2.goto(`${BASE}/overview`, { waitUntil: "networkidle" });
await page2.waitForTimeout(1500);
const spot2 = page2.locator('[aria-label="Workspace spotlight"][aria-roledescription="carousel"]');
await spot2.scrollIntoViewIfNeeded();
const before = await spot2.evaluate((el) => el.scrollLeft);
await page2.waitForTimeout(7500); // autoAdvanceMs = 6000
const after = await spot2.evaluate((el) => el.scrollLeft);
check("untouched spotlight auto-advances", after > before, `${before} → ${after}`);

// --- and stops for good once the reader touches it ---
await spot2.evaluate((el) => el.scrollTo({ left: 0, behavior: "instant" }));
await spot2.dispatchEvent("pointerdown");
await page2.waitForTimeout(400);
const engagedAt = await spot2.evaluate((el) => el.scrollLeft);
await page2.waitForTimeout(8000);
const stillThere = await spot2.evaluate((el) => el.scrollLeft);
check("engaged spotlight stops advancing", stillThere === engagedAt, `${engagedAt} → ${stillThere}`);

console.log("PASS:");
ok.forEach((l) => console.log("  ✓", l));
if (bad.length) {
  console.log("FAIL:");
  bad.forEach((l) => console.log("  ✗", l));
}
console.log(`\nconsole errors (${errors.length})`);
errors.slice(0, 10).forEach((e) => console.log(" •", e.slice(0, 200)));
await browser.close();
process.exit(bad.length ? 1 : 0);
