#!/usr/bin/env python3
"""Logic Gates board: KiCad .kicad_pcb -> dev/gatesdata.js (the drawing data for the website).
usage: python3 dev/gatespcb.py path/to/logic_gates_board.kicad_pcb
Writes GPCB = {w, h, parts, silk, sl, tr} in the same style as PCB in pcbdata.js:
 parts: {k: kind, r: reference, p: [x,y,...] pad centres, v: value, n: net name for 1-pin headers}
 silk:  [text, x, y, rot, size, justify]   sl: silkscreen line path   tr: copper track path."""
import sys, re, math, json, os

src = open(sys.argv[1], encoding="utf-8").read()

def parse(s):
    toks = re.findall(r'\(|\)|"(?:[^"\\]|\\.)*"|[^\s()]+', s)
    st = [[]]
    for t in toks:
        if t == "(": st.append([])
        elif t == ")": x = st.pop(); st[-1].append(x)
        elif t.startswith('"'): st[-1].append(t[1:-1].replace('\\"', '"').replace("\\n", "\n"))
        else: st[-1].append(t)
    return st[0][0]

root = parse(src)
def kids(n, name): return [c for c in n if isinstance(c, list) and c and c[0] == name]
def kid(n, name):
    k = kids(n, name); return k[0] if k else None
def layer(n):
    l = kid(n, "layer"); return l[1] if l else None
def xy(n, name):
    k = kid(n, name); return (float(k[1]), float(k[2]))

# board outline
ex, ey = [], []
for g in kids(root, "gr_line"):
    if layer(g) == "Edge.Cuts":
        for nm in ("start", "end"):
            x, y = xy(g, nm); ex.append(x); ey.append(y)
X0, Y0 = min(ex), min(ey)
W, H = max(ex) - X0, max(ey) - Y0
R = lambda v: round(v, 2)

def fp_tf(fp):
    at = kid(fp, "at"); fx, fy = float(at[1]), float(at[2]); rot = float(at[3]) if len(at) > 3 else 0.0
    c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    return lambda px, py: (fx + px * c + py * s - X0, fy - px * s + py * c - Y0)

KIND = {"LED_THT": "led", "Connector_PinHeader_2.54mm": "hdr", "Resistor_THT:R_Axial": "res", "Resistor_THT:R_Array": "sip",
        "Connector_USB": "usb", "MountingHole": "hole", "Capacitor_THT:CP_": "capp", "Capacitor_THT:C_Disc_D7.5": "fuse",
        "Capacitor_THT": "cap", "Package_DIP": "ic", "Button_Switch_THT:SW_DIP": "dipsw", "Button_Switch_THT:SW_Slide": "slide"}
def kind_of(lib):
    for k, v in KIND.items():
        if lib.startswith(k): return v
    return "other"

parts, sl = [], []
def seg_path(pts): return "M" + " L".join(f"{R(x)} {R(y)}" for x, y in pts)
for fp in kids(root, "footprint"):
    lib = fp[1]; tf = fp_tf(fp)
    props = {p[1]: p[2] for p in kids(fp, "property")}
    ref, val = props.get("Reference", ""), props.get("Value", "")
    pads = []
    for pd in kids(fp, "pad"):
        a = kid(pd, "at"); x, y = tf(float(a[1]), float(a[2])); pads.append((pd[1], x, y))
    def pk(p): return (0, int(p[0])) if p[0].isdigit() else (1, p[0])
    pads.sort(key=pk)
    seen, flat = set(), []
    for num, x, y in pads:
        if num in seen and kind_of(lib) != "usb": continue
        seen.add(num); flat += [R(x), R(y)]
    k = kind_of(lib)
    part = {"k": k, "r": ref, "p": flat}
    m = re.search(r"\(([^)]*)\)", val)
    if k == "hdr" and m: part["n"] = m.group(1)
    elif k == "led": part["v"] = "green" if "green" in val else "red"; part["n"] = m.group(1) if m else ""
    elif k not in ("hole",): part["v"] = val
    parts.append(part)

silk = []
for g in kids(root, "gr_text"):
    if layer(g) != "F.SilkS": continue
    at = kid(g, "at"); x, y = float(at[1]) - X0, float(at[2]) - Y0
    sz = float(kid(kid(kid(g, "effects"), "font"), "size")[1])
    n = g[1].count("\n")
    silk.append([g[1], R(x), R(y + sz * 0.5 + n * sz * 0.75), 0, sz, "s"])   # left/top text -> centre of the block, as silkText expects
for g in kids(root, "gr_line"):
    if layer(g) == "F.SilkS":
        (a, b), (c, d) = xy(g, "start"), xy(g, "end")
        sl.append(((a - X0, b - Y0), (c - X0, d - Y0)))
# join touching silk segments into polylines (smaller output)
paths, cur = [], None
for a, b in sl:
    if cur and abs(cur[-1][0] - a[0]) < 1e-3 and abs(cur[-1][1] - a[1]) < 1e-3: cur.append(b)
    else: cur = [a, b]; paths.append(cur)
slp = "".join(seg_path(p) for p in paths)

tr = []
for s_ in kids(root, "segment"):
    (a, b), (c, d) = xy(s_, "start"), xy(s_, "end")
    tr.append(((a - X0, b - Y0), (c - X0, d - Y0)))
paths, cur = [], None
for a, b in tr:
    if cur and abs(cur[-1][0] - a[0]) < 1e-3 and abs(cur[-1][1] - a[1]) < 1e-3: cur.append(b)
    else: cur = [a, b]; paths.append(cur)
trp = "".join(seg_path(p) for p in paths)
vias = []
for v in kids(root, "via"):
    x, y = xy(v, "at"); vias += [R(x - X0), R(y - Y0)]

out = {"w": R(W), "h": R(H), "parts": parts, "silk": silk, "sl": slp, "tr": trp, "via": vias}
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gatesdata.js")
open(dst, "w", encoding="utf-8").write("/* made by dev/gatespcb.py from logic_gates_board.kicad_pcb; do not edit by hand */\nconst GPCB=" + json.dumps(out, separators=(",", ":"), ensure_ascii=False) + ";\n")
print(f"wrote {dst}: {W:.1f} x {H:.1f} mm, {len(parts)} parts, {len(silk)} texts, {len(tr)} track segments, {len(vias)//2} vias, {os.path.getsize(dst)//1024} kB")
