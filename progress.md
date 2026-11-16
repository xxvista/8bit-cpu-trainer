# Progress

Last updated: 2026-11-16

## Status

The website is built and works offline: open `index.html` in a browser. The whole project so far is one commit (`f89695f`, "Add 8-Bit CPU Trainer website"). `main` and the working branch point at the same commit.

## Done

| Area | What exists | Where |
|---|---|---|
| Simulator | SAP-1 CPU: microcode, ALU, flags, 16-byte RAM, assembler with labels, disassembler, step / instruction / run / back / reset, speed control | `dev/app.js` |
| Board drawing | Boards drawn from the KiCad PCB outlines and parts, with board-colour options | `dev/app.js`, `dev/pcbdata.js`, `dev/bom.json` |
| Teaching panels | State, Program, RAM, Microcode, Timing, Faults (fault-finding exercises), Trace | `dev/src.html`, `dev/app.js` |
| Example programs | 7 programs: count by 3, add, subtract, count down, carry, multiply, fetch cycle | `EXAMPLES` in `dev/app.js` |
| Content pages | User guide, module catalog, lab exercises, course map, about | `dev/src.html`, `dev/strings.js` |
| Kit order page | Order form that sends by email or WhatsApp | `SHOP` in `dev/app.js` |
| Languages | English, French, Arabic (right-to-left); all strings have all 3 translations | `dev/strings.js` |
| Photos | 6 product photos | `img/` |
| Build | `python3 dev/build.py` combines everything into `index.html` | `dev/build.py` |
| Docs | README with how to use, edit and credits | `README.md` |

## Checked (browser test, 2026-11-16)

- [x] All 7 pages load in all 3 languages, desktop (1280 px) and phone (375 px)
- [x] No JavaScript errors, no broken images, no missing translations
- [x] All 7 example programs assemble and give the expected output (`count3` loops on purpose and never halts)
- [x] Step, Run and Reset work
- [x] `index.html` matches a fresh build of `dev/`
- [ ] Order form actually sends an email / opens WhatsApp (not tested)
- [ ] Printing, and other browsers (only Chromium tested)

## Not done yet

See [todo.md](todo.md) for the full list and [bugs.md](bugs.md) for known bugs.

- Kit prices are not set (order page shows "price on request")
- Site is not published online yet
