"""Build the web logo set from the owner's brand package (brand/source/*.svg).

The supplied SVGs draw "HouseClearances.ie" and the tagline as <text> in Arial. Android and
Linux have no Arial, so the browser substitutes a wider font and ".ie" can clip at the edge of
the viewBox. This script converts every <text> to outlined <path>s using Arial Bold (what the
designer's Windows machine rendered for font-weight 800), so the logo looks identical everywhere.

Outputs (site-assets/images/brand/):
  logo.svg              full colour lockup with tagline (as supplied, outlined)
  logo-white.svg        white lockup with tagline, for the navy footer
  logo-header.svg       colour lockup WITHOUT the tagline, for the header (tagline is unreadable
                        at header height); viewBox trimmed to the artwork
  mark.svg              the house mark alone

Run: python build/brand/make_logos.py   (needs fontTools; Windows Arial Bold)
"""
import os
import re
import xml.etree.ElementTree as ET

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'brand', 'source')
OUT = os.path.join(ROOT, 'site-assets', 'images', 'brand')
FONT = TTFont(r'C:\Windows\Fonts\arialbd.ttf')
GLYPHS = FONT.getGlyphSet()
CMAP = FONT.getBestCmap()
UPM = FONT['head'].unitsPerEm
HMTX = FONT['hmtx']
KERN = {}
if 'kern' in FONT:
    for sub in FONT['kern'].kernTables:
        KERN.update(sub.kernTable)

SVG_NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG_NS)


def text_path(s, x, y, size, spacing=0.0):
    """Outline string s at baseline (x, y) and return (path d, advance width)."""
    scale = size / UPM
    pen = SVGPathPen(GLYPHS)
    cx, prev = x, None
    for ch in s:
        g = CMAP.get(ord(ch))
        if g is None:
            continue
        if prev is not None:
            cx += KERN.get((prev, g), 0) * scale
        tpen = TransformPen(pen, (scale, 0, 0, -scale, cx, y))
        GLYPHS[g].draw(tpen)
        cx += HMTX[g][0] * scale + spacing
        prev = g
    return pen.getCommands(), cx - x


def outline(svg_text, drop_tagline=False):
    root = ET.fromstring(svg_text)
    for parent in list(root.iter()):
        for el in list(parent):
            if el.tag != f'{{{SVG_NS}}}text':
                continue
            x, y = float(el.get('x')), float(el.get('y'))
            size = float(el.get('font-size'))
            spacing = float(el.get('letter-spacing', 0))
            fill = el.get('fill')
            is_tagline = 'CLEAR' in ''.join(el.itertext())
            idx = list(parent).index(el)
            parent.remove(el)
            if drop_tagline and is_tagline:
                continue
            g = ET.Element(f'{{{SVG_NS}}}g')
            # Leading text, then each <tspan> continues on the same baseline with its own fill.
            runs = [(el.text or '', fill)] + [(t.text or '', t.get('fill', fill)) for t in el]
            cx = x
            for s, f in runs:
                if not s:
                    continue
                d, adv = text_path(s, cx, y, size, spacing)
                ET.SubElement(g, f'{{{SVG_NS}}}path', {'d': d, 'fill': f})
                cx += adv
            parent.insert(idx, g)
    return root


def write(root, name, viewbox=None, title='HouseClearances.ie'):
    if viewbox:
        root.set('viewBox', viewbox)
    vb = [float(v) for v in root.get('viewBox').split()]
    root.set('width', str(int(vb[2])))
    root.set('height', str(int(vb[3])))
    t = ET.Element(f'{{{SVG_NS}}}title')
    t.text = title
    root.insert(0, t)
    root.set('role', 'img')
    data = ET.tostring(root, encoding='unicode')
    # Round coordinates to 2 dp to keep files small.
    data = re.sub(r'(\d+\.\d{2})\d+', r'\1', data)
    with open(os.path.join(OUT, name), 'w', encoding='utf-8') as fh:
        fh.write(data)
    print(f'{name}: {len(data)} bytes, viewBox {root.get("viewBox")}')


def main():
    os.makedirs(OUT, exist_ok=True)
    primary = open(os.path.join(SRC, 'logo-primary.svg'), encoding='utf-8').read()
    white = open(os.path.join(SRC, 'logo-white.svg'), encoding='utf-8').read()
    # Supplied canvas is 760x150; trim to the artwork (mark spans y 27-139 incl. stroke and mitre).
    write(outline(primary), 'logo.svg', '0 18 760 126')
    write(outline(white), 'logo-white.svg', '0 18 760 126')
    write(outline(primary, drop_tagline=True), 'logo-header.svg', '2 22 698 122')
    mark = ET.fromstring(primary)
    for el in list(mark):
        if el.tag == f'{{{SVG_NS}}}text':
            mark.remove(el)
    write(mark, 'mark.svg', '4 22 128 122')


if __name__ == '__main__':
    main()


def make_og_svg():
    """Share card (1200x630) for pages without their own photo: the owner's real van photo on the
    right, a navy panel with the white logo and a short headline on the left. Written to
    brand/og-card.svg; build/brand/make_raster.js turns it into site-assets/images/brand/og-default.jpg."""
    import base64
    van = base64.b64encode(open(os.path.join(SRC, 'van-hero.jpg'), 'rb').read()).decode()
    logo = outline(open(os.path.join(SRC, 'logo-white.svg'), encoding='utf-8').read())
    logo_xml = ''.join(ET.tostring(c, encoding='unicode') for c in logo)
    lines = []
    for i, s in enumerate(['House clearance', 'across Dublin', '& Leinster']):
        d, _ = text_path(s, 48, 262 + i * 60, 54)
        lines.append(f'<path d="{d}" fill="#FFFFFF"/>')
    d_sub, _ = text_path('Free quotes  •  Send photos on WhatsApp', 48, 470, 25)
    d_tel, w_tel = text_path('083 090 4545', 72, 548, 30)
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
<defs><linearGradient id="fade" x1="0" x2="1" y1="0" y2="0">
<stop offset="0" stop-color="#102A43"/><stop offset="0.62" stop-color="#102A43"/><stop offset="1" stop-color="#102A43" stop-opacity="0"/></linearGradient></defs>
<rect width="1200" height="630" fill="#102A43"/>
<image x="430" y="0" width="770" height="630" preserveAspectRatio="xMidYMid slice" xlink:href="data:image/jpeg;base64,{van}"/>
<rect x="0" y="0" width="760" height="630" fill="url(#fade)"/>
<g transform="translate(40 38) scale(0.6) translate(0 -18)">{logo_xml}</g>
{''.join(lines)}
<path d="{d_sub}" fill="#E6EDF3"/>
<rect x="48" y="508" width="{w_tel + 48:.0f}" height="58" rx="29" fill="#F59E0B"/>
<path d="{d_tel}" fill="#102A43"/>
<rect x="0" y="618" width="1200" height="12" fill="#2E7D32"/>
</svg>'''
    path = os.path.join(ROOT, 'brand', 'og-card.svg')
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(svg)
    print('og-card.svg written')


if __name__ == '__main__':
    make_og_svg()
