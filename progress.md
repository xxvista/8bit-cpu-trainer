# Progress

Last updated: 2026-11-19

## Vision

A startup that designs and sells hands-on electronics kits for learning, each with a guide, lab exercises and an online simulator. Customers: universities, technical schools, high schools and hobbyists.

| Kit | Status |
|---|---|
| 8-Bit CPU Trainer | Available: assembled 49,000 DA, solder-it-yourself kit 39,000 DA, classroom pack on quote |
| Logic Gates Kit | Designed (KiCad schematic and board done, 158 × 142 mm), not yet printed. Page `#gates`: board drawn from the KiCad file, switches and jumper wires to try, truth tables, parts list |
| Arduino All-in-One Kit | Designed (KiCad, 189 × 137 mm, ATmega328P + 16 modules), not yet printed. Page `#arduino`: board drawing, the 16 modules with their pins, what students learn, status, contact |

## Status

The website works offline: open `index.html` in a browser. It opens on a home page where visitors choose a kit. All work is merged into `main`.

## Site map

| Address | Page |
|---|---|
| `#home` (or no address) | Home: banner with photo, who we are, kit cards, learning path, why our kits, how ordering works, FAQ, contact |
| `#gates` | Logic Gates Kit: try the board (switches, jumper wires, LEDs), truth tables, what is on the board, status, parts list, contact |
| `#arduino` | Arduino All-in-One Kit: board drawing, 16 modules, contents, status, contact |
| `#simulator`, `#guide`, `#modules`, `#labs`, `#course`, `#about`, `#kit` | 8-Bit CPU Trainer pages, with their own menu bar |

The company name in the header always goes back home.

## Done

