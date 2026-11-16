# Notes for Claude

## Always keep the project notes up to date

After every change, before committing:

- Update `progress.md`: what changed, what was checked, current status. Add a line to its **Log** section with the date.
- Update `todo.md`: tick finished items, add new ones.
- Update `bugs.md`: add bugs you find, move fixed ones to **Fixed**.

## The project

A startup website selling electronics teaching kits. One static page (`index.html`), built from `dev/` with `python3 dev/build.py`. Never edit `index.html` by hand; edit `dev/` and rebuild. Commit both.

After any change to prices or to text the catalogue uses, run `node dev/brochure.js` and commit the new PDFs in `brochure/`.

- The kit is designed and its circuit boards printed (5 sets), but no kit is assembled yet (2026-11-16): never say it is built, tested or running.
- Script order in the built page: `pcbdata.js`, `bom.json`, `strings.js`, `app.js`, `bench.js`, `start.js` (see `dev/build.py`). Code that must exist before the page starts goes before `start.js`.
- Test bench (`dev/bench.js`): a fault must make at least one step of that module's automatic test fail, and a good board must pass every step. Check both after changing a module model.
- Kits: 8-Bit CPU Trainer (available), Logic Gates Kit and Arduino Model Kit (placeholders, "coming soon"). The kit list is `KITS` in `dev/app.js`.
- Prices: `SHOP.prices` in `dev/app.js` (assembled 49,000 DA, solder kit 39,000 DA). Keep the Prices tab of the order tracker Google Sheet in step when they change.
- No real photos on the website or in the catalogue until the first kit is assembled: use the board drawings (`boardFig` in `dev/app.js`, made from the KiCad files) or `img/kit-illustration.png`, captioned as an illustration.
- The website, catalogue and site text must not mention GitHub, Ben Eater or the original board designer (owner's decision, 2026-11-16). Keep the neutral CERN-OHL-P licence line on the About page and in the footer credit: the licence asks for its notice to be kept.
- Quotes (`QUOTES`) must be real quotes from real people. Never invent them; the section stays hidden while the list is empty.
- Company name is a placeholder: `BRAND` in `dev/app.js` (and the `<title>` in `dev/src.html`).
- All visible text is in `dev/strings.js` in English, French and Arabic (right-to-left). Every new string needs all three.

## Checking changes

Test in a browser (Playwright) at 1280 px and 375 px wide, in all 3 languages, on every page: no JavaScript errors, no missing text, no sideways scrolling on phones.
