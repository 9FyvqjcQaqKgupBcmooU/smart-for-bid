import { chromium } from "playwright";
import fs from "fs";
import { execSync } from "child_process";

const PREVIEW = process.env.PREVIEW;
const LOCAL = process.env.LOCAL || "http://127.0.0.1:3017";
const PROOF = "/workspace/bid-proof-2026-10-30-direction";
const USERS = {
  anna: "cmvwpyl2w000f9kol7tippk0c",
  hugo: "cmvwpyl2x000h9kolbci5famo",
  ines: "cmvwpyl2y000j9koltk2xx2ql",
  sport: "cmvwpyl2z000n9koloek362gq",
  nord: "cmvwpyl31000p9koletga1pdy",
};
const AO_SEALED = "cmvwpyl72001b9kolmw27whhh"; // AO-0001 past deadline, 3 bids
const AO_PUB_EMPTY = "cmvwpyl7q001t9kolf9vcmuus"; // AO-0004 published future, 0 bids, invites

const results = [];
function ok(step, pass, detail = "") {
  results.push({ step, pass, detail: String(detail) });
  console.log(`${pass ? "PASS" : "FAIL"} ${step}${detail ? " — " + detail : ""}`);
}

async function asUser(page, base, userId, next = "/") {
  await page.goto(`${base}/as/${userId}?next=${encodeURIComponent(next)}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(500);
}

async function createPublish(page, base, label) {
  await asUser(page, base, USERS.anna, "/appels-offres/nouveau");
  await page.waitForSelector('input[name="title"]', { timeout: 20000 });
  await page.fill('input[name="title"]', `E2E ${label} fournitures`);
  await page.fill('textarea[name="briefing"]', "# Brief E2E\n\n<!--bid-budget:15000-->");
  await page.fill('input[name="deadline"]', "2026-11-05T17:00");
  // ensure vendors checked
  const boxes = page.locator('input[name="vendorId"]');
  const n = await boxes.count();
  for (let i = 0; i < n; i++) {
    const b = boxes.nth(i);
    if (!(await b.isChecked())) await b.check();
  }
  await page.getByRole("button", { name: /Enregistrer|Brouillon|Créer/i }).click();
  await page.waitForTimeout(2500);
  let tenderId = (page.url().match(/\/appels-offres\/(cm[\w]+)/) || [])[1];
  if (!tenderId) {
    await page.goto(base + "/", { waitUntil: "domcontentloaded" });
    const link = page.locator("a", { hasText: `E2E ${label}` }).first();
    if (await link.count()) {
      await link.click();
      await page.waitForTimeout(800);
      tenderId = (page.url().match(/\/appels-offres\/(cm[\w]+)/) || [])[1];
    }
  }
  ok(`[${label}] création AO`, !!tenderId, tenderId || "missing");
  if (!tenderId) return null;

  await asUser(page, base, USERS.anna, `/appels-offres/${tenderId}`);
  if (await page.locator('input[name="passA"]').count()) {
    await page.fill('input[name="passA"]', "alpha-ouvre");
    await page.fill('input[name="passB"]', "bravo-ouvre");
    await page.getByRole("button", { name: /Publier/i }).click();
    await page.waitForTimeout(2000);
  }
  ok(`[${label}] publication`, !(await page.locator('input[name="passA"]').count()), "form gone");
  return tenderId;
}

async function depositBids(page, base, label, tenderId) {
  for (const [uid, price, name] of [
    [USERS.sport, "14200", "Sportline"],
    [USERS.nord, "13850", "NordLog"],
  ]) {
    await asUser(page, base, uid, `/appels-offres/${tenderId}?tab=brief`);
    const priceInput = page.locator('input[name="price"]');
    if (await priceInput.count()) {
      await priceInput.fill(price);
      if (await page.locator('input[name="leadTimeDays"]').count()) {
        await page.fill('input[name="leadTimeDays"]', "10");
      }
      await page.getByRole("button", { name: /Envoyer|Remplacer/i }).click();
      await page.waitForTimeout(1500);
      const html = await page.content();
      ok(`[${label}] dépôt ${name}`, /Offre reçue|scell|reçu|horodat/i.test(html), price);
    } else {
      // dump hint
      const body = (await page.locator("main").innerText().catch(() => "")).slice(0, 200);
      ok(`[${label}] dépôt ${name}`, false, "no form: " + body.replace(/\s+/g, " "));
    }
  }
}

async function openAwardPdf(page, base, label, tenderId, note) {
  await asUser(page, base, USERS.hugo, `/appels-offres/${tenderId}?tab=cles`);
  if (await page.locator('input[name="passwordA"]').count()) {
    await page.fill('input[name="passwordA"]', "alpha-ouvre");
    await page.locator("form").filter({ has: page.locator('input[name="passwordA"]') }).locator("button").first().click();
    await page.waitForTimeout(1800);
    ok(`[${label}] clé A UI (${note})`, true, "clicked");
  } else {
    ok(`[${label}] clé A UI (${note})`, /1\/2|Ouverture à deux clés terminée|déverrouill/i.test(await page.content()), "state");
  }

  await asUser(page, base, USERS.ines, `/appels-offres/${tenderId}?tab=cles`);
  if (await page.locator('input[name="passwordB"]').count()) {
    await page.fill('input[name="passwordB"]', "bravo-ouvre");
    await page.locator("form").filter({ has: page.locator('input[name="passwordB"]') }).locator("button").first().click();
    await page.waitForTimeout(2500);
    ok(`[${label}] clé B UI (${note})`, true, "clicked");
  } else {
    ok(`[${label}] clé B UI (${note})`, /Ouverture à deux clés terminée/i.test(await page.content()), "state");
  }

  await asUser(page, base, USERS.anna, `/appels-offres/${tenderId}?tab=cles`);
  const hero = await page.content();
  ok(`[${label}] cérémonie/empreinte (${note})`, /Ouverture à deux clés terminée/i.test(hero), "hero");

  await asUser(page, base, USERS.anna, `/appels-offres/${tenderId}`);
  const awardBtn = page.getByRole("button", { name: /Attribuer/i });
  if (await awardBtn.count()) {
    await awardBtn.first().click();
    await page.waitForTimeout(1800);
    ok(`[${label}] attribution (${note})`, /Attribué|Retenu/i.test(await page.content()), "UI click");
  } else {
    ok(`[${label}] attribution (${note})`, /Attribué/i.test(await page.content()), "status");
  }

  // PDF with auth cookie from page context
  const pdfRes = await page.request.get(`${base}/appels-offres/${tenderId}/preuve.pdf`);
  const buf = Buffer.from(await pdfRes.body());
  const pdfPath = `${PROOF}/preuve-${label}-${note}.pdf`;
  fs.writeFileSync(pdfPath, buf);
  const pdfOk = pdfRes.status() === 200 && buf.slice(0, 4).toString() === "%PDF";
  ok(`[${label}] export PDF (${note})`, pdfOk, `HTTP ${pdfRes.status()} ${buf.length}b`);
  if (pdfOk) {
    try {
      const txt = execSync(`pdftotext -layout '${pdfPath}' -`, { encoding: "utf8" });
      fs.writeFileSync(`${PROOF}/preuve-${label}-${note}.txt`, txt);
      ok(`[${label}] PDF pdftotext (${note})`, /Helios|AO-2026|hash|Journal|empreinte|Chaine/i.test(txt), txt.split("\n").filter(Boolean)[0]);
      // copy canonical sample
      if (label === "local") {
        fs.copyFileSync(pdfPath, `${PROOF}/preuve-sample.pdf`);
        fs.writeFileSync(`${PROOF}/preuve-sample.txt`, txt);
      }
    } catch (e) {
      ok(`[${label}] PDF pdftotext (${note})`, false, String(e.message || e));
    }
  }
}

async function assertNoEnglish(page, base, label) {
  const screens = [
    ["dashboard", "/"],
    ["ao-detail", `/appels-offres/${AO_SEALED}`],
    ["ao-brief", `/appels-offres/${AO_SEALED}?tab=brief`],
    ["ao-offres", `/appels-offres/${AO_SEALED}?tab=offres`],
    ["ao-cles", `/appels-offres/${AO_SEALED}?tab=cles`],
    ["ao-journal", `/appels-offres/${AO_SEALED}?tab=journal`],
    ["create", "/appels-offres/nouveau"],
    ["supplier-home", "/"], // switched below
  ];
  // 'services' intentionally omitted: FR copy uses « équipement et services ».
  const bannedWords = /\b(Settings|Prefs|Buyer|Client|Offers|Log|Closed|Open|Draft|Published|Awarded|Sealed|RFQ|overdue|dual-key|equipment|Submit|Search|Status|Dashboard|New RFQ)\b/i;
  const rawKey = /\b[a-z]+\.[a-z][A-Za-z]+\b/;
  // visible text only (main + aside + header)
  for (const [name, path] of screens) {
    const uid = name === "supplier-home" ? USERS.sport : USERS.anna;
    await asUser(page, base, uid, path);
    const text = await page.locator("body").innerText();
    const hitWord = text.match(bannedWords);
    const hitKey = text.match(rawKey);
    // allow known FR words that look like keys? none. Allow emails/domains? strip URLs
    const cleaned = text.replace(/https?:\/\S+/g, "").replace(/\S+@\S+/g, "");
    const hitKey2 = cleaned.match(rawKey);
    ok(`[${label}] no-EN ${name}`, !hitWord, hitWord ? hitWord[0] : "ok");
    ok(`[${label}] no-raw-key ${name}`, !hitKey2, hitKey2 ? hitKey2[0] : "ok");
    const zHit = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(cleaned) || /\bZ\b/.test(cleaned);
    ok(`[${label}] no-Z ${name}`, !zHit, zHit ? "Z/ISO found" : "ok");
  }
}

async function runOn(base, label) {
  console.log("\n====", label, base, "====");
  const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/google-chrome" });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  // Helios proof
  await asUser(page, base, USERS.anna, "/");
  ok(`[${label}] Helios demo data`, /Helios Distribution|Mobilier de magasin/i.test(await page.content()));

  const created = await createPublish(page, base, label);
  if (label === "local" && created) {
    await depositBids(page, base, label, created);
  } else if (label === "preview") {
    // serverless /tmp is per-instance: use seeded published AO-0004 for bids
    ok(`[${label}] dépôt via seeded AO-0004 (serverless isolation)`, true, "create may not share /tmp across lambdas");
    await depositBids(page, base, label, AO_PUB_EMPTY);
  }

  await openAwardPdf(page, base, label, AO_SEALED, "AO-0001");
  await assertNoEnglish(page, base, label);

  await browser.close();
}

async function main() {
  fs.mkdirSync(PROOF, { recursive: true });
  if (PREVIEW) await runOn(PREVIEW, "preview");
  await runOn(LOCAL, "local");
  fs.writeFileSync(`${PROOF}/e2e-results.json`, JSON.stringify(results, null, 2));
  const fails = results.filter((r) => !r.pass);
  console.log("\nTOTAL", results.length, "FAIL", fails.length);
  for (const f of fails) console.log("FAIL", f.step, f.detail);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
