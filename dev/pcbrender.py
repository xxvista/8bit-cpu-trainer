#!/usr/bin/env python3
"""Draw a KiCad board (top side) as an SVG illustration: outline, copper tracks, vias, pads and silkscreen.
usage: python3 dev/pcbrender.py board.kicad_pcb out.svg
Used for the Arduino board drawing (img/arduino-board.svg); the page draws the components over it (dev/ardflat.js)."""
import sys, re, math, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pcbrender_parse import parse, kids, kid, layers, xy, width
root = parse(open(sys.argv[1], encoding="utf-8").read())
f2 = lambda v: f"{v:.2f}".rstrip("0").rstrip(".")

# outline bounding box
ex, ey = [], []
for g in root:
    if isinstance(g, list) and g[0] in ("gr_line", "gr_rect", "gr_arc") and "Edge.Cuts" in layers(g):
        for nm in ("start", "end", "mid"):
            p = xy(g, nm)
            if p: ex.append(p[0]); ey.append(p[1])
X0, Y0, X1, Y1 = min(ex), min(ey), max(ex), max(ey)
W, H = X1 - X0, Y1 - Y0
P = lambda x, y: (x - X0, y - Y0)

def arc_path(a, m, b):
    (ax, ay), (mx, my), (bx, by) = a, m, b
    d = 2 * (ax * (my - by) + mx * (by - ay) + bx * (ay - my))
    if abs(d) < 1e-9: return f"M{f2(ax)} {f2(ay)}L{f2(bx)} {f2(by)}"
    ux = ((ax*ax+ay*ay)*(my-by)+(mx*mx+my*my)*(by-ay)+(bx*bx+by*by)*(ay-my))/d
    uy = ((ax*ax+ay*ay)*(bx-mx)+(mx*mx+my*my)*(ax-bx)+(bx*bx+by*by)*(mx-ax))/d
    r = math.hypot(ax-ux, ay-uy)
    cross = (mx-ax)*(by-ay)-(my-ay)*(bx-ax)
    sweep = 1 if cross > 0 else 0
    ang = lambda x, y: math.atan2(y-uy, x-ux)
    tot = (ang(bx, by)-ang(ax, ay)) % (2*math.pi)
    if not sweep: tot = 2*math.pi - tot
    large = 1 if tot > math.pi else 0
    return f"M{f2(ax)} {f2(ay)}A{f2(r)} {f2(r)} 0 {large} {sweep} {f2(bx)} {f2(by)}"

silk, trF, trB, vias, pads, texts = [], [], [], [], [], []
def silk_item(g, tf):
    k = g[0].split("_", 1)[1]; w = width(g)
    if k == "line":
        a, b = tf(*xy(g, "start")), tf(*xy(g, "end")); silk.append((f"M{f2(a[0])} {f2(a[1])}L{f2(b[0])} {f2(b[1])}", w))
    elif k == "rect":
        (ax, ay), (bx, by) = xy(g, "start"), xy(g, "end")
        pts = [tf(ax, ay), tf(bx, ay), tf(bx, by), tf(ax, by)]
        silk.append(("M" + "L".join(f"{f2(x)} {f2(y)}" for x, y in pts) + "Z", w))
    elif k == "circle":
        c, e = tf(*xy(g, "center")), tf(*xy(g, "end")); r = math.hypot(e[0]-c[0], e[1]-c[1])
        silk.append((f"M{f2(c[0]-r)} {f2(c[1])}a{f2(r)} {f2(r)} 0 1 0 {f2(2*r)} 0a{f2(r)} {f2(r)} 0 1 0 {f2(-2*r)} 0", w))
    elif k == "arc":
        silk.append((arc_path(tf(*xy(g, "start")), tf(*xy(g, "mid")), tf(*xy(g, "end"))), w))
    elif k == "poly":
        pts = [tf(float(p[1]), float(p[2])) for p in kid(g, "pts")[1:] if p[0] == "xy"]
        if pts: silk.append(("M" + "L".join(f"{f2(x)} {f2(y)}" for x, y in pts) + "Z", w))

