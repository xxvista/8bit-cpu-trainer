#!/usr/bin/env python3
"""Arduino kit board: KiCad .kicad_pcb -> dev/ard3ddata.js (parts for the 3D view).
usage: python3 dev/ard3dextract.py board.kicad_pcb
Each part: r ref, v value, f footprint name, x y (mm from the board's top-left), a rotation (deg),
w h (body size from the courtyard, local axes), p pads [x,y,w,h] in local coordinates."""
import sys, re, json, math, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pcbrender_parse import parse, kids, kid, layers, xy
root = parse(open(sys.argv[1], encoding="utf-8").read())
ex, ey = [], []
for g in root:
    if isinstance(g, list) and g[0] in ("gr_line", "gr_rect", "gr_arc") and "Edge.Cuts" in layers(g):
        for nm in ("start", "end", "mid"):
            p = xy(g, nm)
            if p: ex.append(p[0]); ey.append(p[1])
X0, Y0 = min(ex), min(ey); W, H = max(ex) - X0, max(ey) - Y0
R = lambda v: round(v, 2)
parts = []
for fp in kids(root, "footprint"):
    if "B.Cu" in layers(fp): continue
    at = kid(fp, "at"); fx, fy = float(at[1]), float(at[2]); rot = float(at[3]) if len(at) > 3 else 0.0
    props = {p[1]: p[2] for p in kids(fp, "property")}
    cx, cy = [], []
    for it in fp:
        if isinstance(it, list) and it[0] in ("fp_line", "fp_rect", "fp_circle", "fp_poly", "fp_arc") and "F.CrtYd" in layers(it):
            for nm in ("start", "end", "mid", "center"):
                p = xy(it, nm)
                if p: cx.append(p[0]); cy.append(p[1])
            if it[0] == "fp_circle":
                c, e = xy(it, "center"), xy(it, "end"); r = math.hypot(e[0]-c[0], e[1]-c[1]); cx += [c[0]-r, c[0]+r]; cy += [c[1]-r, c[1]+r]
            if it[0] == "fp_poly":
                for q in kid(it, "pts")[1:]: cx.append(float(q[1])); cy.append(float(q[2]))
    pads = []
    for pd in kids(fp, "pad"):
        a = kid(pd, "at"); sz = kid(pd, "size"); prot = float(a[3]) if len(a) > 3 else rot
        pw, ph = float(sz[1]), float(sz[2])
        if round((prot - rot) % 180) == 90: pw, ph = ph, pw
        pads.append([R(float(a[1])), R(float(a[2])), R(pw), R(ph), 1 if pd[2] == "thru_hole" else 0])
    if not cx and pads:
        cx = [p[0]-p[2]/2 for p in pads] + [p[0]+p[2]/2 for p in pads]; cy = [p[1]-p[3]/2 for p in pads] + [p[1]+p[3]/2 for p in pads]
    if not cx: continue
    parts.append({"r": props.get("Reference", ""), "v": props.get("Value", ""), "f": fp[1].split(":")[-1],
                  "x": R(fx - X0), "y": R(fy - Y0), "a": rot, "bx": R((min(cx)+max(cx))/2), "by": R((min(cy)+max(cy))/2),
                  "w": R(max(cx)-min(cx)), "h": R(max(cy)-min(cy)), "p": pads})
out = {"w": R(W), "h": R(H), "parts": parts}
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ard3ddata.js")
open(dst, "w", encoding="utf-8").write("/* made by dev/ard3dextract.py from the Arduino kit's .kicad_pcb; do not edit by hand */\nconst A3D=" + json.dumps(out, separators=(",", ":"), ensure_ascii=False) + ";\n")
print(f"wrote {dst}: {len(parts)} parts, {os.path.getsize(dst)//1024} kB")
