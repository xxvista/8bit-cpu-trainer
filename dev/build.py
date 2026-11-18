"""Rebuild ../index.html from the files in this folder.

Run:  python3 dev/build.py
Edit app.js (behaviour), strings.js (text in English, French, Arabic) or src.html (layout and styles),
then run this script and commit the new index.html.
Shop settings (prices, email, WhatsApp) are the SHOP object near the top of app.js.
"""
from pathlib import Path
here = Path(__file__).parent
src = (here / "src.html").read_text(encoding="utf8")
start = src.index("<script>", src.index('<div id="tip"></div>'))
end = src.rindex("</script>")
js = "\n".join([
    (here / "pcbdata.js").read_text(encoding="utf8"),
    (here / "gatesdata.js").read_text(encoding="utf8"),
    "const BOM=" + (here / "bom.json").read_text(encoding="utf8") + ";",
    (here / "strings.js").read_text(encoding="utf8"),
    (here / "app.js").read_text(encoding="utf8"),
    (here / "bench.js").read_text(encoding="utf8"),
    (here / "gates.js").read_text(encoding="utf8"),
    (here / "ard3ddata.js").read_text(encoding="utf8"),
    (here / "ardflat.js").read_text(encoding="utf8"),
    (here / "ardblocks.js").read_text(encoding="utf8"),
    (here / "ardsim.js").read_text(encoding="utf8"),
    (here / "arduino.js").read_text(encoding="utf8"),
    (here / "start.js").read_text(encoding="utf8"),
])
(here.parent / "index.html").write_text(src[:start] + "<script>\n" + js + "\n" + src[end:], encoding="utf8")
print("index.html rebuilt")
