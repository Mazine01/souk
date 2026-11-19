"""Draws the original flat illustrations used as Souk's demo product images.
Run: python3 server/scripts/draw_products.py client/public/products
Replace them with your own photos any time (admin > edit product > image links)."""
import sys, os, math, json
OUT = sys.argv[1]

def star(cx, cy, r1, r2, n=8, rot=0):
    pts = []
    for i in range(n * 2):
        r = r1 if i % 2 == 0 else r2
        a = math.pi * i / n + rot
        pts.append(f"{cx + r*math.cos(a):.1f},{cy + r*math.sin(a):.1f}")
    return " ".join(pts)

def zellige(color, alt, op=0.22):
    s = ''.join(f'<polygon points="{star(x, y, 22, 10)}" fill="{color if (x//60 + y//60) % 2 else alt}" opacity="{op}"/>'
                for x in range(30, 800, 60) for y in range(30, 140, 60))
    return s

def shell(bg, body, band=None):
    b = f'<g>{zellige(*band)}</g>' if band else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><rect width="800" height="800" fill="{bg}"/>{b}<ellipse cx="400" cy="690" rx="250" ry="26" fill="#000" opacity=".08"/>{body}</svg>'

def bowl(c, a, inner):
    return (f'<path d="M150 380 Q160 640 400 660 Q640 640 650 380 Z" fill="{c}"/>'
            f'<ellipse cx="400" cy="380" rx="250" ry="60" fill="{inner}"/>'
            f'<ellipse cx="400" cy="388" rx="215" ry="44" fill="{c}" opacity=".35"/>'
            + ''.join(f'<circle cx="{220+i*45}" cy="{500 + 20*math.sin(i)}" r="11" fill="{a}"/>' for i in range(9))
            + f'<path d="M190 450 Q400 520 610 450" stroke="{a}" stroke-width="8" fill="none"/>'
            f'<rect x="330" y="650" width="140" height="22" rx="8" fill="{c}"/>')

def plate(c, a, bg2):
    s = f'<circle cx="400" cy="400" r="270" fill="{bg2}"/><circle cx="400" cy="400" r="250" fill="{c}"/><circle cx="400" cy="400" r="175" fill="{bg2}"/>'
    s += f'<polygon points="{star(400,400,150,70,8)}" fill="{c}"/><polygon points="{star(400,400,70,34,8,math.pi/8)}" fill="{a}"/><circle cx="400" cy="400" r="18" fill="{bg2}"/>'
    s += ''.join(f'<circle cx="{400+212*math.cos(i*math.pi/8):.1f}" cy="{400+212*math.sin(i*math.pi/8):.1f}" r="13" fill="{a}"/>' for i in range(16))
    return s

def tagine(c, a, base):
    return (f'<path d="M180 560 Q190 620 400 630 Q610 620 620 560 Z" fill="{base}"/>'
            f'<ellipse cx="400" cy="560" rx="225" ry="34" fill="{base}"/>'
            f'<path d="M210 555 Q300 520 360 260 Q400 190 440 260 Q500 520 590 555 Z" fill="{c}"/>'
            f'<circle cx="400" cy="210" r="30" fill="{c}"/><circle cx="400" cy="210" r="14" fill="{a}"/>'
            f'<path d="M265 500 Q400 470 535 500" stroke="{a}" stroke-width="10" fill="none"/>'
            f'<path d="M305 400 Q400 380 495 400" stroke="{a}" stroke-width="8" fill="none"/>'
            + ''.join(f'<circle cx="{290+i*44}" cy="{455 - (abs(2-i)*-2)}" r="8" fill="{a}"/>' for i in range(5)))

def teapot(c, a, _):
    return (f'<path d="M260 360 Q250 580 400 600 Q550 580 540 360 Z" fill="{c}"/>'
            f'<path d="M300 360 Q330 250 400 240 Q470 250 500 360 Z" fill="{c}"/>'
            f'<circle cx="400" cy="225" r="24" fill="{a}"/><rect x="392" y="190" width="16" height="20" rx="6" fill="{a}"/>'
            f'<path d="M540 420 Q640 400 680 300" stroke="{c}" stroke-width="26" fill="none" stroke-linecap="round"/>'
            f'<path d="M262 400 Q170 420 200 520 Q220 560 268 540" stroke="{c}" stroke-width="22" fill="none"/>'
            f'<path d="M275 460 Q400 490 525 460" stroke="{a}" stroke-width="9" fill="none"/>'
            f'<polygon points="{star(400,520,34,16,8)}" fill="{a}"/><rect x="320" y="595" width="160" height="26" rx="10" fill="{c}"/>')

