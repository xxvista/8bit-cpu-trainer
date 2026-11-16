# Bugs

Found with a browser test on 2026-11-16 (Chromium, 1280 px and 375 px wide, all pages, all 3 languages).

## Open

_None._

## Fixed

### 1. French guide page scrolls sideways on phones

- **Where:** Guide page, French, screen 375 px wide (most phones)
- **What happens:** The page is 429 px wide on a 375 px screen, so it scrolls left and right.
- **Cause:** The signals table in the guide's side column is too wide. Its header cells use `white-space:nowrap` (`dev/src.html`, `th` rule at line 141), and on small screens `.twocol` switches to `grid-template-columns:1fr` (line 277). A plain `1fr` column can't shrink below its content, so the table pushes the whole page wider. English and Arabic happen to fit; the French labels are longer.
- **Fix:** Line 277 now uses `minmax(0,1fr)` instead of `1fr`. The table was already in a scrolling box (`.tablewrap`), so on narrow screens it now scrolls inside that box instead of widening the page. Rechecked all pages, all 3 languages, at 1280 px and 375 px: no sideways scrolling.
- **Fixed in:** the commit "Fix French guide scrolling sideways on phones" (2026-11-16)

### 2. Home page scrolls sideways on phones in French

- **Where:** Home page, French, 375 px wide
- **What happened:** The "Demander un devis pour votre établissement" button could not wrap (buttons use `white-space:nowrap`), so the page was 395 px wide.
- **Fix:** Buttons on the home and coming-soon pages may now wrap their text (`#homeBody .btn` rule in `dev/src.html`). Found and fixed before release, in the commit "Rebuild the home page to present the startup" (2026-11-16).

## How to report a bug

Add a section under **Open** with: where (page, language, screen size), what happens, what should happen, and the cause if known. Move it to **Fixed** with the commit hash once it is fixed.
