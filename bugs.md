# Bugs

Found with a browser test on 2026-11-16 (Chromium, 1280 px and 375 px wide, all pages, all 3 languages).

## Open

### 1. French guide page scrolls sideways on phones

- **Where:** Guide page, French, screen 375 px wide (most phones)
- **What happens:** The page is 429 px wide on a 375 px screen, so it scrolls left and right.
- **Cause:** The signals table in the guide's side column is too wide. Its header cells use `white-space:nowrap` (`dev/src.html`, `th` rule at line 141), and on small screens `.twocol` switches to `grid-template-columns:1fr` (line 277). A plain `1fr` column can't shrink below its content, so the table pushes the whole page wider. English and Arabic happen to fit; the French labels are longer.
- **Likely fix:** On line 277, use `minmax(0,1fr)` instead of `1fr`, and let the table scroll inside its own box (for example wrap it in a `div` with `overflow-x:auto`). Then run `python3 dev/build.py`.

## Fixed

_None yet._

## How to report a bug

Add a section under **Open** with: where (page, language, screen size), what happens, what should happen, and the cause if known. Move it to **Fixed** with the commit hash once it is fixed.
