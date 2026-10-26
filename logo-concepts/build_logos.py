import math
import os
import sys

# Color constants
C_OLIVE = "#4d5b3c"  # Signature Deep Olive Green
C_IVORY = "#efe6d4"  # Signature Warm Oatmeal Ivory
C_SAGE  = "#d9d8b8"  # Signature Soft Sage Cream

def rounded_rect_path(x, y, w, h, r):
    r = min(r, w/2, h/2)
    return (
        f"M {x+r},{y} "
        f"H {x+w-r} "
        f"A {r},{r} 0 0 1 {x+w},{y+r} "
        f"V {y+h-r} "
        f"A {r},{r} 0 0 1 {x+w-r},{y+h} "
        f"H {x+r} "
        f"A {r},{r} 0 0 1 {x},{y+h-r} "
        f"V {y+r} "
        f"A {r},{r} 0 0 1 {x+r},{y} Z"
    )

def rect_hollow_path(x, y, w, h, sw, r):
    # Outer CW, Inner CCW with fill-rule="evenodd"
    outer = rounded_rect_path(x, y, w, h, r)
    in_x = x + sw
    in_y = y + sw
    in_w = w - 2*sw
    in_h = h - 2*sw
    in_r = max(2, r - sw/2)
    inner = (
        f"M {in_x+in_r},{in_y} "
        f"A {in_r},{in_r} 0 0 0 {in_x},{in_y+in_r} "
        f"V {in_y+in_h-in_r} "
        f"A {in_r},{in_r} 0 0 0 {in_x+in_r},{in_y+in_h} "
        f"H {in_x+in_w-in_r} "
        f"A {in_r},{in_r} 0 0 0 {in_x+in_w},{in_y+in_h-in_r} "
        f"V {in_y+in_r} "
        f"A {in_r},{in_r} 0 0 0 {in_x+in_w-in_r},{in_y} Z"
    )
    return f"{outer} {inner}"

# --- Concept A: Bite & Smile Wordmark ---
# Soft rounded curves, pillowy strokes, cute bite mark on G's top-right.
def build_concept_a():
    # viewBox="0 0 540 200"
    # Wordmark: 머 먹 G
    sw = 22  # stroke width
    r = 10   # corner radius
    
    # Char 1: 머 (x ~ 45..165)
    # ㅁ: x=45, y=55, w=60, h=55
    m1 = rect_hollow_path(45, 55, 56, 52, sw, 8)
    # ㅓ: vertical stem at x=125, y=35, w=22, h=130, rounded
    eo1_stem = rounded_rect_path(125, 35, sw, 130, 11)
    # branch: x=98, y=82, w=30, h=20, rounded left
    eo1_br = rounded_rect_path(98, 80, 30, 20, 7)
    
    # Char 2: 먹 (x ~ 185..305)
    # 초성 ㅁ: x=185, y=35, w=52, h=44
    m2 = rect_hollow_path(185, 35, 52, 44, sw, 7)
    # 중성 ㅓ: stem x=260, y=35, w=22, h=82
    eo2_stem = rounded_rect_path(260, 35, sw, 82, 11)
    eo2_br = rounded_rect_path(234, 52, 30, 18, 6)
    # 종성 ㄱ: horizontal bar x=188, y=125, w=84, h=20; vertical drop at right x=252, y=125, w=20, h=40
    # Combine as a single bent stroke
    g2 = (
        f"M 198,125 "
        f"H 262 "
        f"A 10,10 0 0 1 272,135 "
        f"V 155 "
        f"A 10,10 0 0 1 252,155 "
        f"V 145 "
        f"H 198 "
        f"A 10,10 0 0 1 198,125 Z"
    )
    
    # Char 3: G (x ~ 335..475)
    # Large rounded bouncy G with bite mark at top right!
    # Center = (405, 100), R_out = 65, R_in = 43 (sw = 22)
    # Normal G: starts at (450, 65), goes counter-clockwise to bottom (405, 165),
    # up to right edge (470, 100), inward crossbar to (405, 100).
    # Bite mark: circular scallop at (455, 55) with radius 18 cut out!
    # Let's craft the G path directly with clean arcs.
    # Outer circle R=65, inner circle R=43.
    # Bite circle: cx=452, cy=60, r_bite=17.
    # Let's build G using compound path or precise arcs.
    g3 = (
        # Outer contour starting from crossbar top
        "M 415,100 "
        "H 465 "
        "A 10,10 0 0 1 475,110 "
        "V 112 "
        "A 65,65 0 0 1 340,100 "
        "A 65,65 0 0 1 430,37 "
        # Bite scallop: concave arc curving inward
        "A 16,16 0 0 0 458,70 "
        "A 10,10 0 0 1 448,82 "
        "A 43,43 0 0 0 362,100 "
        "A 43,43 0 0 0 453,115 "
        "V 114 "
        "H 415 "
        "A 7,7 0 0 1 415,100 Z"
    )

    # Secondary text / Tagline: "DECIDE & EAT" or "고민 끝, 골라보자" in SVG geometric paths or dots
    # Small cute fork/spoon or smile dot:
    # A tiny bite crumb in accent color at (478, 48)
    crumb = "M 480,48 a 5,5 0 1 0 0.1,0 Z"

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 530 200" width="100%" height="100%">
  <rect width="100%" height="100%" fill="none"/>
  <!-- Concept A: Bite & Smile Wordmark -->
  <g fill="{C_OLIVE}" fill-rule="evenodd">
    <!-- 머 -->
    <path d="{m1}"/>
    <path d="{eo1_stem}"/>
    <path d="{eo1_br}"/>
    <!-- 먹 -->
    <path d="{m2}"/>
    <path d="{eo2_stem}"/>
    <path d="{eo2_br}"/>
    <path d="{g2}"/>
    <!-- G with Bite -->
    <path d="{g3}"/>
  </g>
  <!-- Crumb / Accent -->
  <path d="{crumb}" fill="{C_SAGE}"/>
