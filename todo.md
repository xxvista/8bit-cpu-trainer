# To do

## Decisions needed (owner)

- [x] Company name and logo: keep "Electronics Kits Lab" and no logo for now (owner, 2026-11-16)
- [x] Team description: two Algerian electronics engineers (`hWhoP`)
- [x] Delivery to all 58 wilayas confirmed
- [x] "We usually reply within a day" confirmed. Spare-parts claim removed: you sell two versions (soldered and non-soldered), not separate parts
- [x] Founders: named on the About page; home "Who we are" keeps "two Algerian electronics engineers" and names the Incubateur de l'Université de Bouira (owner, 2026-11-16)
- [ ] A real photo of the team or workshop for the "Who we are" section (optional)
- [x] Logic Gates Kit contents: board designed (owner's KiCad files, 2026-11-17); page `#gates` added
- [ ] Logic Gates board, before ordering: check the LED loads on the CD40xx outputs (about 1 mA drive at 5 V against 1 kΩ LEDs: dim LEDs, weak levels when chaining gates). Options: 74HC00/08/32/86 (other pinouts, re-route) or 4.7–10 kΩ LED resistors with bright LEDs. Run KiCad ERC/DRC (`check.bat`)
- [ ] Logic Gates Kit price, once the board cost is known
- [x] Arduino kit contents: owner's board (KiCad, 2026-11-18); page `#arduino` added
- [ ] Arduino board: change the KiCad title block (it still says "KiCad copy" and "Imported from Eagle design by Elecrow (no licence stated)") and keep the licence document that allows selling it
- [ ] Arduino simulator: add the lessons as guided steps (like the CPU labs), and let students edit the code later
- [ ] Arduino kit price (cost estimate about $38 a kit with board assembly, before transport and customs) and its lessons

## Before launch

- [x] Fix the bug in [bugs.md](bugs.md) (French guide scrolls sideways on phones)
- [x] Home page to choose a kit, with placeholders for the 2 future kits
- [x] Set CPU kit prices: assembled 49,000 DA, solder kit 39,000 DA
- [x] PDF catalogue (`node dev/brochure.js`)
- [x] Order tracker: [Google Sheet](https://docs.google.com/spreadsheets/d/1AN_my6Cz8LivtA_cFfjyjDTp47ep2JEO9SjNs_zl_BI/edit)
- [ ] Share the order tracker with Feriel (Share button in Google Sheets), and delete its example row before the first real order
- [x] Visitor counting: GoatCounter code `xxvista` set; visits show at https://xxvista.goatcounter.com once the site is online
- [ ] After publishing, open the site once and check the visit appears on the GoatCounter dashboard
- [ ] Assemble the first kit, then add real photos of it (and of a lab session) to the home page, kit page and catalogue
- [ ] Add real quotes from teachers or students when you have them (`QUOTES` in `dev/app.js`; the section appears by itself)
- [ ] Test the order form and the "coming soon" contact buttons: WhatsApp and email both open with the message filled in
- [ ] Test in Firefox and Safari, and on a real phone (Arabic right-to-left layout especially)
- [ ] Publish online (the `.nojekyll` file is ready for GitHub Pages: repository Settings → Pages → deploy from branch `main`, folder `/`)

## Later

- [ ] Module simulator: a lab exercise per module ("load 42 into register A and put it back on the bus")


- [ ] Logic Gates Kit, once made: guide, lab sheets, order form and price (page and simulator done 2026-11-17)
- [ ] Arduino Model Kit: real page (photos, contents, guide, labs, order)
- [ ] One shared order form for several kits, once more than one kit is for sale
- [ ] Ask a French and an Arabic speaker to proofread `dev/strings.js`
- [ ] Add a small automated browser test so changes can be checked before committing