| Area | What exists | Where |
|---|---|---|
| Home page | Presents the startup: banner ("Designed and made in Algeria", headline, photo, 3 key facts), who we are, 3 kit cards, learning path (Logic Gates → CPU, Arduino alongside), 4 reasons to choose us, 3-step ordering with a "quote for your school" WhatsApp button, 5-question FAQ, contact box | `renderHome` in `dev/app.js`, `h…` strings in `dev/strings.js` |
| Logic Gates Kit page | Board drawn from the KiCad file, switches, power switch and jumper wires to try, live truth tables, examples, contents, status, parts list | `dev/gates.js`, `dev/gatesdata.js` (from `dev/gatespcb.py`) |
| Coming-soon pages | Kit name, description, planned contents, WhatsApp and email buttons with a pre-written message | `renderSoon` in `dev/app.js` |
| Prices | Assembled 49,000 DA, solder kit 39,000 DA; home page card shows "From 39,000 DA". Planned prices: Logic Gates 8,000 DA, Arduino 18,000 DA, shown as "Planned price" on the home cards, the kit pages (Status column) and the catalogue; also in the order tracker Prices tab | `SHOP.prices` in `dev/app.js` |
| PDF catalogue | 2-page A4 catalogue in English, French and Arabic, made from the site's text and prices; download buttons on the home page and the CPU kit page | `dev/brochure.js`, `brochure/catalogue-*.pdf` |
| Quotes section | Built but hidden until real quotes are added | `QUOTES` in `dev/app.js` |
| Home board row | "Inside the kit" row of 4 board drawings | `HOMEBOARDS` in `dev/app.js` |
| Visitor counting | GoatCounter (site code `xxvista`), counts page views and clicks (WhatsApp, email, catalogue, order form) | `ANALYTICS` in `dev/app.js` |
| Order tracker | Google Sheet with Orders, Summary and Prices tabs, dropdowns and automatic totals: [Order tracker](https://docs.google.com/spreadsheets/d/1AN_my6Cz8LivtA_cFfjyjDTp47ep2JEO9SjNs_zl_BI/edit) | Google Drive |
| Module simulator | Top of the Modules page: pick a module (Clock, PC, MAR, RAM, Register A/B/IR, ALU, Output, Control), set its control lines, pulse the clock and read its outputs on the live board drawing. A data-bus strip under the board shows the 8 wires: you set them by clicking unless the module drives the bus; an arrow says whether the module stores from or puts onto the bus. Each catalogue card has a "Simulate this module" button | `dev/bench.js` |
| Simulator controls | Player-style control bar (Reset, Step back, Clock pulse, One instruction, Run/Pause) above the board; pinned to the bottom of the screen on phones | `dev/src.html`, `dev/app.js` |
| Data path | Animated yellow line from the board driving the bus, along the bus, to every board storing the byte, with the value on a tag | `drawFlow` in `dev/app.js` |
| Step tracker | T0–T5 bar under the explanation (fetch vs execute, current and finished steps, unused steps dimmed) | `render` in `dev/app.js` |
| Board illustrations | No real photos yet (no kit assembled): the home banner, kit card, kit page and catalogue use `img/kit-illustration.png` (the 11 boards rendered from the KiCad files); the board rows are drawings made live from the KiCad data | `KITILLUS`, `boardFig` in `dev/app.js` |
| Brand | Placeholder name "Electronics Kits Lab", changed in one place | `BRAND` in `dev/app.js`, `<title>` in `dev/src.html` |
| CPU simulator | SAP-1 CPU: microcode, ALU, flags, 16-byte RAM, assembler with labels, disassembler, step / instruction / run / back / reset, speed control | `dev/app.js` |
| CPU board drawing | Boards drawn from the KiCad PCB outlines and parts, with board-colour options | `dev/app.js`, `dev/pcbdata.js`, `dev/bom.json` |
| CPU teaching panels | State, Program, RAM, Microcode, Timing, Trace | `dev/src.html`, `dev/app.js` |
| CPU example programs | 7 programs: count by 3, add, subtract, count down, carry, multiply, fetch cycle | `EXAMPLES` in `dev/app.js` |
| CPU content pages | User guide, module catalog, lab exercises, course map, about | `dev/src.html`, `dev/strings.js` |
| CPU order page | Order form that sends by email or WhatsApp | `SHOP` in `dev/app.js` |
| Languages | English, French, Arabic (right-to-left); every string has all 3 | `dev/strings.js` |
| Build | `python3 dev/build.py` combines everything into `index.html` | `dev/build.py` |

## Checked (browser test, 2026-11-16)

- [x] All 9 pages load in all 3 languages, desktop (1280 px) and phone (375 px)
- [x] No JavaScript errors, no broken images, no missing translations
- [x] No page scrolls sideways on phones
- [x] Kit menu bar shows only on the CPU pages; browser tab title changes per page
- [x] Catalogue: 2 pages in each language, nothing cut off (the script checks this)
- [x] Order tracker: totals tested with list price, agreed price and missing price
- [x] Module simulator: register stores 74 from the bus and drives it back, PC jumps to 5 from the bus, clock shows "not on the data bus", card buttons open the right module; fits a 390 px phone in Arabic
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
- 2026-11-16: Removed the Test bench page (automatic tests and faults) and its menu item. Its module-by-module simulation moved to the top of the Modules page, now with a data-bus strip you can set by clicking the wires, flow arrows, and "Simulate this module" buttons on the catalogue cards. Old `#bench` links open the Modules page. Hackathon deck and Q&A: removed imported training benches, open-source mentions and the test bench slide; added Market and Roadmap slides.
- 2026-11-16: Merged the module simulator with data bus into `main`.
- 2026-11-16: Removed the simulator's Faults tab (fault-finding exercise) and its texts, on the owner's request. About page: the kit was designed by Abdellah Abdelkafi and Feriel Hamouchi, two Algerian electronics engineers from Université Akli Mohand Oulhadj de Bouira, developed with the Incubateur de l'Université de Bouira (was: final-year project at Sétif). Home "Who we are" keeps "two Algerian electronics engineers" and adds the incubator. Catalogue PDFs remade.
- 2026-11-16: Merged the Faults tab removal and the Bouira university and incubator wording into `main`.

## Not done yet

See [todo.md](todo.md) and [bugs.md](bugs.md).
- 2026-11-17: Logic Gates Kit page (`#gates`): board drawn from the owner's KiCad file (`dev/gatespcb.py` → `dev/gatesdata.js`), clickable switches, power switch and jumper wires (one wire per pin, no output-to-output wires), live truth tables, examples (each gate, A AND NOT B, half adder). Home card and learning path show "Designed · not made yet" with the board drawing; catalogue tag updated. Checked: wiring logic by script; every page at 1280 and 375 px in 3 languages, no errors, no sideways scrolling.
- 2026-11-17: Hackathon materials: new slide 7 "Le kit portes logiques" (board picture from the website, captioned as an illustration, not yet made); pitch (FR and AR) and Q&A updated with the Logic Gates board.
- 2026-11-17: Design polish: more white space (bigger section gaps, larger headings), softer card shadows, sticky see-through header on home and kit pages, hero entrance and gentle floating picture, blocks fade up as you scroll, hero numbers count up, hover lifts on cards and buttons, FAQ answers slide in. All motion is off when the visitor's device asks for reduced motion. Fixed: the learning path still said "Coming soon" for the Logic Gates Kit. Checked every page at 1280 and 375 px in 3 languages: no errors, no sideways scrolling.
- 2026-11-17: Business Model Canvas PDF (A4 landscape) made for the hackathon in `hackathon/`, kept out of git (`.gitignore`) so it is not published with the website.
- 2026-11-18: Arduino All-in-One Kit page (`#arduino`) and home card, status "Designed · not made yet": board picture drawn from the owner's KiCad file by the new `dev/pcbrender.py`, 16 modules with pins and what each teaches, in 3 languages. Catalogue regenerated. Checked every page at 1280 and 375 px in 3 languages: no errors, no sideways scrolling.
- 2026-11-18: Arduino page: 3D model of the board built from the KiCad file (every part modelled: chips, LEDs, LCD, servo, ultrasonic, PIR, relay, sensors, connectors; drag to turn, zoom, tap a part to see what it does) and an Arduino simulator with 10 example programs (blink, button, potentiometer → servo, parking sensor, weather station, night light, motion alarm, spirit level, clap switch, remote control): sensors set with sliders, outputs on the 3D board, a 2D LCD, buzzer sound and a serial monitor. Works offline (three.js vendored, texture embedded). Checked: every page at 1280 and 375 px in 3 languages, picking and simulation by script.
- 2026-11-18: Arduino page reworked as the owner asked: the 3D view is replaced by a flat drawing of the board with every component drawn (chips with names, live LCD text, servo arm, LED glow, relay, buzzer waves); press the button, drag the potentiometer and tap the PIR directly on the board; tap any part for what it does. New Scratch-style block editor (control, outputs, screen, sensors, operators, variables): add, edit, nest, reorder and delete blocks; the Arduino code is generated live from the blocks; the 10 examples are now editable block programs; the student's program is saved in the browser. three.js removed. Checked: every page at 1280 and 375 px in 3 languages; examples, editing and code generation by script.
- 2026-11-18: Home card for the Arduino kit now shows the board with its components (`img/arduino-kit.png`, `node dev/ardkitimg.js`). Fixed: the relay's label was drawn upside down. Removed the unused `img/arduino-board.png`. Checked: every page at 1280 and 375 px in 3 languages; every string has its 3 languages.
- 2026-11-18: Hackathon plan reworked to be profitable from the first year: the three kits are sold from 2027 (50 CPU, 60 logic gates at 8,000 DA, 30 Arduino at 18,000 DA — proposed prices), giving about +530,500 DA in 2027, +1.99 M DA in 2028 and +4.4 M DA in 2029. Slides (money, roadmap, Arduino, BMC) and the speech document updated; the Arduino slide uses the board-with-components picture.
- 2026-11-19: Planned prices added (Logic Gates 8,000 DA, Arduino 18,000 DA) on the home cards, kit pages, catalogue and order tracker. Licence section removed from the About page (owner); the CERN-OHL-P credit line stays at the bottom of the home page and in the catalogue. Checked: 10 pages × 3 languages × 1280/375 px, no errors, no sideways scrolling; catalogue rebuilt.
