import math
import os

def make_wordmark_paths(ox=236, oy=70):
    """
    Constructs geometric paths for '머', '먹', 'G'.
    Height = 116 (from oy to oy+116).
    """
    # 1. '머'
    m1_outer = f"M {ox+10},{oy+16} h 36 a 10,10 0 0 1 10,10 v 38 a 10,10 0 0 1 -10,10 h -36 a 10,10 0 0 1 -10,-10 v -38 a 10,10 0 0 1 10,-10 z"
    m1_inner = f"M {ox+14},{oy+30} a 3,3 0 0 0 -3,3 v 22 a 3,3 0 0 0 3,3 h 26 a 3,3 0 0 0 3,-3 v -22 a 3,3 0 0 0 -3,-3 z"
    m1 = f'<path d="{m1_outer} {m1_inner}" fill-rule="evenodd"/>'
    eo1_branch = f'<rect x="{ox+50}" y="{oy+40}" width="24" height="15" rx="5"/>'
    eo1_stem = f'<rect x="{ox+70}" y="{oy}" width="16" height="116" rx="8"/>'

    # 2. '먹'
    m2_outer = f"M {ox+120},{oy} h 34 a 9,9 0 0 1 9,9 v 30 a 9,9 0 0 1 -9,9 h -34 a 9,9 0 0 1 -9,-9 v -30 a 9,9 0 0 1 9,-9 z"
    m2_inner = f"M {ox+123},{oy+13} a 3,3 0 0 0 -3,3 v 14 a 3,3 0 0 0 3,3 h 20 a 3,3 0 0 0 3,-3 v -14 a 3,3 0 0 0 -3,-3 z"
    m2 = f'<path d="{m2_outer} {m2_inner}" fill-rule="evenodd"/>'
    eo2_branch = f'<rect x="{ox+158}" y="{oy+19}" width="20" height="14" rx="4.5"/>'
    eo2_stem = f'<rect x="{ox+174}" y="{oy}" width="15" height="66" rx="7.5"/>'
    g_batchim = f'<path d="M {ox+118},{oy+72} h 50 a 8,8 0 0 1 8,8 v 26 a 6,6 0 0 1 -12,0 v -19 a 2,2 0 0 0 -2,-2 h -44 a 6,6 0 0 1 0,-13 z"/>'

    # 3. 'G'
    gx, gy = ox + 266, oy + 58
    g_path = f"""
    <path d="
      M {gx+38.18},{gy-38.18}
      A 54,54 0 1,0 {gx+54},{gy+10}
      L {gx+54},{gy}
      L {gx+16},{gy}
      A 7,7 0 0,1 {gx+9},{gy-7}
      L {gx+9},{gy-9}
      A 7,7 0 0,1 {gx+16},{gy-16}
      L {gx+36},{gy-16}
      A 36,36 0 1,1 {gx+25.45},{gy-25.45}
      A 9,9 0 0,1 {gx+38.18},{gy-38.18}
      Z
    " fill-rule="evenodd"/>
    """

    return f"""
    <g id="wordmark" fill="currentColor">
      {m1}
      {eo1_branch}
      {eo1_stem}
      {m2}
      {eo2_branch}
      {eo2_stem}
      {g_batchim}
      {g_path}
    </g>
    """

def build_symbol_a():
    """
    Concept A: The Surprise Cloche (서프라이즈 클로슈)
    A dining bell/cloche opening with an infectious winking smile face.
    256x256 canvas.
    """
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-a">
  <title id="title-a">mumukg Concept A - Surprise Cloche</title>
  <g id="symbol" fill="#000000">
    <!-- Top handle knob -->
    <circle cx="128" cy="44" r="16"/>
    <rect x="120" y="54" width="16" height="14" rx="4"/>

    <!-- Cloche Dome with Negative-Space Face -->
    <path fill-rule="evenodd" d="
      M 36,170
      C 36,96 76,64 128,64
      C 180,64 220,96 220,170
      Z
      
      M 82,122
      C 82,112 98,112 98,122
      C 98,132 82,132 82,122
      Z

      M 160,114
      A 11,11 0 1,1 159.9,114
      Z

      M 102,144
      Q 128,166 154,144
      Q 128,156 102,144
      Z
    "/>

    <!-- Serving Platter Base -->
    <rect x="24" y="178" width="208" height="20" rx="10"/>
  </g>
