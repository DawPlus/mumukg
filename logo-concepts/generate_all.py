import math
import os

C_OLIVE = "#4d5b3c"  # Signature Deep Olive Green
C_IVORY = "#efe6d4"  # Signature Warm Oatmeal Ivory
C_SAGE  = "#d9d8b8"  # Signature Soft Sage Cream

def generate_g_path(cx, cy, R_out, sw, angle_deg=45):
    R_in = R_out - sw
    y_cross_top = cy - sw/2
    y_cross_bot = cy + sw/2
    dy_bot = sw / 2
    dx_in_bot = math.sqrt(max(0, R_in**2 - dy_bot**2))
    x_in_bot = cx + dx_in_bot
    
    rad = math.radians(angle_deg)
    x_out_top = cx + R_out * math.cos(rad)
    y_out_top = cy - R_out * math.sin(rad)
    x_in_top = cx + R_in * math.cos(rad)
    y_in_top = cy - R_in * math.sin(rad)
    
    return (
        f"M {x_out_top:.1f},{y_out_top:.1f} "
        f"A {R_out:.1f},{R_out:.1f} 0 1 0 {cx + R_out:.1f},{cy:.1f} "
        f"V {y_cross_top:.1f} "
        f"H {cx:.1f} "
        f"V {y_cross_bot:.1f} "
        f"H {x_in_bot:.1f} "
        f"A {R_in:.1f},{R_in:.1f} 0 1 1 {x_in_top:.1f},{y_in_top:.1f} "
        f"Z"
    )

def hangul_letters(ox=45, oy=28):
    return f"""
    <!-- '머' -->
    <g fill="{C_OLIVE}">
      <path d="M {ox+10},{oy+12} h 28 a 10,10 0 0 1 10,10 v 32 a 10,10 0 0 1 -10,10 h -28 a 10,10 0 0 1 -10,-10 v -32 a 10,10 0 0 1 10,-10 z
               M {ox+12},{oy+25} a 3,3 0 0 0 -3,3 v 20 a 3,3 0 0 0 3,3 h 22 a 3,3 0 0 0 3,-3 v -20 a 3,3 0 0 0 -3,-3 z" fill-rule="evenodd"/>
      <rect x="{ox+44}" y="{oy+32}" width="22" height="13" rx="4"/>
      <rect x="{ox+62}" y="{oy}" width="14" height="104" rx="7"/>
    </g>

    <!-- '먹' -->
    <g fill="{C_OLIVE}">
      <path d="M {ox+124},{oy} h 24 a 9,9 0 0 1 9,9 v 22 a 9,9 0 0 1 -9,9 h -24 a 9,9 0 0 1 -9,-9 v -22 a 9,9 0 0 1 9,-9 z
               M {ox+126},{oy+12} a 3,3 0 0 0 -3,3 v 12 a 3,3 0 0 0 3,3 h 18 a 3,3 0 0 0 3,-3 v -12 a 3,3 0 0 0 -3,-3 z" fill-rule="evenodd"/>
      <rect x="{ox+152}" y="{oy+16}" width="18" height="12" rx="3.5"/>
      <rect x="{ox+166}" y="{oy}" width="13" height="58" rx="6.5"/>
      <path d="M {ox+120},{oy+68} h 48 a 8,8 0 0 1 8,8 v 22 a 6,6 0 0 1 -12,0 v -16 a 2,2 0 0 0 -2,-2 h -42 a 6,6 0 0 1 0,-12 z"/>
    </g>
    """

# --- Concept A ---
def make_a_lockup():
    g = generate_g_path(355, 80, 54, 14, 45)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490 160" width="100%" height="100%">
  <title>머먹G 워드마크 - 콘셉트 A</title>
  <rect width="100%" height="100%" fill="none"/>
  {hangul_letters(45, 28)}
  <defs>
    <mask id="bite-a-l">
      <rect width="100%" height="100%" fill="white"/>
      <circle cx="395" cy="42" r="16" fill="black"/>
      <circle cx="406" cy="30" r="12" fill="black"/>
      <circle cx="384" cy="54" r="11" fill="black"/>
    </mask>
  </defs>
  <path mask="url(#bite-a-l)" d="{g}" fill="{C_OLIVE}"/>
  <circle cx="420" cy="34" r="4.5" fill="{C_OLIVE}"/>
  <circle cx="432" cy="48" r="3.5" fill="{C_SAGE}"/>
  <circle cx="410" cy="18" r="2.5" fill="{C_OLIVE}"/>
