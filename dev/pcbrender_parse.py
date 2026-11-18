"""Shared KiCad s-expression helpers for dev/pcbrender.py and dev/ard3dextract.py."""
import re

def parse(s):
    toks = re.findall(r'\(|\)|"(?:[^"\\]|\\.)*"|[^\s()]+', s)
    st = [[]]
    for t in toks:
        if t == "(": st.append([])
        elif t == ")": x = st.pop(); st[-1].append(x)
        elif t.startswith('"'): st[-1].append(t[1:-1].replace('\\"', '"').replace("\\n", "\n"))
        else: st[-1].append(t)
    return st[0][0]

kids = lambda n, name: [c for c in n if isinstance(c, list) and c and c[0] == name]
def kid(n, name):
    k = kids(n, name); return k[0] if k else None
def layers(n):
    l = kid(n, "layer")
    if l: return [l[1]]
    l = kid(n, "layers"); return l[1:] if l else []
def xy(n, name):
    k = kid(n, name); return (float(k[1]), float(k[2])) if k else None
def width(n):
    s = kid(n, "stroke")
    if s and kid(s, "width"): return float(kid(s, "width")[1])
    w = kid(n, "width"); return float(w[1]) if w else 0.12
f2 = lambda v: f"{v:.2f}".rstrip("0").rstrip(".")