</svg>"""
    return svg

# Icon version for Concept A (Square 256x256)
def build_concept_a_icon():
    # Focused on the witty 'G' with bite & smile
    # Center at (128, 128), R_out = 92, R_in = 62, sw = 30
    g_path = (
        "M 135,128 "
        "H 212 "
        "A 14,14 0 0 1 226,142 "
        "V 146 "
        "A 92,92 0 0 1 36,128 "
        "A 92,92 0 0 1 165,39 "
        # Bite scallop
        "A 24,24 0 0 0 204,86 "
        "A 14,14 0 0 1 190,103 "
        "A 62,62 0 0 0 66,128 "
        "A 62,62 0 0 0 196,148 "
        "V 146 "
        "H 135 "
        "A 9,9 0 0 1 135,128 Z"
    )
    crumb1 = "M 226,56 a 7,7 0 1 0 0.1,0 Z"
    crumb2 = "M 240,78 a 5,5 0 1 0 0.1,0 Z"
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%">
  <!-- App Icon / Badge Background -->
  <rect width="256" height="256" rx="56" fill="{C_IVORY}"/>
  <g fill="{C_OLIVE}" fill-rule="evenodd">
    <path d="{g_path}"/>
  </g>
  <path d="{crumb1}" fill="{C_OLIVE}"/>
  <path d="{crumb2}" fill="{C_SAGE}"/>
</svg>"""
    return svg


# --- Concept B: Pick & Arrow G Wordmark ---
# Modern geometric, decisive arrow crossbar that says "Pick!"
def build_concept_b():
    sw = 22
    # Char 1: 머
    m1 = rect_hollow_path(45, 55, 56, 52, sw, 6)
    eo1_stem = rounded_rect_path(125, 35, sw, 130, 8)
    eo1_br = rounded_rect_path(98, 80, 30, 20, 6)

    # Char 2: 먹
    m2 = rect_hollow_path(185, 35, 52, 44, sw, 6)
    eo2_stem = rounded_rect_path(260, 35, sw, 82, 8)
    eo2_br = rounded_rect_path(234, 52, 30, 18, 5)
    # Crisp angled ㄱ 받침
    g2 = (
        f"M 196,125 "
        f"H 264 "
        f"A 8,8 0 0 1 272,133 "
        f"V 157 "
        f"A 8,8 0 0 1 254,157 "
        f"V 145 "
        f"H 196 "
        f"A 8,8 0 0 1 196,125 Z"
    )

    # Char 3: G with Arrow Pointer (The "Pick" mechanism)
    # Circle with gap at top-right, and horizontal pointer arrow pointing right into center
    # Outer R=65, Inner R=43.
    # Center (405, 100)
    # Arc from (435, 42) CCW around to (465, 120), then up to crossbar
    g_arc = (
        "M 438,46 "
        "A 65,65 0 1 0 470,105 "
        "L 470,95 "
        "H 408 "
        # Pointer tip: arrow pointing right
        "L 418,85 "
        "A 6,6 0 0 0 412,76 "
        "L 390,95 "
        "A 6,6 0 0 0 390,105 "
        "L 412,124 "
        "A 6,6 0 0 0 418,115 "
        "L 408,105 "
        "H 448 "
        "A 43,43 0 1 1 422,62 "
        "A 11,11 0 0 0 438,46 Z"
    )

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 530 200" width="100%" height="100%">
  <rect width="100%" height="100%" fill="none"/>
  <!-- Concept B: Pick Arrow G Wordmark -->
  <g fill="{C_OLIVE}" fill-rule="evenodd">
    <!-- 머 -->
    <path d="{m1}"/>
    <path d="{eo1_stem}"/>
    <path d="{eo1_br}"/>
    <!-- 먹 -->
    <path d="{m2}"/>
    <path d="{eo2_stem}"/>
    <path d="{eo2_br}"/>
    <path d="{g2}"/>
    <!-- G with Arrow Selector -->
    <path d="{g_arc}"/>
  </g>