</svg>"""

def make_a_symbol():
    g = generate_g_path(125, 128, 80, 22, 45)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%">
  <title>머먹G 심볼 - 콘셉트 A</title>
  <rect width="256" height="256" rx="56" fill="{C_IVORY}"/>
  <rect x="8" y="8" width="240" height="240" rx="48" fill="none" stroke="{C_SAGE}" stroke-width="2"/>
  <defs>
    <mask id="bite-a-s">
      <rect width="100%" height="100%" fill="white"/>
      <circle cx="186" cy="72" r="24" fill="black"/>
      <circle cx="202" cy="54" r="18" fill="black"/>
      <circle cx="170" cy="90" r="16" fill="black"/>
    </mask>
  </defs>
  <path mask="url(#bite-a-s)" d="{g}" fill="{C_OLIVE}"/>
  <circle cx="224" cy="60" r="7" fill="{C_OLIVE}"/>
  <circle cx="238" cy="82" r="5" fill="{C_SAGE}"/>
  <circle cx="210" cy="34" r="4" fill="{C_OLIVE}"/>
</svg>"""

# --- Concept B ---
def make_b_lockup():
    g = generate_g_path(355, 80, 54, 14, 45)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490 160" width="100%" height="100%">
  <title>머먹G 워드마크 - 콘셉트 B</title>
  <rect width="100%" height="100%" fill="none"/>
  {hangul_letters(45, 28)}
  <!-- G Track -->
  <path d="{g}" fill="{C_OLIVE}"/>
  <!-- Roulette Pointer Pin at top right -->
  <path d="M 402,30 L 385,44 a 3,3 0 0 1 -4,-4 L 394,22 a 4,4 0 0 1 6,2 z" fill="{C_OLIVE}"/>
  <circle cx="406" cy="26" r="6" fill="{C_OLIVE}"/>
  <circle cx="406" cy="26" r="2.5" fill="{C_IVORY}"/>
  <!-- Dial Options -->
  <circle cx="420" cy="70" r="3.5" fill="{C_SAGE}"/>
  <circle cx="414" cy="95" r="3.5" fill="{C_SAGE}"/>
  <circle cx="396" cy="118" r="3.5" fill="{C_SAGE}"/>
</svg>"""

def make_b_symbol():
    g = generate_g_path(128, 128, 80, 22, 45)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%">
  <title>머먹G 심볼 - 콘셉트 B</title>
  <rect width="256" height="256" rx="56" fill="{C_OLIVE}"/>
  <rect x="8" y="8" width="240" height="240" rx="48" fill="none" stroke="{C_SAGE}" stroke-width="2" opacity="0.4"/>
  <!-- G Track in Ivory -->
  <path d="{g}" fill="{C_IVORY}"/>
  <!-- Pointer Pin -->
  <path d="M 198,52 L 172,74 a 4,4 0 0 1 -6,-6 L 186,40 a 6,6 0 0 1 9,3 z" fill="{C_IVORY}"/>
  <circle cx="204" cy="46" r="9" fill="{C_IVORY}"/>
  <circle cx="204" cy="46" r="4" fill="{C_OLIVE}"/>
  <!-- Dial Options -->
  <circle cx="224" cy="114" r="5.5" fill="{C_SAGE}"/>
  <circle cx="216" cy="154" r="5.5" fill="{C_SAGE}"/>
  <circle cx="188" cy="188" r="5.5" fill="{C_SAGE}"/>
</svg>"""