for g in root:
    if not isinstance(g, list): continue
    t = g[0]
    if t in ("gr_line", "gr_rect", "gr_circle", "gr_arc", "gr_poly") and "F.SilkS" in layers(g):
        silk_item(g, P)
    elif t == "gr_text" and "F.SilkS" in layers(g):
        s = g[1]
        if re.fullmatch(r"[\d.]+ mm", s): continue
        at = kid(g, "at"); x, y = P(float(at[1]), float(at[2])); rot = float(at[3]) if len(at) > 3 else 0
        eff = kid(g, "effects"); size = float(kid(kid(eff, "font"), "size")[1]) if eff else 1.0
        j = kid(eff, "justify") if eff else None; just = j[1:] if j else []
        texts.append((s, x, y, rot, size, just))
    elif t == "segment":
        a, b = P(*xy(g, "start")), P(*xy(g, "end")); w = float(kid(g, "width")[1])
        (trF if "F.Cu" in layers(g) else trB).append((f"M{f2(a[0])} {f2(a[1])}L{f2(b[0])} {f2(b[1])}", w))
    elif t == "via":
        x, y = P(*xy(g, "at")); vias.append((x, y, float(kid(g, "size")[1]) / 2))
    elif t == "footprint":
        at = kid(g, "at"); fx, fy = float(at[1]), float(at[2]); frot = float(at[3]) if len(at) > 3 else 0.0
        if "B.Cu" in layers(g): continue  # parts on the back are not drawn
        c, s_ = math.cos(math.radians(frot)), math.sin(math.radians(frot))
        tf = lambda px, py, fx=fx, fy=fy, c=c, s_=s_: P(fx + px*c + py*s_, fy - px*s_ + py*c)
        for it in g:
            if isinstance(it, list) and it[0] in ("fp_line", "fp_rect", "fp_circle", "fp_arc", "fp_poly") and "F.SilkS" in layers(it):
                silk_item(it, tf)
        for pd in kids(g, "pad"):
            ls = layers(pd)
            if not any(l in ("F.Cu", "*.Cu") for l in ls): continue
            a = kid(pd, "at"); px, py = float(a[1]), float(a[2]); prot = float(a[3]) if len(a) > 3 else frot
            x, y = tf(px, py); sz = kid(pd, "size"); w, h = float(sz[1]), float(sz[2])
            drill = kid(pd, "drill"); dr = float(drill[1]) / 2 if drill and len(drill) > 1 and drill[1] != "oval" else 0
            pads.append((x, y, w, h, prot, pd[3], dr))

css = """.m{fill:#1d6b45}.tb{fill:none;stroke:#1f7a4d;stroke-linecap:round}.tf{fill:none;stroke:#2e9460;stroke-linecap:round}
.v{fill:#d9b34a}.vh{fill:#0f3a25}.p{fill:#d9b34a}.ph{fill:#0f3a25}.s{fill:none;stroke:#f2f6f1;stroke-linecap:round;stroke-linejoin:round}
.t{fill:#f2f6f1;font-family:'Saira Condensed','Arial Narrow',Arial,sans-serif;font-weight:600}"""
o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 {f2(W+4)} {f2(H+4)}" width="{f2((W+4)*8)}" height="{f2((H+4)*8)}"><style>{css}</style>',
     f'<rect class="m" x="0" y="0" width="{f2(W)}" height="{f2(H)}" rx="2"/>']
def group(items, cls):
    byw = {}
    for d, w in items: byw.setdefault(round(w, 2), []).append(d)
    for w, ds in byw.items(): o.append(f'<path class="{cls}" stroke-width="{f2(w)}" d="{"".join(ds)}"/>')
group(trB, "tb"); group(trF, "tf")
for x, y, r in vias: o.append(f'<circle class="v" cx="{f2(x)}" cy="{f2(y)}" r="{f2(r)}"/>')
for x, y, w, h, rot, shape, dr in pads:
    tr = f' transform="rotate({f2(-rot)} {f2(x)} {f2(y)})"' if rot else ""
    if shape == "circle": o.append(f'<circle class="p" cx="{f2(x)}" cy="{f2(y)}" r="{f2(w/2)}"/>')
    else:
        rx = min(w, h) / 2 if shape == "oval" else (min(w, h) * 0.25 if shape == "roundrect" else 0)
        o.append(f'<rect class="p" x="{f2(x-w/2)}" y="{f2(y-h/2)}" width="{f2(w)}" height="{f2(h)}" rx="{f2(rx)}"{tr}/>')
    if dr: o.append(f'<circle class="ph" cx="{f2(x)}" cy="{f2(y)}" r="{f2(dr)}"/>')
group(silk, "s")
for s, x, y, rot, size, just in texts:
    anchor = "start" if "left" in just else "end" if "right" in just else "middle"
    lines = s.split("\n"); n = len(lines)
    y0 = y - (n - 1) * size * 0.6 + size * 0.35
    tr = f' transform="rotate({f2(-rot)} {f2(x)} {f2(y)})"' if rot else ""
    o.append(f'<text class="t" font-size="{f2(size*1.25)}" text-anchor="{anchor}"{tr}>' + "".join(
        f'<tspan x="{f2(x)}" y="{f2(y0 + i*size*1.2)}">{l.replace("&","&amp;").replace("<","&lt;")}</tspan>' for i, l in enumerate(lines)) + "</text>")
o.append("</svg>")
open(sys.argv[2], "w", encoding="utf-8").write("\n".join(o))
print(f"{sys.argv[2]}: {W:.1f} x {H:.1f} mm, {len(pads)} pads, {len(trF)+len(trB)} tracks, {len(vias)} vias, {len(silk)} silk items, {len(texts)} texts")
