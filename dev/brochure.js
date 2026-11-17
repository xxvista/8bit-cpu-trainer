/* Make the PDF catalogue in English, French and Arabic from the website's own text and prices.
   Run after build.py:   node dev/brochure.js
   Writes brochure/catalogue-en.pdf, catalogue-fr.pdf, catalogue-ar.pdf. Needs Playwright (npm i playwright). */
const path = require("path");
const { chromium } = require("playwright");
const root = path.join(__dirname, "..");

function brochureHtml() { // runs inside index.html, so it can use t(), SHOP, KITS, COURSE ...
  const today = new Date().toISOString().slice(0, 10);
  const kit = id => KITS.find(k => k.id === id);
  const row = (name, desc, price) => "<tr><td><b>" + name + "</b><p>" + desc + "</p></td><td class='pr ltr'>" + price + "</td></tr>";
  const contact = '<div class="contactb"><div>WhatsApp <b class="ltr">' + SHOP.phone + '</b></div><div class="ltr"><b>' + SHOP.email + "</b></div></div>";
  return `<style>
  @page{size:A4;margin:0}
  *{box-sizing:border-box}
  body{margin:0;font-family:var(--f-body);color:#111827;font-size:10.5pt;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .pg{width:210mm;height:297mm;padding:13mm 15mm 11mm;position:relative;overflow:hidden;page-break-after:always;display:flex;flex-direction:column;gap:5mm}
  .pg:last-child{page-break-after:auto}
  h1,h2,h3{font-family:var(--f-display);text-transform:uppercase;margin:0;line-height:1.1}
  .top{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #1746d1;padding-bottom:3mm}
  .top h1{font-size:22pt}.top h1 span{color:#1746d1}.top .doc{font-size:9pt;color:#5d6878;text-transform:uppercase;letter-spacing:.08em;font-weight:600}
  .eyebrow{align-self:flex-start;display:inline-block;font-size:8.5pt;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#1746d1;background:#e8eeff;border-radius:99px;padding:1mm 3.5mm}
  .hero h2{font-size:27pt;margin:2.5mm 0}
  .lead{color:#5d6878;font-size:11pt}
  h3{font-size:14pt;color:#111827;border-bottom:1px solid #dfe3e9;padding-bottom:1.5mm;margin-bottom:2.5mm}
  .two{display:grid;grid-template-columns:1fr 1fr;gap:6mm;align-items:start}
  img.ph{width:100%;border-radius:3mm;border:1px solid #dfe3e9;display:block}
  .facts{display:flex;gap:6mm;margin-top:3mm}.facts div{font-size:8.5pt;color:#5d6878}.facts b{display:block;font-family:var(--f-display);font-size:20pt;color:#111827;line-height:1}
  table{width:100%;border-collapse:collapse}
  td{border-bottom:1px solid #dfe3e9;padding:2.2mm 0;vertical-align:top}
  td p{margin:.8mm 0 0;color:#5d6878;font-size:9pt}
  td.pr{text-align:end;white-space:nowrap;font-family:var(--f-display);font-size:15pt;font-weight:700;padding-inline-start:5mm}
  .note{font-size:8.5pt;color:#5d6878;margin-top:1.5mm}
  ul{margin:0;padding-inline-start:5mm}li{margin-bottom:.8mm}
  .cols2{columns:2;column-gap:6mm;font-size:9.5pt}
  .path{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm}
  .step{border:1px solid #dfe3e9;border-radius:2.5mm;padding:3mm}.step.live{border-color:#1746d1;border-width:2px}
  .step .l{font-size:8pt;font-weight:700;color:#1746d1;text-transform:uppercase}.step b{display:block;font-family:var(--f-display);font-size:12pt;text-transform:uppercase}.step span{font-size:8.5pt;color:#5d6878}
  .tag{display:inline-block;margin-top:1.5mm;font-size:7.5pt;font-weight:700;text-transform:uppercase;border-radius:99px;padding:.4mm 2.5mm;background:#f5f6f8;color:#5d6878}.step.live .tag{background:#e8eeff;color:#1746d1}
  .why{display:grid;grid-template-columns:1fr 1fr;gap:3mm}.why div{background:#f5f6f8;border-radius:2.5mm;padding:3mm;font-size:9pt;color:#5d6878}.why b{display:block;color:#111827;font-size:10pt;text-transform:uppercase;font-family:var(--f-display)}
  .how{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}.how div{border-top:2px solid #1746d1;padding-top:2mm;font-size:9pt;color:#5d6878}.how b{display:block;color:#111827;font-family:var(--f-display);font-size:11pt;text-transform:uppercase}
  .foot{margin-top:auto;background:#e8eeff;border-radius:3mm;padding:4mm 5mm;display:flex;justify-content:space-between;align-items:center;gap:5mm}
  .foot h2{font-size:15pt}.contactb{font-size:10pt;text-align:end}
  .small{font-size:7.5pt;color:#5d6878}
  .pg.p2{gap:3mm;font-size:9.5pt;padding-top:11mm;padding-bottom:9mm}
  .pg.p2 h3{font-size:12.5pt;margin-bottom:2mm}
  .pg.p2 .why div,.pg.p2 .step{padding:2.2mm 3mm}
  .pg.p2 .foot{padding:3mm 5mm}
  .pg.p2 .cols2{font-size:8.8pt}.pg.p2 .cols2 li{margin-bottom:.3mm}
  .pg.p2 .why{grid-template-columns:repeat(4,1fr);gap:2.5mm}.pg.p2 .why div{font-size:8.3pt}
  .pg.p2 .note,.pg.p2 .step span,.pg.p2 .how div{font-size:8.5pt}
  .ltr{direction:ltr;unicode-bidi:isolate}
  </style>
  <div class="pg">
    <div class="top"><h1 class="ltr">${document.getElementById("brandName").innerHTML}</h1><div class="doc">${t("bDoc")} · ${today}</div></div>
    <div class="hero" style="display:flex;flex-direction:column"><span class="eyebrow">${t("hMade")}</span><h2>${t("hTitle")}</h2><p class="lead">${t("hLead")}</p></div>
    <div><h3>${t("hWho")}</h3><p>${t("hWhoP")}</p></div>
    <div class="two">
      <div><h3 class="ltr">8-Bit CPU Trainer</h3><p>${t("kLead")}</p>
        <div class="facts"><div><b>11</b>${t("kF1")}</div><div><b>${TOTALPARTS}</b>${t("kF2")}</div><div><b>82</b>${t("kF3")}</div><div><b>16</b>${t("kF4")}</div></div></div>
      <img class="ph" style="border:none;height:52mm;object-fit:contain" src="img/kit-illustration.png">
    </div>
    <div><h3>${t("bVersions")}</h3><table>
      ${row(t("kP1"), t("kP1d"), money(SHOP.prices.assembled))}
      ${row(t("kP2"), t("kP2d"), money(SHOP.prices.solder))}
      ${row(t("kP3"), t("kP3d"), t("bOnQuote"))}
    </table><p class="note">${t("bPrices")}</p></div>
    <div class="foot"><h2>${t("hCtaT")}</h2>${contact}</div>
  </div>
  <div class="pg p2">
    <div class="top"><h1 class="ltr">${document.getElementById("brandName").innerHTML}</h1><div class="doc ltr">8-Bit CPU Trainer</div></div>
    <div class="two">
      <div><h3>${t("kBox")}</h3><p>${t("kBoxAlso")}</p><p class="note">${t("kNeed")}</p></div>
      <div><h3>${t("bLearn")}</h3><p>${t("bLearnL", COURSE.length, LABT.length, CHT.length, PLAN.length)}</p>
        <p style="margin-top:2mm"><b>${t("bLabs")}:</b> ${LABT.map(l => l[LI][0]).join(" · ")}</p></div>
    </div>
    <div><h3>${t("bTopics")}</h3><ul class="cols2">${COURSE.map(r => "<li>" + r[0][LI] + "</li>").join("")}</ul></div>
    <div><h3>${t("hPath")}</h3><div class="path">
      ${[["hStep", 1, "gates", "hPath1"], ["hStep", 2, "cpu", "hPath2"], ["hAlong", 0, "arduino", "hPath3"]].map(([l, n, id, d]) => { const k = kit(id), live = k.status === "live";
        return '<div class="step' + (live ? " live" : "") + '"><div class="l">' + t(l, n) + "</div><b" + (id === "cpu" ? ' class="ltr"' : "") + ">" + k.name() + "</b><span>" + t(d) + '</span><div class="tag">' + t(live ? "hAvail" : k.status === "designed" ? "hDesigned" : "hSoon") + "</div></div>"; }).join("")}
    </div></div>
    <div><h3>${t("hWhy")}</h3><div class="why">${[1, 2, 3, 4].map(i => "<div><b>" + t("hW" + i) + "</b>" + t("hW" + i + "d") + "</div>").join("")}</div></div>
    <div><h3>${t("hHow")}</h3><div class="how">${[1, 2, 3].map(i => "<div><b>" + i + ". " + t("hHow" + i) + "</b>" + t("hHow" + i + "d") + "</div>").join("")}</div></div>
    <div class="foot"><div><h2>${t("hCtaT")}</h2><p>${t("hCtaL")}</p></div>${contact}</div>
    <p class="small">${t("credit")}</p>
  </div>`;
}

