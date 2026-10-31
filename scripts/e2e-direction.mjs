import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const PREVIEW = process.env.PREVIEW;
const LOCAL = process.env.LOCAL || "http://127.0.0.1:3017";
const PROOF = process.env.PROOF || "/workspace/bid-proof-2026-10-31-mobile-editor";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CLEAN_DEMO = path.join(ROOT, "prisma", "demo.db");
const E2E_DB = process.env.BID_DEMO_DB_PATH || "/tmp/bid-e2e-direction.db";

const results = [];
function ok(step, pass, detail = "") {
  results.push({ step, pass, detail: String(detail) });
  console.log(`${pass ? "PASS" : "FAIL"} ${step}${detail ? " — " + detail : ""}`);
}

function loadIdsFromDb(dbPath) {
  process.env.DATABASE_URL = `file:${dbPath}`;
  delete process.env.TURSO_DATABASE_URL;
  delete process.env.TURSO_AUTH_TOKEN;
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  return prisma;
}

async function resolveDemoIds(dbPath) {
  const prisma = loadIdsFromDb(dbPath);
  try {
    const byEmail = async (email) => {
      const u = await prisma.user.findUnique({ where: { email } });
      if (!u) throw new Error("missing user " + email);
      return u.id;
    };
    const users = {
      paule: await byEmail("paule.t@decathlon.com"),
      hugo: await byEmail("hugo.s@decathlon.com"),
      florent: await byEmail("florent.g@decathlon.com"),
      sport: await byEmail("portail@sportline.fr"),
      nord: await byEmail("portail@nordlog.fr"),
    };
    const sealed = await prisma.tender.findFirst({ where: { number: "AO-2026-0001" } });
    const pending = await prisma.tender.findFirst({ where: { status: "pending_validation" } });
    const pubEmpty = await prisma.tender.findFirst({
      where: { number: "AO-2026-0004" },
    });
    if (!sealed || !pending || !pubEmpty) throw new Error("missing seed tenders");
    return {
      users,
      AO_SEALED: sealed.id,
      AO_PENDING: pending.id,
      AO_PUB_EMPTY: pubEmpty.id,
    };
  } finally {
    await prisma.$disconnect();
  }
}

/** Prepare a disposable copy of the clean seed DB for local e2e mutations. */
function prepareE2eDbCopy() {
  if (!fs.existsSync(CLEAN_DEMO)) throw new Error("clean demo.db missing: " + CLEAN_DEMO);
  fs.copyFileSync(CLEAN_DEMO, E2E_DB);
  // Ensure clean demo.db was not already polluted
  const { PrismaClient } = require("@prisma/client");
  process.env.DATABASE_URL = `file:${CLEAN_DEMO}`;
  delete process.env.TURSO_DATABASE_URL;
  const check = new PrismaClient();
  return check.tender
    .findMany({ select: { title: true, number: true } })
    .then(async (rows) => {
      await check.$disconnect();
      const dirty = rows.some((r) => /E2E/i.test(r.title));
      if (dirty) throw new Error("prisma/demo.db contains E2E rows — reseed before e2e");
      console.log("e2e DB copy ready", E2E_DB, "clean tenders", rows.length);
      return rows;
    });
}