</svg>"""

def build_symbol_b():
    """
    Concept B: The Happy Tray (해피 식판)
    A clean cafeteria/bento tray whose compartments form a charming, smiling face.
    256x256 canvas.
    """
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-b">
  <title id="title-b">mumukg Concept B - Happy Tray</title>
  <g id="symbol" fill="#000000">
    <path fill-rule="evenodd" d="
      M 76,28
      H 180
      A 48,48 0 0 1 228,76
      V 180
      A 48,48 0 0 1 180,228
      H 76
      A 48,48 0 0 1 28,180
      V 76
      A 48,48 0 0 1 76,28
      Z

      M 76,58
      H 96
      A 20,20 0 0 1 116,78
      V 94
      A 20,20 0 0 1 96,114
      H 76
      A 20,20 0 0 1 56,94
      V 78
      A 20,20 0 0 1 76,58
      Z

      M 160,58
      H 180
      A 20,20 0 0 1 200,78
      V 94
      A 20,20 0 0 1 180,114
      H 160
      A 20,20 0 0 1 140,94
      V 78
      A 20,20 0 0 1 160,58
      Z

      M 94,134
      H 162
      A 28,28 0 0 1 190,162
      V 168
      A 28,28 0 0 1 162,196
      H 94
      A 28,28 0 0 1 66,168
      V 162
      A 28,28 0 0 1 94,134
      Z
    "/>
  </g>
</svg>"""

def build_symbol_c():
    """
    Concept C: The Joyful Bowl & Spoon (얌얌 볼 & 스푼)
    A warm round bowl with a cute appetite smile and a bold spoon diving in with energy.
    256x256 canvas.
    """
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-c">
  <title id="title-c">mumukg Concept C - Joyful Bowl and Spoon</title>
  <g id="symbol" fill="#000000">
    <!-- Dipping Spoon Handle & Head rotated by -30 deg -->
    <g transform="rotate(-30 168 76)">
      <rect x="160" y="20" width="16" height="66" rx="8"/>
      <ellipse cx="168" cy="90" rx="22" ry="26"/>
    </g>

    <!-- Bowl Body with Smile Cutout -->
    <path fill-rule="evenodd" d="
      M 32,118
      H 224
      C 220,192 180,214 128,214
      C 76,214 36,192 32,118
      Z

      M 86,146
      A 8,8 0 1,1 85.9,146
      Z

      M 170,146
      A 8,8 0 1,1 169.9,146
      Z

      M 106,164
      Q 128,184 150,164
      Q 128,174 106,164
      Z
    "/>

    <!-- Bowl Rim -->
    <rect x="24" y="106" width="208" height="18" rx="9"/>

    <!-- Bowl Foot Stand -->
    <rect x="96" y="214" width="64" height="10" rx="5"/>
  </g>
</svg>"""

def build_lockup(symbol_svg_body, symbol_title, out_view_w=610):
    # Left margin: 38px. Symbol width: 170px (38..208).
    # Gap: 28px. Wordmark start: 236. Wordmark end: 556.
    # Right margin: 610 - 556 = 54px.
    # Left margin ≈ Right margin!
    wordmark = make_wordmark_paths(ox=236, oy=70)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {out_view_w} 256" width="{out_view_w}" height="256" role="img">
  <title>{symbol_title} Lockup</title>
  <g transform="translate(38, 43) scale(0.6640625)">
    {symbol_svg_body}
  </g>
  {wordmark}
</svg>"""

def main():
    os.makedirs("logo-v3", exist_ok=True)
    sym_a = build_symbol_a()
    sym_b = build_symbol_b()
    sym_c = build_symbol_c()

    with open("logo-v3/a-symbol.svg", "w") as f:
        f.write(sym_a)
    with open("logo-v3/b-symbol.svg", "w") as f:
        f.write(sym_b)
    with open("logo-v3/c-symbol.svg", "w") as f:
        f.write(sym_c)

    def get_body(svg_str):
        start = svg_str.find("<g id=\"symbol\"")
        end = svg_str.rfind("</svg>")
        return svg_str[start:end]

    with open("logo-v3/a-lockup.svg", "w") as f:
        f.write(build_lockup(get_body(sym_a), "머먹G Concept A"))
    with open("logo-v3/b-lockup.svg", "w") as f:
        f.write(build_lockup(get_body(sym_b), "머먹G Concept B"))
    with open("logo-v3/c-lockup.svg", "w") as f:
        f.write(build_lockup(get_body(sym_c), "머먹G Concept C"))

    print("SVG updated and refined!")

if __name__ == "__main__":
    main()
