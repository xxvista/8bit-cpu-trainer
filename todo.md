# To do

## Decisions needed (owner)

- [ ] Company name, to replace the placeholder "Electronics Kits Lab" (`BRAND` in `dev/app.js` and `<title>` in `dev/src.html`)
- [ ] Logo (none yet)
- [ ] What exactly goes in the Logic Gates Kit and the Arduino Model Kit (boards, parts, lessons), so their placeholder text can be replaced

## Before launch

- [x] Fix the bug in [bugs.md](bugs.md) (French guide scrolls sideways on phones)
- [x] Home page to choose a kit, with placeholders for the 2 future kits
- [ ] Set CPU kit prices in the `SHOP` object in `dev/app.js` (`prices.assembled`, `prices.solder`, in DA), then rebuild
- [ ] Test the order form and the "coming soon" contact buttons: WhatsApp and email both open with the message filled in
- [ ] Test in Firefox and Safari, and on a real phone (Arabic right-to-left layout especially)
- [ ] Publish online (the `.nojekyll` file is ready for GitHub Pages: repository Settings → Pages → deploy from branch `main`, folder `/`)

## Later

- [ ] Logic Gates Kit: real page (photos, contents, guide, labs, order) and possibly a gate simulator
- [ ] Arduino Model Kit: real page (photos, contents, guide, labs, order)
- [ ] One shared order form for several kits, once more than one kit is for sale
- [ ] Ask a French and an Arabic speaker to proofread `dev/strings.js`
- [ ] Add photos for the CPU boards that have none yet (`PHOTOS` in `dev/app.js` lists 5 boards)
- [ ] Add a small automated browser test so changes can be checked before committing
