# Notes for Claude

## Always keep the project notes up to date

After every change, before committing:

- Update `progress.md`: what changed, what was checked, current status. Add a line to its **Log** section with the date.
- Update `todo.md`: tick finished items, add new ones.
- Update `bugs.md`: add bugs you find, move fixed ones to **Fixed**.

## The project

A startup website selling electronics teaching kits. One static page (`index.html`), built from `dev/` with `python3 dev/build.py`. Never edit `index.html` by hand; edit `dev/` and rebuild. Commit both.

- Kits: 8-Bit CPU Trainer (available), Logic Gates Kit and Arduino Model Kit (placeholders, "coming soon"). The kit list is `KITS` in `dev/app.js`.
- Company name is a placeholder: `BRAND` in `dev/app.js` (and the `<title>` in `dev/src.html`).
- All visible text is in `dev/strings.js` in English, French and Arabic (right-to-left). Every new string needs all three.

## Checking changes

Test in a browser (Playwright) at 1280 px and 375 px wide, in all 3 languages, on every page: no JavaScript errors, no missing text, no sideways scrolling on phones.
