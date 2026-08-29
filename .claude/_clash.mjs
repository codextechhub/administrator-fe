import { chromium } from "playwright";
import fs from "node:fs";
const OUT = "/tmp/verify-design/clash"; fs.mkdirSync(OUT, { recursive: true });
const BASE = "http://holy-cross.localhost:5199";
const b = await chromium.launch({ channel: "chrome", headless: true });
const page = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const errs = []; page.on("pageerror", e => errs.push(e.message));
const previews = []; page.on("request", r => { if (r.url().includes("/preview/")) previews.push(r.url().split("/v1/")[1]); });
await page.goto(`${BASE}/accounts`, { waitUntil: "networkidle" });
await page.getByPlaceholder("Enter your email").fill("admin@holy-cross.example.com");
await page.getByPlaceholder("Enter your password").fill("School@2025");
await page.getByRole("button", { name: "Login" }).click();
await page.waitForURL(u => !u.pathname.includes("/accounts"), { timeout: 20000 });
await page.goto(`${BASE}/timetables/classes`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);

// An empty cell in the grid.
const add = page.getByRole("button", { name: /^Fill / }).first();
await add.click();
await page.waitForTimeout(900);
const drawer = page.getByRole("dialog");
const save = drawer.getByRole("button", { name: /Add lesson|Save changes/ });
console.log("button before anything:", await save.isDisabled() ? "disabled" : "live");

console.log("drawer controls:", JSON.stringify(await drawer.evaluate(el => [...el.querySelectorAll("select,input,button")].map(n => n.tagName + ":" + (n.getAttribute("aria-label") || n.getAttribute("placeholder") || n.textContent?.trim().slice(0,18))).slice(0, 14))));
// SearchSelect is a combobox: type, then take the first suggestion.
const pick = async (placeholder, query) => {
  const box = drawer.getByPlaceholder(placeholder);
  if (!(await box.count())) { console.log(`no ${placeholder}`); return; }
  await box.click();
  await box.fill(query);
  await page.waitForTimeout(600);
  const option = page.locator('[role="option"]').first();
  if (await option.count()) { await option.click(); }
  else { await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter"); }
  await page.waitForTimeout(300);
};
await pick("Search subjects", "");
await page.waitForTimeout(400);
// A teacher who already teaches at this hour is the whole point.
await pick("Search teachers", "Ngozi");
await page.waitForTimeout(1400);
console.log("preview calls so far:", previews.length, previews.slice(-1));
const alert = drawer.getByRole("alert");
console.log("clash box:", await alert.count() ? (await alert.first().innerText()).replace(/\n/g, " | ") : "none");
console.log("button with an unacknowledged clash:", await save.isDisabled() ? "disabled" : "live");
await page.screenshot({ path: `${OUT}/1-clash.png` });
const box = drawer.getByRole("checkbox");
if (await box.count()) {
  await box.first().click();
  await page.waitForTimeout(500);
  console.log("button after ticking:", await save.isDisabled() ? "disabled" : "live");
  await page.screenshot({ path: `${OUT}/2-acknowledged.png` });
}
console.log("errors:", errs.length); errs.forEach(e => console.log(" -", e));
await b.close();