def glasses(c, a, _):
    s = ''
    for i, x in enumerate([230, 400, 570]):
        y = 300 if i == 1 else 340
        s += (f'<path d="M{x-70} {y} L{x-55} {y+290} Q{x} {y+305} {x+55} {y+290} L{x+70} {y} Z" fill="{c}" opacity=".85"/>'
              f'<path d="M{x-62} {y+120} L{x+62} {y+120} L{x+55} {y+290} Q{x} {y+305} {x-55} {y+290} Z" fill="{a}" opacity=".55"/>'
              + ''.join(f'<circle cx="{x-40+k*20}" cy="{y+60}" r="6" fill="{a}"/>' for k in range(5)))
    return s

def lantern(c, a, glow):
    s = f'<circle cx="400" cy="430" r="230" fill="{glow}" opacity=".35"/>'
    s += f'<rect x="392" y="80" width="16" height="70" fill="{c}"/><circle cx="400" cy="78" r="18" fill="none" stroke="{c}" stroke-width="8"/>'
    s += f'<path d="M330 150 L470 150 L520 240 L280 240 Z" fill="{c}"/>'
    s += f'<path d="M280 240 L520 240 L560 520 L240 520 Z" fill="{c}"/>'
    for r in range(4):
        for k in range(5):
            s += f'<polygon points="{star(310+k*45, 290+r*60, 14, 7, 8)}" fill="{glow}"/>'
    s += f'<path d="M240 520 L560 520 L470 610 L330 610 Z" fill="{c}"/><rect x="370" y="610" width="60" height="30" rx="6" fill="{a}"/>'
    return s

def rug(c, a, field):
    s = f'<rect x="170" y="110" width="460" height="600" rx="6" fill="{field}"/>'
    s += ''.join(f'<rect x="{180+i*16}" y="96" width="6" height="18" fill="{field}"/><rect x="{180+i*16}" y="706" width="6" height="18" fill="{field}"/>' for i in range(28))
    for r in range(4):
        cy = 190 + r * 150
        s += f'<polygon points="400,{cy-70} 520,{cy} 400,{cy+70} 280,{cy}" fill="none" stroke="{c}" stroke-width="12"/>'
        s += f'<polygon points="400,{cy-26} 445,{cy} 400,{cy+26} 355,{cy}" fill="{a}"/>'
    s += f'<rect x="190" y="130" width="420" height="560" fill="none" stroke="{c}" stroke-width="6" opacity=".6"/>'
    return s

def pouf(c, a, top):
    return (f'<ellipse cx="400" cy="590" rx="250" ry="70" fill="{c}"/>'
            f'<rect x="150" y="380" width="500" height="210" fill="{c}"/>'
            f'<ellipse cx="400" cy="380" rx="250" ry="80" fill="{top}"/>'
            f'<polygon points="{star(400,380,120,55,8)}" fill="{a}" transform="scale(1 .32) translate(0 {380/0.32-380})"/>'
            + ''.join(f'<path d="M{170+i*58} 420 L{170+i*58} 580" stroke="{a}" stroke-width="6" opacity=".7"/>' for i in range(9))
            + f'<path d="M150 470 Q400 540 650 470" stroke="{top}" stroke-width="10" fill="none"/>')

def basket(c, a, _):
    s = f'<path d="M180 330 L230 640 Q400 670 570 640 L620 330 Z" fill="{c}"/>'
    for i in range(7):
        y = 360 + i * 42
        s += f'<path d="M{185+i*7} {y} Q400 {y+18} {615-i*7} {y}" stroke="{a}" stroke-width="7" fill="none" opacity=".75"/>'
    s += f'<ellipse cx="400" cy="330" rx="220" ry="36" fill="{a}"/>'
    s += f'<path d="M260 330 Q260 170 400 170 Q540 170 540 330" stroke="{c}" stroke-width="22" fill="none"/>'
    s += f'<rect x="230" y="470" width="340" height="40" fill="{a}" opacity=".9"/>'
    return s

