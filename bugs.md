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

### 3. Huge kit pictures on phones during the redesign

- **Where:** Home page, kit cards, phones (under 600 px)
- **What happened:** A tablet rule (`min-height:100%` on the picture) also applied on phones, so each picture filled the whole card.
- **Fix:** The phone rule resets `min-height`. Found and fixed before release, in the commit "Give the home page more room" (2026-11-16).

### 4. Test bench scrolled sideways on phones in English and French

- **Where:** Test bench, 375 px wide, English and French
- **What happened:** The readout "floating (not driven)" could not wrap, so the page was 387 px (English) and 422 px (French) wide.
- **Fix:** Readout values in `.bread` may wrap. Found and fixed before release, in the commit "Add a test bench for module-by-module testing" (2026-11-16).

## How to report a bug

Add a section under **Open** with: where (page, language, screen size), what happens, what should happen, and the cause if known. Move it to **Fixed** with the commit hash once it is fixed.
