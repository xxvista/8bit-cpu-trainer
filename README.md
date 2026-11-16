# 8-Bit CPU Trainer

Website for the 8-bit SAP-1 computer teaching kit: a simulator drawn from the real PCB files, a user guide, a module catalog, lab exercises, a course map and a kit order page. English, French and Arabic.

## Use it

Open `index.html` in a browser. Everything is one static page plus the photos in `img/`; there is no server and nothing to install.

## Edit it

The page is built from the files in `dev/`:

| File | What it holds |
|---|---|
| `dev/app.js` | Simulator, board drawing, order form. Prices, email and WhatsApp number are in the `SHOP` object near the top. |
| `dev/strings.js` | All text in English, French and Arabic |
| `dev/src.html` | Page layout and styles |
| `dev/pcbdata.js`, `dev/bom.json` | Board outlines, parts and parts lists extracted from the KiCad files |

After editing, run `python3 dev/build.py` and commit the new `index.html`.

## Credits

The board design is based on the open-hardware 8-Bit PCB CPU project, released under the CERN Open Hardware Licence version 2, Permissive (CERN-OHL-P), which converts [Ben Eater's SAP-1 breadboard computer](https://eater.net/8bit) to printed circuit boards. The SAP-1 architecture comes from Malvino and Brown, *Digital Computer Electronics*.
