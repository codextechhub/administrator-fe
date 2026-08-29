import { chromium } from "playwright";
const BASE = "http://localhost:5174";
const b = await chromium.launch({ channel: "chrome", headless: true });
const page = await (await b.newContext({ viewport: { width: 1200, height: 800 } })).newPage();
const errs = []; page.on("pageerror", e => errs.push(e.message));
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.getByPlaceholder("Enter your email").fill("admin@codexng.com");
await page.getByPlaceholder("Enter your password").fill("Admin@123456");
await page.getByRole("button", { name: /login|sign in/i }).first().click();
await page.waitForURL(u => !u.pathname.includes("/login"), { timeout: 25000 });

await page.setViewportSize({ width: 1200, height: 800 });
await page.goto(`${BASE}/users/cx`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
const box = await page.evaluate(() => {
  const main = document.querySelector("main.grid");
  const tc = document.querySelector('[data-slot="table-container"]');
  const r = (el) => { const b = el.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right), w: Math.round(b.width) }; };
  return {
    main: main ? r(main) : null,
    mainPadding: main ? getComputedStyle(main).paddingRight : null,
    tableContainer: tc ? r(tc) : null,
    tableParent: tc && tc.parentElement ? r(tc.parentElement) : null,
    parentCls: tc && tc.parentElement ? tc.parentElement.className.slice(0, 80) : null,
  };
});
console.log(JSON.stringify(box, null, 2));
await b.close();
