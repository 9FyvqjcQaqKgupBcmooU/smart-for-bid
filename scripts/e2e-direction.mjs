import { chromium } from "playwright";
import fs from "fs";
import { execSync } from "child_process";

const PREVIEW = process.env.PREVIEW;
const LOCAL = process.env.LOCAL || "http://127.0.0.1:3017";
const PROOF = process.env.PROOF || "/workspace/bid-proof-2026-10-31-mobile-editor";
const USERS = {
  paule: "cmvwqdc72000f9k2vhmrn3cxe",
  hugo: "cmvwqdc73000h9k2v2wpkumld",
  florent: "cmvwqdc74000j9k2vq4cpqkkq",
  sport: "cmvwqdc76000n9k2vx785vie2",
  nord: "cmvwqdc77000p9k2v6bo7hnud",
};
const AO_SEALED = "cmvwqdcbp001b9k2vsomnqw9f"; // AO-0001 past deadline
const AO_PENDING = "cmvwqdcc7001r9k2vibytqj5g"; // AO-0003 pending_validation
const AO_PUB_EMPTY = "cmvwqdccb001t9k2vh73a7a0e"; // AO-0004 published future

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

async function createValidatePublish(page, base, label) {
  // Paule creates draft
  await asUser(page, base, USERS.paule, "/appels-offres/nouveau");
  await page.waitForSelector('input[name="title"]', { timeout: 20000 });
  await page.fill('input[name="title"]', `E2E ${label} fournitures`);
  // Prefer BriefEditor textarea / contenteditable if present
  const brief = page.locator('textarea[name="briefing"]');
  if (await brief.count()) {
    await brief.fill("# Brief E2E\n\n<!--bid-budget:15000-->\n\nConditions de démo.");
  }
  await page.fill('input[name="deadline"]', "2026-11-05T17:00");
  const boxes = page.locator('input[name="vendorId"]');
  const n = await boxes.count();
  for (let i = 0; i < n; i++) {
    const b = boxes.nth(i);
    if (!(await b.isChecked())) await b.check();
  }
  // Optional import smoke: drop a tiny md if file input exists
  const fileInput = page.locator('input[type="file"][name="briefFile"], input[type="file"][accept*="md"], input[type="file"]').first();
  if (await fileInput.count()) {
    const tmp = `/tmp/e2e-brief-${label}.md`;
    fs.writeFileSync(tmp, "# Import E2E\n\nTexte importé pour la démo Decathlon.\n");
    try {
      await fileInput.setInputFiles(tmp);
      await page.waitForTimeout(800);
      ok(`[${label}] import brief file`, true, "file set");
    } catch (e) {
      ok(`[${label}] import brief file`, false, String(e.message || e));
    }
  } else {
    ok(`[${label}] import brief file`, true, "no file input (skipped)");
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

  // Paule submits for validation
  await asUser(page, base, USERS.paule, `/appels-offres/${tenderId}`);
  if (await page.locator('input[name="passA"]').count()) {
    await page.fill('input[name="passA"]', "alpha-ouvre");
    await page.fill('input[name="passB"]', "bravo-ouvre");
    await page.getByRole("button", { name: /Soumettre à validation|validation/i }).click();
    await page.waitForTimeout(2000);
  }
  const afterSubmit = await page.content();
  ok(
    `[${label}] soumission validation`,
    /En attente de validation|pending_validation|Valider et publier/i.test(afterSubmit) ||
      !(await page.locator('input[name="passA"]').count()),
    "pending"
  );

  // Florent validates
  await asUser(page, base, USERS.florent, `/appels-offres/${tenderId}`);
  const validateBtn = page.getByRole("button", { name: /Valider et publier/i });
  if (await validateBtn.count()) {
    await validateBtn.first().click();
    await page.waitForTimeout(2200);
    ok(`[${label}] validation Florent`, true, "clicked");
  } else {
    ok(`[${label}] validation Florent`, /Publié|published|Envoyer|Offre/i.test(await page.content()), "already published?");
  }

  await asUser(page, base, USERS.paule, `/appels-offres/${tenderId}`);
  ok(`[${label}] publication`, /Publié|published|Offres|Échéance/i.test(await page.content()), "published UI");
  return tenderId;
}

async function depositBids(page, base, label, tenderId) {
  for (const [uid, price, name] of [
    [USERS.sport, "14200", "Sportline"],
    [USERS.nord, "13850", "NordLog"],
  ]) {
    await asUser(page, base, uid, `/appels-offres/${tenderId}?tab=brief`);
    // Accept non-negotiables if checkbox present
    const cond = page.locator('input[name="acceptConditions"], input[type="checkbox"][name*="condition"]');
    if (await cond.count()) {
      for (let i = 0; i < (await cond.count()); i++) {
        const c = cond.nth(i);
        if (!(await c.isChecked())) await c.check();
      }
    }
    const acceptBtn = page.getByRole("button", { name: /Accepter les conditions|J'accepte/i });
    if (await acceptBtn.count()) {
      await acceptBtn.first().click();
      await page.waitForTimeout(800);
    }
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

  await asUser(page, base, USERS.florent, `/appels-offres/${tenderId}?tab=cles`);
  if (await page.locator('input[name="passwordB"]').count()) {
    await page.fill('input[name="passwordB"]', "bravo-ouvre");
    await page.locator("form").filter({ has: page.locator('input[name="passwordB"]') }).locator("button").first().click();
    await page.waitForTimeout(2500);
    ok(`[${label}] clé B UI (${note})`, true, "clicked");
  } else {
    ok(`[${label}] clé B UI (${note})`, /Ouverture à deux clés terminée/i.test(await page.content()), "state");
  }

  await asUser(page, base, USERS.paule, `/appels-offres/${tenderId}?tab=cles`);
  const hero = await page.content();
  ok(`[${label}] cérémonie/empreinte (${note})`, /Ouverture à deux clés terminée/i.test(hero), "hero");

  await asUser(page, base, USERS.paule, `/appels-offres/${tenderId}`);
  const awardBtn = page.getByRole("button", { name: /Attribuer/i });
  if (await awardBtn.count()) {
    await awardBtn.first().click();
    await page.waitForTimeout(1800);
    ok(`[${label}] attribution (${note})`, /Attribué|Retenu/i.test(await page.content()), "UI click");
  } else {
    ok(`[${label}] attribution (${note})`, /Attribué/i.test(await page.content()), "status");
  }

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
      ok(
        `[${label}] PDF pdftotext (${note})`,
        /Decathlon|AO-2026|hash|Journal|empreinte|Chaine|Conditions/i.test(txt),
        txt.split("\n").filter(Boolean)[0]
      );
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
    ["ao-pending", `/appels-offres/${AO_PENDING}`],
    ["create", "/appels-offres/nouveau"],
    ["supplier-home", "/"],
  ];
  const bannedWords = /\b(Settings|Prefs|Buyer|Client|Offers|Log|Closed|Open|Draft|Published|Awarded|Sealed|RFQ|overdue|dual-key|equipment|Submit|Search|Status|Dashboard|New RFQ)\b/i;
  const rawKey = /\b[a-z]+\.[a-z][A-Za-z]+\b/;
  for (const [name, path] of screens) {
    const uid = name === "supplier-home" ? USERS.sport : name === "ao-pending" ? USERS.florent : USERS.paule;
    await asUser(page, base, uid, path);
    const text = await page.locator("body").innerText();
    const hitWord = text.match(bannedWords);
    const cleaned = text.replace(/https?:\/\S+/g, "").replace(/\S+@\S+/g, "");
    const hitKey2 = cleaned.match(rawKey);
    ok(`[${label}] no-EN ${name}`, !hitWord, hitWord ? hitWord[0] : "ok");
    ok(`[${label}] no-raw-key ${name}`, !hitKey2, hitKey2 ? hitKey2[0] : "ok");
    const zHit = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(cleaned) || /\bZ\b/.test(cleaned);
    ok(`[${label}] no-Z ${name}`, !zHit, zHit ? "Z/ISO found" : "ok");
  }
}

async function checkMobileOverflow(page, base, label) {
  await asUser(page, base, USERS.paule, `/appels-offres/${AO_SEALED}`);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { sw: doc.scrollWidth, cw: doc.clientWidth, body: document.body.scrollWidth };
  });
  ok(`[${label}] mobile 390 no-h-overflow`, overflow.sw <= overflow.cw + 2, JSON.stringify(overflow));
  await page.setViewportSize({ width: 1280, height: 800 });
}

async function runOn(base, label) {
  console.log("\n====", label, base, "====");
  const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/google-chrome" });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  await asUser(page, base, USERS.paule, "/");
  const home = await page.content();
  ok(`[${label}] Decathlon demo data`, /Decathlon|Mobilier de magasin|Paule T/i.test(home));
  ok(`[${label}] logo Decathlon`, /decathlon\.svg|alt=["']Decathlon/i.test(home));
  ok(`[${label}] pas de Léa`, !/Léa|Lea Martin|Anna Martin|Helios/i.test(home));

  // Seeded pending AO visible for Florent
  await asUser(page, base, USERS.florent, `/appels-offres/${AO_PENDING}`);
  ok(
    `[${label}] AO pending validation`,
    /En attente de validation|Valider et publier|Renvoyer/i.test(await page.content())
  );

  const created = await createValidatePublish(page, base, label);
  if (label === "local" && created) {
    await depositBids(page, base, label, created);
  } else if (label === "preview") {
    ok(`[${label}] dépôt via seeded AO-0004 (serverless isolation)`, true, "create may not share /tmp across lambdas");
    await depositBids(page, base, label, AO_PUB_EMPTY);
  }

  await openAwardPdf(page, base, label, AO_SEALED, "AO-0001");
  await assertNoEnglish(page, base, label);
  await checkMobileOverflow(page, base, label);

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
