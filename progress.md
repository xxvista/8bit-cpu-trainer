# Progress

Last updated: 2026-11-16

## Vision

A startup that designs and sells hands-on electronics kits for learning, each with a guide, lab exercises and an online simulator. Customers: universities, technical schools, high schools and hobbyists.

| Kit | Status |
|---|---|
| 8-Bit CPU Trainer | Available: assembled 49,000 DA, solder-it-yourself kit 39,000 DA, classroom pack on quote |
| Logic Gates Kit | Placeholder: "coming soon" page with WhatsApp / email contact |
| Arduino Model Kit | Placeholder: "coming soon" page with WhatsApp / email contact |

## Status

The website works offline: open `index.html` in a browser. It opens on a home page where visitors choose a kit. All work is merged into `main`.

## Site map

| Address | Page |
|---|---|
| `#home` (or no address) | Home: banner with photo, who we are, kit cards, learning path, why our kits, how ordering works, FAQ, contact |
| `#gates`, `#arduino` | Coming-soon pages for the 2 future kits |
| `#simulator`, `#guide`, `#modules`, `#labs`, `#course`, `#about`, `#kit` | 8-Bit CPU Trainer pages, with their own menu bar |

The company name in the header always goes back home.

## Done

| Area | What exists | Where |
|---|---|---|
| Home page | Presents the startup: banner ("Designed and made in Algeria", headline, photo, 3 key facts), who we are, 3 kit cards, learning path (Logic Gates → CPU, Arduino alongside), 4 reasons to choose us, 3-step ordering with a "quote for your school" WhatsApp button, 5-question FAQ, contact box | `renderHome` in `dev/app.js`, `h…` strings in `dev/strings.js` |
| Coming-soon pages | Kit name, description, planned contents, WhatsApp and email buttons with a pre-written message | `renderSoon` in `dev/app.js` |
| Prices | Assembled 49,000 DA, solder kit 39,000 DA; home page card shows "From 39,000 DA" | `SHOP.prices` in `dev/app.js` |
| PDF catalogue | 2-page A4 catalogue in English, French and Arabic, made from the site's text and prices; download buttons on the home page and the CPU kit page | `dev/brochure.js`, `brochure/catalogue-*.pdf` |
| Quotes section | Built but hidden until real quotes are added | `QUOTES` in `dev/app.js` |
| Home photos | "Inside the kit" gallery with 4 kit photos (temporary, until there are lab-session photos) | `HOMEPHOTOS` in `dev/app.js` |
| Visitor counting | GoatCounter (site code `xxvista`), counts page views and clicks (WhatsApp, email, catalogue, order form) | `ANALYTICS` in `dev/app.js` |
| Order tracker | Google Sheet with Orders, Summary and Prices tabs, dropdowns and automatic totals: [Order tracker](https://docs.google.com/spreadsheets/d/1AN_my6Cz8LivtA_cFfjyjDTp47ep2JEO9SjNs_zl_BI/edit) | Google Drive |
| Brand | Placeholder name "Electronics Kits Lab", changed in one place | `BRAND` in `dev/app.js`, `<title>` in `dev/src.html` |
| CPU simulator | SAP-1 CPU: microcode, ALU, flags, 16-byte RAM, assembler with labels, disassembler, step / instruction / run / back / reset, speed control | `dev/app.js` |
| CPU board drawing | Boards drawn from the KiCad PCB outlines and parts, with board-colour options | `dev/app.js`, `dev/pcbdata.js`, `dev/bom.json` |
| CPU teaching panels | State, Program, RAM, Microcode, Timing, Faults, Trace | `dev/src.html`, `dev/app.js` |
| CPU example programs | 7 programs: count by 3, add, subtract, count down, carry, multiply, fetch cycle | `EXAMPLES` in `dev/app.js` |
| CPU content pages | User guide, module catalog, lab exercises, course map, about | `dev/src.html`, `dev/strings.js` |
| CPU order page | Order form that sends by email or WhatsApp | `SHOP` in `dev/app.js` |
| Languages | English, French, Arabic (right-to-left); every string has all 3 | `dev/strings.js` |
| Photos | 6 photos of the CPU kit | `img/` |
| Build | `python3 dev/build.py` combines everything into `index.html` | `dev/build.py` |

## Checked (browser test, 2026-11-16)

- [x] All 9 pages load in all 3 languages, desktop (1280 px) and phone (375 px)
- [x] No JavaScript errors, no broken images, no missing translations
- [x] No page scrolls sideways on phones
- [x] Kit menu bar shows only on the CPU pages; browser tab title changes per page
- [x] Catalogue: 2 pages in each language, nothing cut off (the script checks this)
- [x] Order tracker: totals tested with list price, agreed price and missing price
- [x] All 7 CPU example programs give the expected output; Step, Run and Reset work
- [ ] Order form and "coming soon" buttons actually open WhatsApp / email (not tested)
- [x] Visitor counting logic: page views and click events recorded (tested with a stand-in script; the real GoatCounter server can't be reached from the test machine)
- [ ] Visit shows on the GoatCounter dashboard (check after publishing)
- [ ] Other browsers (only Chromium tested)

## Log

- 2026-11-16: Site added (8-Bit CPU Trainer only).
- 2026-11-16: Added progress, bugs and to-do notes. Fixed French guide scrolling sideways on phones.
- 2026-11-16: New startup vision: home page to choose between 3 kits; Logic Gates and Arduino Model kits added as "coming soon" placeholders; placeholder company name; CPU pages moved under their own menu bar. Added `CLAUDE.md` with the rule to always update these notes.
- 2026-11-16: Merged everything into `main`.
- 2026-11-16: Rebuilt the home page to present the startup (see Home page above). Fixed a long French button making the phone page scroll sideways.
- 2026-11-16: Merged the new home page into `main`.
- 2026-11-16: "Who we are" now says the team is two Algerian electronics engineers (was "engineers and teachers").
- 2026-11-16: Prices set (49,000 / 39,000 DA). Added the PDF catalogue in 3 languages, temporary kit photos on the home page, a hidden quotes section, GoatCounter visitor counting (waiting for a code) and the Google Sheet order tracker.
- 2026-11-16: Visitor counting turned on (GoatCounter `xxvista`). Removed the spare-parts claim from the home page and catalogue ("Why our kits" and the FAQ), since only the two kit versions are sold; catalogue PDFs remade.
- 2026-11-16: Merged prices, catalogue, visitor counting and order tracker work into `main`.

## Not done yet

See [todo.md](todo.md) and [bugs.md](bugs.md).
