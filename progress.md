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
| `#simulator`, `#bench`, `#guide`, `#modules`, `#labs`, `#course`, `#about`, `#kit` | 8-Bit CPU Trainer pages, with their own menu bar |

The company name in the header always goes back home.

## Done

| Area | What exists | Where |
|---|---|---|
| Home page | Presents the startup: banner ("Designed and made in Algeria", headline, photo, 3 key facts), who we are, 3 kit cards, learning path (Logic Gates → CPU, Arduino alongside), 4 reasons to choose us, 3-step ordering with a "quote for your school" WhatsApp button, 5-question FAQ, contact box | `renderHome` in `dev/app.js`, `h…` strings in `dev/strings.js` |
| Coming-soon pages | Kit name, description, planned contents, WhatsApp and email buttons with a pre-written message | `renderSoon` in `dev/app.js` |
| Prices | Assembled 49,000 DA, solder kit 39,000 DA; home page card shows "From 39,000 DA" | `SHOP.prices` in `dev/app.js` |
| PDF catalogue | 2-page A4 catalogue in English, French and Arabic, made from the site's text and prices; download buttons on the home page and the CPU kit page | `dev/brochure.js`, `brochure/catalogue-*.pdf` |
| Quotes section | Built but hidden until real quotes are added | `QUOTES` in `dev/app.js` |
| Home board row | "Inside the kit" row of 4 board drawings | `HOMEBOARDS` in `dev/app.js` |
| Visitor counting | GoatCounter (site code `xxvista`), counts page views and clicks (WhatsApp, email, catalogue, order form) | `ANALYTICS` in `dev/app.js` |
| Order tracker | Google Sheet with Orders, Summary and Prices tabs, dropdowns and automatic totals: [Order tracker](https://docs.google.com/spreadsheets/d/1AN_my6Cz8LivtA_cFfjyjDTp47ep2JEO9SjNs_zl_BI/edit) | Google Drive |
| Test bench | New CPU page: pick a module (Clock, PC, MAR, RAM, Register A/B/IR, ALU, Output, Control), drive its inputs by hand (bus switches, control lines, modes), pulse the clock or reset, and read its outputs on the live board drawing. Automatic test runs a test plan step by step with PASS/FAIL, expected and actual values. 20 insertable faults | `dev/bench.js`, `BT` in `dev/strings.js` |
| Simulator controls | Player-style control bar (Reset, Step back, Clock pulse, One instruction, Run/Pause) above the board; pinned to the bottom of the screen on phones | `dev/src.html`, `dev/app.js` |
| Data path | Animated yellow line from the board driving the bus, along the bus, to every board storing the byte, with the value on a tag | `drawFlow` in `dev/app.js` |
| Step tracker | T0–T5 bar under the explanation (fetch vs execute, current and finished steps, unused steps dimmed) | `render` in `dev/app.js` |
| Board illustrations | No real photos yet (no kit assembled): the home banner, kit card, kit page and catalogue use `img/kit-illustration.png` (the 11 boards rendered from the KiCad files); the board rows are drawings made live from the KiCad data | `KITILLUS`, `boardFig` in `dev/app.js` |
| Brand | Placeholder name "Electronics Kits Lab", changed in one place | `BRAND` in `dev/app.js`, `<title>` in `dev/src.html` |
| CPU simulator | SAP-1 CPU: microcode, ALU, flags, 16-byte RAM, assembler with labels, disassembler, step / instruction / run / back / reset, speed control | `dev/app.js` |
| CPU board drawing | Boards drawn from the KiCad PCB outlines and parts, with board-colour options | `dev/app.js`, `dev/pcbdata.js`, `dev/bom.json` |
| CPU teaching panels | State, Program, RAM, Microcode, Timing, Faults (9 faults), Trace | `dev/src.html`, `dev/app.js` |
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
- [x] Test bench: every module passes its automatic test on a good board, and each of the 20 faults makes at least one step fail (checked with a script); the ALU test runs all 65,536 sums and differences in about 30 ms
- [x] Test bench fits a 375 px phone for all 8 modules in all 3 languages
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
- 2026-11-16: Home page redesign for more space: centred 1,160 px column (header aligned to it), 88 px between sections (64 px on phones), larger section titles, soft background bands for the learning path and ordering, no boxes around "Why our kits", equal-size photo row, two-column FAQ with +/− markers, dark contact box. Phone header on one row. Kit cards side by side on tablets. Checked at 1440, 820 and 390 px, English and Arabic.
- 2026-11-16: Merged the home page redesign into `main`.
- 2026-11-16: Compared the site with the designer's repository and blog. The Bootloader board in the repository is unfinished (empty board file, not in the blog), so it was not added. Added his build notes (summarised, 3 languages) to the module cards with links to his pages, and 2 new faults based on real mistakes. Simulator redesign: control bar with icons, the whole computer fits the first screen on desktop and stays in view, yellow data-path line, T0–T5 step tracker, tabs as a segmented control, first-visit tip, "Whole computer" only shown when zoomed. Phones: control bar pinned at the bottom, kit menu on one row, only the boards involved in the current step are labelled. Checked at 1440, 1280 and 390 px in English and Arabic.
- 2026-11-16: The designer gave permission to use his photos. His 8 module photos (resized to 1,400 px, 1.1 MB in total) replace the module-card photos, with a credit line. Our own kit photos stay on the home and kit pages.
- 2026-11-16: Merged the simulator redesign, build notes, new faults and the designer's photos into `main`.
- 2026-11-16: Added the Test bench page (module-by-module testing). Code in `dev/bench.js`; the page start-up moved to `dev/start.js` so it runs after the bench code. The board drawing function takes an id prefix so a second live copy of a board can be on the page.
- 2026-11-16: Merged the test bench into `main`.
- 2026-11-16: The kit is not assembled yet, so all real photos were removed from the website and catalogue and replaced by illustrations drawn from the KiCad files. Removed every mention of GitHub, Ben Eater and the original designer from the site (module build notes, his photos and links, the About page question and credits, test bench wording); the About page and footer keep a neutral CERN-OHL-P licence line, and now say the kit was designed (not built) by Abdellah Abdelkafi and Feriel Hamouchi. Catalogue PDFs remade.
- 2026-11-16: Merged the illustrations and the removal of designer references into `main`.

## Not done yet

See [todo.md](todo.md) and [bugs.md](bugs.md).
