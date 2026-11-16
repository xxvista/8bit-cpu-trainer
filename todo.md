# To do

## Decisions needed (owner)

- [x] Company name and logo: keep "Electronics Kits Lab" and no logo for now (owner, 2026-11-16)
- [x] Team description: two Algerian electronics engineers (`hWhoP`)
- [x] Delivery to all 58 wilayas confirmed
- [ ] Confirm the last two home page claims, or correct them in `dev/strings.js`: "we sell spare parts and boards separately" (`hA5`), "we usually reply within a day" (`hCtaL`)
- [ ] Decide whether to name the two founders in "Who we are" (currently no names)
- [ ] A real photo of the team or workshop for the "Who we are" section (optional)
- [ ] What exactly goes in the Logic Gates Kit and the Arduino Model Kit (boards, parts, lessons), so their placeholder text can be replaced

## Before launch

- [x] Fix the bug in [bugs.md](bugs.md) (French guide scrolls sideways on phones)
- [x] Home page to choose a kit, with placeholders for the 2 future kits
- [x] Set CPU kit prices: assembled 49,000 DA, solder kit 39,000 DA
- [x] PDF catalogue (`node dev/brochure.js`)
- [x] Order tracker: [Google Sheet](https://docs.google.com/spreadsheets/d/1AN_my6Cz8LivtA_cFfjyjDTp47ep2JEO9SjNs_zl_BI/edit)
- [ ] Share the order tracker with Feriel (Share button in Google Sheets), and delete its example row before the first real order
- [ ] Visitor counting: create a free account at goatcounter.com, then put the site code in `ANALYTICS.goatcounter` in `dev/app.js` and rebuild
- [ ] Replace the temporary "Inside the kit" photos with photos of a real lab session (`HOMEPHOTOS` in `dev/app.js`)
- [ ] Add real quotes from teachers or students when you have them (`QUOTES` in `dev/app.js`; the section appears by itself)
- [ ] Test the order form and the "coming soon" contact buttons: WhatsApp and email both open with the message filled in
- [ ] Test in Firefox and Safari, and on a real phone (Arabic right-to-left layout especially)
- [ ] Publish online (the `.nojekyll` file is ready for GitHub Pages: repository Settings → Pages → deploy from branch `main`, folder `/`)

## Later

- [ ] Logic Gates Kit (on hold, owner 2026-11-16): real page (photos, contents, guide, labs, order) and possibly a gate simulator
- [ ] Arduino Model Kit: real page (photos, contents, guide, labs, order)
- [ ] One shared order form for several kits, once more than one kit is for sale
- [ ] Ask a French and an Arabic speaker to proofread `dev/strings.js`
- [ ] Add photos for the CPU boards that have none yet (`PHOTOS` in `dev/app.js` lists 5 boards)
- [ ] Add a small automated browser test so changes can be checked before committing
