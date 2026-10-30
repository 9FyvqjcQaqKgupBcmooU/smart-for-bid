import { chromium } from "playwright";
import path from "path";

const PROOF = "/workspace/bid-proof-2026-10-30-direction";
const PREVIEW = process.env.PREVIEW;
const PROD = process.env.PROD;

async function shot(page, name, w, h) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(700);
  const file = path.join(PROOF, `${name}-${w === 1440 ? "1440" : "390"}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log("shot", file);
}

async function openDrawer(page) {
  const candidates = [
    page.getByRole("button", { name: /menu|ouvrir/i }),
    page.locator("header button").first(),
  ];
  for (const c of candidates) {
    if (await c.count()) {
      try {
        await c.first().click({ timeout: 2000 });
        await page.waitForTimeout(400);
        return;
      } catch {}
    }
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  });
  const page = await browser.newPage();

  await page.goto(PROD + "/", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(1000);
  await shot(page, "before-buyer-dashboard", 1440, 900);
  await shot(page, "before-buyer-dashboard", 390, 844);

  const prodAo = page.locator('a[href*="/appels-offres/"]').first();
  if (await prodAo.count()) {
    await prodAo.click();
    await page.waitForTimeout(1200);
  }
  await shot(page, "before-ao-detail", 1440, 900);
  await shot(page, "before-ao-detail", 390, 844);

  await page.goto(PREVIEW + "/", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(1200);
  await shot(page, "after-buyer-dashboard", 1440, 900);
  await shot(page, "after-buyer-dashboard", 390, 844);

  await page.setViewportSize({ width: 390, height: 844 });
  await openDrawer(page);
  await page.screenshot({ path: path.join(PROOF, "after-sidebar-drawer-390.png") });
  console.log("drawer");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(PREVIEW + "/", { waitUntil: "domcontentloaded" });
  await page.locator("a", { hasText: "AO-2026-0001" }).first().click();
  await page.waitForTimeout(1000);
  await shot(page, "after-ao-detail", 1440, 900);
  await shot(page, "after-ao-detail", 390, 844);

  const base = page.url().split("?")[0];
  await page.goto(base + "?tab=historique", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await shot(page, "after-ao-journal", 1440, 900);
  await shot(page, "after-ao-journal", 390, 844);

  await page.goto(PREVIEW + "/", { waitUntil: "domcontentloaded" });
  await page.locator("a", { hasText: "AO-2026-0005" }).first().click();
  await page.waitForTimeout(800);
  await page.goto(page.url().split("?")[0] + "?tab=cles", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await shot(page, "after-opening", 1440, 900);
  await shot(page, "after-opening", 390, 844);

  // supplier: switch user
  await page.goto(PREVIEW + "/", { waitUntil: "domcontentloaded" });
  const select = page.locator("select").first();
  if (await select.count()) {
    const options = await select.locator("option").all();
    for (const opt of options) {
      const text = await opt.textContent();
      if (/Sportline|NordLog|Lumen/i.test(text || "")) {
        await select.selectOption({ label: text.trim() });
        await page.waitForTimeout(1500);
        break;
      }
    }
  }
  await shot(page, "after-supplier-home", 1440, 900);
  await shot(page, "after-supplier-home", 390, 844);

  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