</svg>"""
    return svg

def build_concept_b_icon():
    # Square Icon: G with Pick Pointer
    # Center (128, 128), R_out=90, R_in=60
    g_arc = (
        "M 174,54 "
        "A 90,90 0 1 0 218,136 "
        "L 218,122 "
        "H 134 "
        # Arrow pointer head
        "L 148,108 "
        "A 8,8 0 0 0 140,96 "
        "L 110,122 "
        "A 8,8 0 0 0 110,134 "
        "L 140,160 "
        "A 8,8 0 0 0 148,148 "
        "L 134,134 "
        "H 188 "
        "A 60,60 0 1 1 152,76 "
        "A 15,15 0 0 0 174,54 Z"
    )
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%">
  <rect width="256" height="256" rx="56" fill="{C_OLIVE}"/>
  <!-- Pointer G in Ivory & Sage -->
  <path d="{g_arc}" fill="{C_IVORY}" fill-rule="evenodd"/>
</svg>"""
    return svg


# --- Concept C: Table Platter / Stamp Badge ---
# Unified badge lockup: The entire wordmark sits on an appetite-inducing rounded tray/stamp
def build_concept_c():
    sw = 20
    # Inside a handsome badge
    # Outer badge: x=20, y=20, w=490, h=160, rx=32
    # In center: 머 먹 G
    m1 = rect_hollow_path(60, 52, 52, 48, sw, 6)
    eo1_stem = rounded_rect_path(134, 38, sw, 104, 7)
    eo1_br = rounded_rect_path(110, 72, 26, 18, 5)

    m2 = rect_hollow_path(190, 38, 48, 40, sw, 5)
    eo2_stem = rounded_rect_path(258, 38, sw, 68, 7)
    eo2_br = rounded_rect_path(236, 52, 24, 16, 5)
    g2 = (
        f"M 198,114 "
        f"H 260 "
        f"A 7,7 0 0 1 268,121 "
        f"V 140 "
        f"A 7,7 0 0 1 252,140 "
        f"V 130 "
        f"H 198 "
        f"A 7,7 0 0 1 198,114 Z"
    )

    # G: sleek geometric G
    # Center (380, 90), R_out=54, R_in=34
    g_path = (
        "M 390,90 "
        "H 426 "
        "A 8,8 0 0 1 434,98 "
        "V 100 "
        "A 54,54 0 1 1 426,72 "
        "A 10,10 0 0 1 410,84 "
        "A 34,34 0 1 0 414,106 "
        "H 390 "
        "A 7,7 0 0 1 390,90 Z"
    )

    # Sub-ribbon or slogan badge at bottom: "골라보자" or "DECIDE & EAT"
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 530 200" width="100%" height="100%">
  <!-- Badge background border -->
  <rect x="25" y="20" width="480" height="160" rx="36" fill="{C_IVORY}" stroke="{C_OLIVE}" stroke-width="8"/>
  <g fill="{C_OLIVE}" fill-rule="evenodd">
    <path d="{m1}"/>
    <path d="{eo1_stem}"/>
    <path d="{eo1_br}"/>
    <path d="{m2}"/>
    <path d="{eo2_stem}"/>
    <path d="{eo2_br}"/>
    <path d="{g2}"/>
    <path d="{g_path}"/>
  </g>
  <!-- Accent corner rivet dots for badge feeling -->
  <circle cx="56" cy="50" r="4" fill="{C_SAGE}"/>
  <circle cx="474" cy="50" r="4" fill="{C_SAGE}"/>
  <circle cx="56" cy="150" r="4" fill="{C_SAGE}"/>
  <circle cx="474" cy="150" r="4" fill="{C_SAGE}"/>
</svg>"""
    return svg

def build_concept_c_icon():
    # Square Badge: '머먹G' stacked or 'G' badge
    # Since it's a badge concept, let's create a chic compact badge icon:
    # Outer rounded square with border, containing 'G' with twin accent dots
    g_path = (
        "M 134,128 "
        "H 188 "
        "A 12,12 0 0 1 200,140 "
        "V 144 "
        "A 76,76 0 1 1 188,102 "
        "A 14,14 0 0 1 166,118 "
        "A 48,48 0 1 0 172,150 "
        "H 134 "
        "A 10,10 0 0 1 134,128 Z"
    )
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%">
  <rect width="256" height="256" rx="56" fill="{C_IVORY}"/>
  <rect x="18" y="18" width="220" height="220" rx="42" fill="none" stroke="{C_OLIVE}" stroke-width="10"/>
  <g fill="{C_OLIVE}" fill-rule="evenodd">
    <path d="{g_path}"/>
  </g>
  <circle cx="50" cy="50" r="6" fill="{C_SAGE}"/>
  <circle cx="206" cy="50" r="6" fill="{C_SAGE}"/>
</svg>"""
    return svg


if __name__ == "__main__":
    out_dir = "logo-concepts"
    os.makedirs(out_dir, exist_ok=True)
    
    files = {
        "concept-a-wordmark.svg": build_concept_a(),
        "concept-a-icon.svg": build_concept_a_icon(),
        "concept-b-wordmark.svg": build_concept_b(),
        "concept-b-icon.svg": build_concept_b_icon(),
        "concept-c-wordmark.svg": build_concept_c(),
        "concept-c-icon.svg": build_concept_c_icon(),
    }
    
    for fname, content in files.items():
        p = os.path.join(out_dir, fname)
        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Wrote {p}")