(async () => {
  const browser = await chromium.launch();
  for (const [i, code] of ["en", "fr", "ar"].entries()) {
    const page = await browser.newPage();
    await page.goto("file://" + path.join(root, "index.html") + "#home");
    await page.evaluate(i => setLang(i, false), i);
    const html = await page.evaluate(brochureHtml.toString().replace(/^function brochureHtml\(\) \{/, "(() => {") + ")()");
    await page.evaluate(h => { document.body.className = ""; document.body.innerHTML = h; }, html);
    await page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; }))]));
    const over = await page.evaluate(() => [...document.querySelectorAll(".pg")].map((p, n) => p.scrollHeight > p.clientHeight + 1 ? n + 1 : 0).filter(Boolean));
    if (over.length) { console.error("TOO LONG by " + (await page.evaluate(() => [...document.querySelectorAll(".pg")].map(p => Math.round((p.scrollHeight - p.clientHeight) / 3.78) + "mm").join("/"))) + ": page " + over.join(", ") + " of the " + code + " catalogue does not fit on A4"); process.exitCode = 1; }
    const out = path.join(root, "brochure", "catalogue-" + code + ".pdf");
    await page.pdf({ path: out, format: "A4", printBackground: true, preferCSSPageSize: true });
    console.log("wrote", path.relative(root, out));
    await page.close();
  }
  await browser.close();
})();