def babouche(c, a, sole):
    s = ''
    for dx, dy in [(-120, 30), (110, -10)]:
        s += (f'<g transform="translate({dx} {dy})"><path d="M250 560 Q240 300 400 220 Q560 300 550 560 Q400 600 250 560 Z" fill="{sole}"/>'
              f'<path d="M262 545 Q255 320 400 245 Q545 320 538 545 Q400 580 262 545 Z" fill="{c}"/>'
              f'<path d="M290 430 Q400 470 510 430 L520 545 Q400 575 280 545 Z" fill="{sole}" opacity=".45"/>'
              f'<polygon points="{star(400,330,30,13,8)}" fill="{a}"/></g>')
    return s

def cushion(c, a, b):
    s = f'<path d="M180 220 Q400 190 620 220 Q650 400 620 580 Q400 610 180 580 Q150 400 180 220 Z" fill="{c}"/>'
    s += f'<rect x="250" y="290" width="300" height="220" fill="none" stroke="{a}" stroke-width="10"/>'
    s += f'<polygon points="{star(400,400,80,36,8)}" fill="{a}"/><polygon points="{star(400,400,30,14,8,math.pi/8)}" fill="{b}"/>'
    s += ''.join(f'<circle cx="{x}" cy="{y}" r="16" fill="{a}"/>' for x, y in [(180,220),(620,220),(180,580),(620,580)])
    return s

def mirror(c, a, glass):
    s = f'<path d="M230 650 L230 330 Q230 140 400 140 Q570 140 570 330 L570 650 Z" fill="{c}"/>'
    s += f'<path d="M290 600 L290 340 Q290 205 400 205 Q510 205 510 340 L510 600 Z" fill="{glass}"/>'
    s += f'<path d="M330 260 L460 520" stroke="#fff" stroke-width="14" opacity=".35"/>'
    s += ''.join(f'<circle cx="{260}" cy="{360+i*48}" r="9" fill="{a}"/><circle cx="{540}" cy="{360+i*48}" r="9" fill="{a}"/>' for i in range(6))
    s += f'<polygon points="{star(400,172,20,9,8)}" fill="{a}"/>'
    return s

def box(c, a, lid):
    return (f'<rect x="210" y="380" width="380" height="230" rx="10" fill="{c}"/><path d="M200 330 L600 330 L590 400 L210 400 Z" fill="{lid}"/>'
            f'<polygon points="{star(400,365,26,12,8)}" fill="{a}"/>'
            + ''.join(f'<path d="M{240+i*40} 420 L{240+i*40} 590" stroke="{lid}" stroke-width="5" opacity=".6"/>' for i in range(9)))

DRAW = dict(bowl=bowl, plate=plate, tagine=tagine, teapot=teapot, glasses=glasses, lantern=lantern, rug=rug,
            pouf=pouf, basket=basket, babouche=babouche, cushion=cushion, mirror=mirror, box=box)

BLUE, COBALT, SAFF, MINT, TERRA, CREAM, INK, BRASS, RED = '#3F45C8', '#24308F', '#E2A42C', '#2F6B4F', '#B5532E', '#EFE7DA', '#1C1B29', '#C8962E', '#A8323A'

ITEMS = json.load(open(os.path.join(os.path.dirname(__file__), 'products.json')))
os.makedirs(OUT, exist_ok=True)
for it in ITEMS:
    for n, v in enumerate(it['views']):
        kind, c, a, x, bg = v
        cols = {k: globals().get(k, k) for k in (c, a, x, bg)}
        body = DRAW[kind](cols[c], cols[a], cols[x])
        svg = shell(cols[bg], body, band=(cols[c], cols[a], .14) if n == 0 else None)
        open(os.path.join(OUT, f"{it['slug']}{'' if n == 0 else '-' + str(n+1)}.svg"), 'w').write(svg)
print(f'drew {sum(len(i["views"]) for i in ITEMS)} images for {len(ITEMS)} products')
