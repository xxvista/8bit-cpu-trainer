# To do

## Before launch

- [x] Fix the bug in [bugs.md](bugs.md) (French guide scrolls sideways on phones)
- [ ] Set kit prices in the `SHOP` object in `dev/app.js` (`prices.assembled`, `prices.solder`, in DA), then rebuild
- [ ] Test the order form: email link and WhatsApp link both open with the order filled in
- [ ] Test in Firefox and Safari, and on a real phone (Arabic right-to-left layout especially)
- [ ] Publish online (the `.nojekyll` file is ready for GitHub Pages: repository Settings → Pages → deploy from branch `main`, folder `/`)

## Later

- [ ] Ask a French and an Arabic speaker to proofread `dev/strings.js`
- [ ] Add photos for the boards that have none yet (`PHOTOS` in `dev/app.js` lists 5 boards)
- [ ] Add a small automated test (the browser check used for [progress.md](progress.md)) so changes can be checked before committing