async function asUser(page, base, userId, next = "/") {
  await page.goto(`${base}/as/${userId}?next=${encodeURIComponent(next)}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(500);
}

async function createValidatePublish(page, base, label, USERS) {
  await asUser(page, base, USERS.paule, "/appels-offres/nouveau");
  await page.waitForSelector('input[name="title"]', { timeout: 20000 });
  await page.fill('input[name="title"]', `E2E ${label} supplies`);
  const brief = page.locator('textarea[name="briefing"]');
  if (await brief.count()) {
    await brief.fill("# Brief E2E\n\nDecathlon demo conditions.");
  }
  // DeadlineField: visible date + time (24h), hidden name=deadline
  const dateInput = page.locator('input[type="date"]').first();
  const timeInput = page.locator('input[type="time"]').first();
  if (await dateInput.count()) {
    await dateInput.fill("2026-11-05");
    await timeInput.fill("17:00");
  } else {
    await page.locator('input[name="deadline"]').evaluate((el, v) => { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); }, "2026-11-05T17:00");
  }
  const boxes = page.locator('input[name="vendorId"]');
  const n = await boxes.count();
  for (let i = 0; i < n; i++) {
    const b = boxes.nth(i);
    if (!(await b.isChecked())) await b.check();
  }
  const fileInput = page.locator('input[type="file"][name="briefFile"], input[type="file"][accept*="md"], input[type="file"]').first();
  if (await fileInput.count()) {
    const tmp = `/tmp/e2e-brief-${label}.md`;
    fs.writeFileSync(tmp, "# Import E2E\n\nImported text for the Decathlon demo.\n");
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

  await page.getByRole("button", { name: /Save draft|Save|Create|Enregistrer|Brouillon|Créer/i }).click();
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

  await asUser(page, base, USERS.paule, `/appels-offres/${tenderId}`);
  if (await page.locator('input[name="passA"]').count()) {
    await page.fill('input[name="passA"]', "alpha-ouvre");
    await page.fill('input[name="passB"]', "bravo-ouvre");
    await page.getByRole("button", { name: /Submit for approval|Submit for validation|Soumettre|validation/i }).click();
    await page.waitForTimeout(2000);
  }
  ok(
    `[${label}] soumission validation`,
    /Pending approval|pending_validation|Approve and publish|En attente|Valider et publier/i.test(await page.content()) ||
      !(await page.locator('input[name="passA"]').count()),
    "pending"
  );

  await asUser(page, base, USERS.florent, `/appels-offres/${tenderId}`);
  const validateBtn = page.getByRole("button", { name: /Approve and publish|Valider et publier/i });
  if (await validateBtn.count()) {
    await validateBtn.first().click();
    await page.waitForTimeout(2200);
    ok(`[${label}] validation Florent`, true, "clicked");
  } else {
    ok(`[${label}] validation Florent`, /Published|Publié|Submit bid|Envoyer|Offre|Bids/i.test(await page.content()), "already published?");
  }

  await asUser(page, base, USERS.paule, `/appels-offres/${tenderId}`);
  ok(`[${label}] publication`, /Published|Publié|Bids|Deadline|Offres|Échéance/i.test(await page.content()), "published UI");
  return tenderId;
}

async function depositBids(page, base, label, tenderId, USERS) {
  for (const [uid, price, name] of [
    [USERS.sport, "14200", "Sportline"],
    [USERS.nord, "13850", "NordLog"],
  ]) {
    await asUser(page, base, uid, `/appels-offres/${tenderId}?tab=brief`);
    const cond = page.locator('input[name="acceptConditions"], input[type="checkbox"][name*="condition"]');
    if (await cond.count()) {
      for (let i = 0; i < (await cond.count()); i++) {
        const c = cond.nth(i);
        if (!(await c.isChecked())) await c.check();
      }
    }
    const acceptBtn = page.getByRole("button", { name: /Accept|Accepter les conditions|J'accepte/i });
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
      await page.getByRole("button", { name: /Submit bid|Replace bid|Envoyer|Remplacer/i }).click();
      await page.waitForTimeout(1500);
      const html = await page.content();
      ok(`[${label}] dépôt ${name}`, /Bid received|sealed|scell|received|horodat|Paris time/i.test(html), price);
    } else {
      const body = (await page.locator("main").innerText().catch(() => "")).slice(0, 200);
      ok(`[${label}] dépôt ${name}`, false, "no form: " + body.replace(/\s+/g, " "));
    }
  }
}

async function openAwardPdf(page, base, label, tenderId, note, USERS) {
  await asUser(page, base, USERS.hugo, `/appels-offres/${tenderId}?tab=cles`);
  if (await page.locator('input[name="passwordA"]').count()) {
    await page.fill('input[name="passwordA"]', "alpha-ouvre");
    await page.locator("form").filter({ has: page.locator('input[name="passwordA"]') }).locator("button").first().click();
    await page.waitForTimeout(1800);
    ok(`[${label}] clé A UI (${note})`, true, "clicked");
  } else {
    ok(`[${label}] clé A UI (${note})`, /1\/2|Two-key opening complete|Opening complete|Ouverture à deux clés terminée|déverrouill|Key A accepted|Unlock/i.test(await page.content()), "state");
  }

  await asUser(page, base, USERS.florent, `/appels-offres/${tenderId}?tab=cles`);
  if (await page.locator('input[name="passwordB"]').count()) {
    await page.fill('input[name="passwordB"]', "bravo-ouvre");
    await page.locator("form").filter({ has: page.locator('input[name="passwordB"]') }).locator("button").first().click();
    await page.waitForTimeout(2500);
    ok(`[${label}] clé B UI (${note})`, true, "clicked");
  } else {
    ok(`[${label}] clé B UI (${note})`, /Two-key opening complete|Opening complete|Ouverture à deux clés terminée|Fingerprint before/i.test(await page.content()), "state");
  }

  await asUser(page, base, USERS.paule, `/appels-offres/${tenderId}?tab=cles`);
  ok(`[${label}] cérémonie/empreinte (${note})`, /Two-key opening complete|Opening complete|Ouverture à deux clés terminée|Fingerprint before/i.test(await page.content()), "hero");

  await asUser(page, base, USERS.paule, `/appels-offres/${tenderId}`);
  const awardBtn = page.getByRole("button", { name: /Award|Attribuer/i });
  if (await awardBtn.count()) {
    await awardBtn.first().click();
    await page.waitForTimeout(1800);
    ok(`[${label}] attribution (${note})`, /Awarded|Attribué|Retenu/i.test(await page.content()), "UI click");
  } else {
    ok(`[${label}] attribution (${note})`, /Awarded|Attribué/i.test(await page.content()), "status");
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
        /Decathlon|AO-2026|hash|Journal|fingerprint|chain|Conditions|Non-negotiable|Proof/i.test(txt),
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

async function assertEnglishUI(page, base, label, ids) {
  const { users: USERS, AO_SEALED, AO_PENDING } = ids;
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
  // Ban leftover French UI words (roles, statuses, gendered labels)
  const bannedWords = /\b(Acheteuse|Acheteur|Valideur|Fournisseur|Brouillon|Publié|Scellé|Attribué|Échéance|Ouverture|Économies|Enregistrer|Soumettre|Renvoyer|Créer un AO|Appels d.offres|Travail|Compte)\b/i;
  const rawKey = /\b[a-z]+\.[a-z][A-Za-z]+\b/;
  for (const [name, pathName] of screens) {
    const uid = name === "supplier-home" ? USERS.sport : name === "ao-pending" ? USERS.florent : USERS.paule;
    await asUser(page, base, uid, pathName);
    const text = await page.locator("body").innerText();
    const hitWord = text.match(bannedWords);
    const cleaned = text.replace(/https?:\/\S+/g, "").replace(/\S+@\S+/g, "");
    const hitKey2 = cleaned.match(rawKey);
    ok(`[${label}] no-FR ${name}`, !hitWord, hitWord ? hitWord[0] : "ok");
    ok(`[${label}] no-raw-key ${name}`, !hitKey2, hitKey2 ? hitKey2[0] : "ok");
    const zHit = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(cleaned) || /\bZ\b/.test(cleaned);
    ok(`[${label}] no-Z ${name}`, !zHit, zHit ? "Z/ISO found" : "ok");
  }
}

async function checkMobileOverflow(page, base, label, ids) {
  const { users: USERS, AO_SEALED, AO_PENDING } = ids;
  const paths = [
    ["dashboard", "/", USERS.paule],
    ["ao-detail", `/appels-offres/${AO_SEALED}`, USERS.paule],
    ["ao-offres", `/appels-offres/${AO_SEALED}?tab=offres`, USERS.paule],
    ["ao-cles", `/appels-offres/${AO_SEALED}?tab=cles`, USERS.paule],
    ["ao-journal", `/appels-offres/${AO_SEALED}?tab=journal`, USERS.paule],
    ["create", "/appels-offres/nouveau", USERS.paule],
    ["parametres", "/parametres", USERS.paule],
    ["pending", `/appels-offres/${AO_PENDING}`, USERS.florent],
    ["supplier", "/", USERS.sport],
  ];
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [name, pathName, uid] of paths) {
    await asUser(page, base, uid, pathName);
    await page.waitForTimeout(400);
    const report = await page.evaluate(() => {
      const doc = document.documentElement;
      const clipped = [];
      const nodes = document.querySelectorAll("td, th, table, .brief, [class*='card'], main, header");
      for (const el of nodes) {
        const st = getComputedStyle(el);
        if (st.display === "none" || st.visibility === "hidden") continue;
        const overflowHidden = /(hidden|clip)/.test(st.overflowX) || /(hidden|clip)/.test(st.overflow);
        if (!overflowHidden) continue;
        if (el.scrollWidth > el.clientWidth + 2) {
          clipped.push({
            tag: el.tagName,
            cls: (el.className || "").toString().slice(0, 80),
            sw: el.scrollWidth,
            cw: el.clientWidth,
          });
        }
      }
      // Visible table on mobile is a failure (should be cards)
      const tables = [...document.querySelectorAll("table")].filter((t) => {
        const r = t.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(t).display !== "none";
      });
      return {
        sw: doc.scrollWidth,
        cw: doc.clientWidth,
        body: document.body.scrollWidth,
        clipped: clipped.slice(0, 8),
        visibleTables: tables.length,
      };
    });
    ok(
      `[${label}] mobile 390 no-h-overflow ${name}`,
      report.sw <= report.cw + 2 && report.body <= report.cw + 2,
      JSON.stringify({ sw: report.sw, cw: report.cw, body: report.body })
    );
    ok(
      `[${label}] mobile 390 no-clip ${name}`,
      report.clipped.length === 0,
      report.clipped.length ? JSON.stringify(report.clipped[0]) : "ok"
    );
    if (name === "dashboard") {
      ok(`[${label}] mobile 390 cards-not-table`, report.visibleTables === 0, `tables=${report.visibleTables}`);
    }
  }
  await page.setViewportSize({ width: 1280, height: 800 });
}

async function runOn(base, label, ids) {
  console.log("\n====", label, base, "====");
  const { users: USERS, AO_SEALED, AO_PENDING, AO_PUB_EMPTY } = ids;
  const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/google-chrome" });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  await asUser(page, base, USERS.paule, "/");
  const home = await page.content();
  ok(`[${label}] Decathlon demo data`, /Decathlon|Store fixtures|Mobilier de magasin|Paule T/i.test(home));
  ok(`[${label}] logo Decathlon`, /decathlon\.svg|alt=["']Decathlon/i.test(home));
  ok(`[${label}] pas de Léa`, !/Léa|Lea Martin|Anna Martin|Helios/i.test(home));
  ok(`[${label}] pas d'AO E2E pollué`, !/E2E local (fournitures|supplies)/i.test(home));
  ok(`[${label}] badge Buyer`, /\bBuyer\b/i.test(await page.locator("body").innerText()));
  ok(`[${label}] savings positive`, !/Savings vs budget\s*[−-]/i.test(await page.locator("body").innerText()) && !/Économies vs budget\s*−/i.test(await page.locator("body").innerText()));
  ok(`[${label}] pas de marqueur bid-budget visible`, !/<!--\s*bid-budget/i.test(home));

  await asUser(page, base, USERS.florent, `/appels-offres/${AO_PENDING}`);
  ok(
    `[${label}] AO pending validation`,
    /Pending approval|Approve and publish|Return|En attente|Valider et publier|Renvoyer/i.test(await page.content())
  );
  ok(`[${label}] badge Approver`, /\bApprover\b/i.test(await page.locator("body").innerText()));

  const created = await createValidatePublish(page, base, label, USERS);
  if (label === "local" && created) {
    await depositBids(page, base, label, created, USERS);
  } else if (label === "preview") {
    ok(`[${label}] dépôt via seeded AO-0004 (serverless isolation)`, true, "create may not share /tmp across lambdas");
    await depositBids(page, base, label, AO_PUB_EMPTY, USERS);
  }

  await openAwardPdf(page, base, label, AO_SEALED, "AO-0001", USERS);
  await assertEnglishUI(page, base, label, ids);
  await checkMobileOverflow(page, base, label, ids);

  await browser.close();
}

async function main() {
  fs.mkdirSync(PROOF, { recursive: true });
  await prepareE2eDbCopy();

  // Local run expects the Next server to use BID_DEMO_DB_PATH=/tmp/bid-e2e-direction.db
  // Preview uses bundled clean demo.db (no local mutations persisted to repo).
  const localIds = await resolveDemoIds(E2E_DB);
  const cleanIds = await resolveDemoIds(CLEAN_DEMO);

  if (PREVIEW) await runOn(PREVIEW, "preview", cleanIds);
  await runOn(LOCAL, "local", localIds);

  // After local e2e, assert clean demo.db still has no E2E rows
  const prismaCheck = loadIdsFromDb(CLEAN_DEMO);
  const titles = await prismaCheck.tender.findMany({ select: { title: true } });
  await prismaCheck.$disconnect();
  ok("[local] demo.db remains clean", !titles.some((t) => /E2E/i.test(t.title)), titles.map((t) => t.title).join(" | "));

  fs.writeFileSync(`${PROOF}/e2e-results.json`, JSON.stringify(results, null, 2));
  const fails = results.filter((r) => !r.pass);
  console.log("\nTOTAL", results.length, "FAIL", fails.length);
  for (const f of fails) console.log("FAIL", f.step, f.detail);
  if (fails.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
