# Electronics Kits Lab

_(placeholder company name)_

Website for a startup selling hands-on electronics teaching kits, in English, French and Arabic. The home page lets visitors choose a kit:

- **8-Bit CPU Trainer** (available): a simulator drawn from the real PCB files, a user guide, a module catalog, lab exercises, a course map and a kit order page.
- **Logic Gates Kit** and **Arduino Model Kit**: coming soon (placeholder pages with a contact button).

Project status: see [progress.md](progress.md), [todo.md](todo.md) and [bugs.md](bugs.md).

## Use it

Open `index.html` in a browser. Everything is one static page plus the photos in `img/`; there is no server and nothing to install.

## Edit it

The page is built from the files in `dev/`:

| File | What it holds |
|---|---|
| `dev/app.js` | Home page, kit list (`KITS`), company name (`BRAND`), simulator, board drawing, order form. Prices, email and WhatsApp number are in the `SHOP` object near the top. |
| `dev/strings.js` | All text in English, French and Arabic |
| `dev/src.html` | Page layout and styles |
| `dev/pcbdata.js`, `dev/bom.json` | Board outlines, parts and parts lists extracted from the KiCad files |

After editing, run `python3 dev/build.py` and commit the new `index.html`.

## Credits

The board design is based on the open-hardware 8-Bit PCB CPU project, released under the CERN Open Hardware Licence version 2, Permissive (CERN-OHL-P), which converts [Ben Eater's SAP-1 breadboard computer](https://eater.net/8bit) to printed circuit boards. The SAP-1 architecture comes from Malvino and Brown, *Digital Computer Electronics*.