# --- Concept C ---
def make_c_lockup():
    g = generate_g_path(338, 80, 50, 13, 45)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490 160" width="100%" height="100%">
  <title>머먹G 워드마크 - 콘셉트 C</title>
  <!-- Rounded Lunch Platter Frame -->
  <rect x="6" y="8" width="478" height="144" rx="36" fill="{C_IVORY}" stroke="{C_OLIVE}" stroke-width="6"/>
  <rect x="14" y="16" width="462" height="128" rx="28" fill="none" stroke="{C_SAGE}" stroke-width="2" stroke-dasharray="6 5"/>
  {hangul_letters(42, 28)}
  <!-- G in Plate -->
  <path d="{g}" fill="{C_OLIVE}"/>
  <!-- Dining Seal on Right -->
  <g transform="translate(416, 52)">
    <rect width="36" height="56" rx="10" fill="{C_OLIVE}"/>
    <!-- Fork -->
    <path d="M 11,12 v 8 a 4,4 0 0 0 3,4 v 16 a 2,2 0 0 0 4,0 v -16 a 4,4 0 0 0 3,-4 v -8 a 1.5,1.5 0 0 0 -3,0 v 6 a 0.8,0.8 0 0 1 -1.6,0 v -6 a 1.5,1.5 0 0 0 -3,0 v 6 a 0.8,0.8 0 0 1 -1.6,0 v -6 a 1.5,1.5 0 0 0 -3,0 z" fill="{C_IVORY}"/>
    <!-- Spoon -->
    <path d="M 25,12 a 4.5,6.5 0 0 0 -4.5,6.5 c 0,3.5 2.5,5.5 3.5,6.5 v 15 a 2,2 0 0 0 4,0 v -15 c 1,-1 3.5,-3 3.5,-6.5 a 4.5,6.5 0 0 0 -4.5,-6.5 z" fill="{C_SAGE}"/>
  </g>
</svg>"""

def make_c_symbol():
    g = generate_g_path(128, 128, 76, 20, 45)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%">
  <title>머먹G 심볼 - 콘셉트 C</title>
  <rect width="256" height="256" rx="56" fill="{C_IVORY}"/>
  <rect x="12" y="12" width="232" height="232" rx="46" fill="none" stroke="{C_OLIVE}" stroke-width="8"/>
  <rect x="22" y="22" width="212" height="212" rx="36" fill="none" stroke="{C_SAGE}" stroke-width="2" stroke-dasharray="6 5"/>
  <path d="{g}" fill="{C_OLIVE}"/>
  <!-- Central Dining Seal -->
  <g transform="translate(138, 114)">
    <circle cx="16" cy="16" r="18" fill="{C_OLIVE}"/>
    <path d="M 10,6 v 5 a 2.5,2.5 0 0 0 2,2.5 v 10 a 1.2,1.2 0 0 0 2.4,0 v -10 a 2.5,2.5 0 0 0 2,-2.5 v -5 a 1,1 0 0 0 -2,0 v 4 a 0.5,0.5 0 0 1 -1,0 v -4 a 1,1 0 0 0 -2,0 v 4 a 0.5,0.5 0 0 1 -1,0 v -4 a 1,1 0 0 0 -2,0 z" fill="{C_IVORY}"/>
    <path d="M 20,6 a 3,4.5 0 0 0 -3,4.5 c 0,2.5 1.8,3.8 2.5,4.5 v 9 a 1.2,1.2 0 0 0 2.4,0 v -9 c 0.7,-0.7 2.5,-2 2.5,-4.5 a 3,4.5 0 0 0 -3,-4.5 z" fill="{C_SAGE}"/>
  </g>
</svg>"""

if __name__ == "__main__":
    files = {
        "concept-a-lockup.svg": make_a_lockup(),
        "concept-a-symbol.svg": make_a_symbol(),
        "concept-b-lockup.svg": make_b_lockup(),
        "concept-b-symbol.svg": make_b_symbol(),
        "concept-c-lockup.svg": make_c_lockup(),
        "concept-c-symbol.svg": make_c_symbol(),
    }
    for name, content in files.items():
        p = os.path.join("logo-concepts", name)
        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        print("Generated", p)
