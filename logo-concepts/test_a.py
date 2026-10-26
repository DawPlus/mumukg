import math
import os

# Colors
C_OLIVE = "#4d5b3c"  # Signature Deep Olive Green
C_IVORY = "#efe6d4"  # Signature Warm Oatmeal Ivory
C_SAGE  = "#d9d8b8"  # Signature Soft Sage Cream

def rrect(x, y, w, h, r):
    r = min(r, w/2, h/2)
    return (
        f"M {x+r},{y} "
        f"h {w-2*r} "
        f"a {r},{r} 0 0 1 {r},{r} "
        f"v {h-2*r} "
        f"a {r},{r} 0 0 1 {-r},{r} "
        f"h {-(w-2*r)} "
        f"a {r},{r} 0 0 1 {-r},{-r} "
        f"v {-(h-2*r)} "
        f"a {r},{r} 0 0 1 {r},{-r} Z"
    )

def rrect_ring(x, y, w, h, sw, r_out, r_in):
    # Outer CW, Inner CCW for fill-rule="evenodd"
    outer = rrect(x, y, w, h, r_out)
    ix = x + sw
    iy = y + sw
    iw = w - 2*sw
    ih = h - 2*sw
    inner = (
        f"M {ix+r_in},{iy} "
        f"a {r_in},{r_in} 0 0 0 {-r_in},{r_in} "
        f"v {ih-2*r_in} "
        f"a {r_in},{r_in} 0 0 0 {r_in},{r_in} "
        f"h {iw-2*r_in} "
        f"a {r_in},{r_in} 0 0 0 {r_in},{-r_in} "
        f"v {-(ih-2*r_in)} "
        f"a {r_in},{r_in} 0 0 0 {-r_in},{-r_in} Z"
    )
    return f"{outer} {inner}"

def make_meo(x, y, sw=14, r=5):
    # '머'
    # Base height = 110. 'ㅁ': 46x48, 'ㅓ' stem: 14x110, branch: 18x14
    # ㅁ
    mieum = rrect_ring(x, y + 16, 48, 52, sw, r+2, max(2, r-1))
    # ㅓ branch
    branch = rrect(x + 44, y + 42, 22, sw, 4)
    # ㅓ stem
    stem = rrect(x + 62, y, sw, 110, r)
    return f"{mieum} {branch} {stem}"

def make_meok(x, y, sw=13, r=4):
    # '먹'
    # Total height = 110
    # Top 'ㅁ': 44x40, at (x, y)
    mieum = rrect_ring(x, y, 44, 40, sw, r+2, max(2, r-1))
    # Top 'ㅓ' branch: at y+20
    branch = rrect(x + 40, y + 16, 18, sw, 3)
    # Top 'ㅓ' stem: from y to y+64
    stem = rrect(x + 54, y, sw, 64, r)
    # Bottom 'ㄱ' 받침: x+4 to x+64, y+72 to y+110
    # L-shaped bent stroke
    giyeok = (
        f"M {x+6},{y+72} "
        f"h 56 "
        f"a {r+2},{r+2} 0 0 1 {r+2},{r+2} "
        f"v 26 "
        f"a {r},{r} 0 0 1 {-sw},{0} "
        f"v {-16} "
        f"h {-46} "
        f"a {r},{r} 0 0 1 0,{-sw} Z"
    )
    return f"{mieum} {branch} {stem} {giyeok}"

# Concept A: Bite & Smile G
def make_g_bite(cx, cy, R_out=55, sw=15):
    # G center at (cx, cy). Outer R=55, Inner R=40.
    # Top opening around 40 degrees.
    # Bite at top-right: circular bite centered at (cx+36, cy-36) with radius 16
    # Let's construct using clean SVG arc path with mask or precise path
    # Using SVG mask makes bite 100% mathematically flawless and crisp!
    pass

svg_test = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 180" width="100%" height="100%">
  <defs>
    <!-- Bite Mask for Concept A -->
    <mask id="bite-mask">
      <rect width="100%" height="100%" fill="white"/>
      <!-- The bite cut: 3 circular scallops for real teeth bite marks! -->
      <circle cx="446" cy="48" r="16" fill="black"/>
      <circle cx="456" cy="36" r="12" fill="black"/>
      <circle cx="436" cy="62" r="11" fill="black"/>
    </mask>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="none"/>

  <g fill="{C_OLIVE}" fill-rule="evenodd">
    <!-- 머 -->
    <path d="{make_meo(50, 35)}"/>
    <!-- 먹 -->
    <path d="{make_meok(165, 35)}"/>
    
    <!-- Concept A: G with Bite Mask -->
    <g mask="url(#bite-mask)">
      <!-- G outer circle (cx=395, cy=90, R=54) and inner (R=39), sw=15 -->
      <!-- G body: arc from 40 deg CCW to crossbar -->
      <path d="
        M 432,56
        A 54,54 0 1 0 449,92
        H 395
        a 7,7 0 0 1 0,-14
        h 38
        A 39,39 0 1 1 422,66
        a 7,7 0 0 1 10,-10 Z
      "/>
    </g>
  </g>

  <!-- Cute Crumb points flying off the bite -->
  <circle cx="474" cy="38" r="4.5" fill="{C_OLIVE}"/>
  <circle cx="488" cy="54" r="3" fill="{C_SAGE}"/>
  <circle cx="468" cy="22" r="2.5" fill="{C_OLIVE}"/>
</svg>"""

with open("logo-concepts/test_a.svg", "w", encoding="utf-8") as f:
    f.write(svg_test)
print("Saved test_a.svg")
