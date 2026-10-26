import math
import os

C_OLIVE = "#4D5B3C"  # Primary Ink / Active UI
C_SAGE  = "#D9D8B8"  # Sage / Khaki (Secondary / Surface)
C_CREAM = "#EFE6D4"  # Cream / Beige (Base Background / Contrast)

def make_wordmark_colored(ox=236, oy=70):
    m1_outer = f"M {ox+10},{oy+16} h 36 a 10,10 0 0 1 10,10 v 38 a 10,10 0 0 1 -10,10 h -36 a 10,10 0 0 1 -10,-10 v -38 a 10,10 0 0 1 10,-10 z"
    m1_inner = f"M {ox+14},{oy+30} a 3,3 0 0 0 -3,3 v 22 a 3,3 0 0 0 3,3 h 26 a 3,3 0 0 0 3,-3 v -22 a 3,3 0 0 0 -3,-3 z"
    m1 = f'<path d="{m1_outer} {m1_inner}" fill-rule="evenodd" fill="{C_OLIVE}"/>'
    eo1_branch = f'<rect x="{ox+50}" y="{oy+40}" width="24" height="15" rx="5" fill="{C_OLIVE}"/>'
    eo1_stem = f'<rect x="{ox+70}" y="{oy}" width="16" height="116" rx="8" fill="{C_OLIVE}"/>'

    m2_outer = f"M {ox+120},{oy} h 34 a 9,9 0 0 1 9,9 v 30 a 9,9 0 0 1 -9,9 h -34 a 9,9 0 0 1 -9,-9 v -30 a 9,9 0 0 1 9,-9 z"
    m2_inner = f"M {ox+123},{oy+13} a 3,3 0 0 0 -3,3 v 14 a 3,3 0 0 0 3,3 h 20 a 3,3 0 0 0 3,-3 v -14 a 3,3 0 0 0 -3,-3 z"
    m2 = f'<path d="{m2_outer} {m2_inner}" fill-rule="evenodd" fill="{C_OLIVE}"/>'
    eo2_branch = f'<rect x="{ox+158}" y="{oy+19}" width="20" height="14" rx="4.5" fill="{C_OLIVE}"/>'
    eo2_stem = f'<rect x="{ox+174}" y="{oy}" width="15" height="66" rx="7.5" fill="{C_OLIVE}"/>'
    g_batchim = f'<path d="M {ox+118},{oy+72} h 50 a 8,8 0 0 1 8,8 v 26 a 6,6 0 0 1 -12,0 v -19 a 2,2 0 0 0 -2,-2 h -44 a 6,6 0 0 1 0,-13 z" fill="{C_OLIVE}"/>'

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
    " fill-rule="evenodd" fill="{C_OLIVE}"/>
    """

    return f"""
    <g id="wordmark">
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

def get_symbol_body_1():
    return f"""<g id="symbol">
    <!-- Main G-Bowl Frame in Olive (#4D5B3C) -->
    <path fill-rule="evenodd" fill="{C_OLIVE}" d="
      M 189,67
      A 86,86 0 1,0 214,132
      L 186,132
      A 58,58 0 1,1 169,87
      A 14,14 0 0,0 189,67
      Z
    "/>

    <!-- Inward Spoon in Sage (#D9D8B8) forming G's crossbar -->
    <g id="spoon-crossbar">
      <rect x="146" y="123" width="68" height="18" rx="9" fill="{C_SAGE}"/>
      <ellipse cx="138" cy="132" rx="24" ry="18" fill="{C_SAGE}"/>
      <ellipse cx="138" cy="132" rx="14" ry="10" fill="{C_CREAM}"/>
    </g>

    <!-- Single Charming Eye Dot (Olive) -->
    <circle cx="102" cy="116" r="9" fill="{C_OLIVE}"/>

    <!-- Bowl Foot Stand (Olive) -->
    <rect x="98" y="214" width="60" height="10" rx="5" fill="{C_OLIVE}"/>
  </g>"""

def get_symbol_body_2():
    return f"""<g id="symbol">
    <!-- Deep Olive Bowl (Lower Half) -->
    <path fill-rule="evenodd" fill="{C_OLIVE}" d="
      M 36,120
      H 220
      C 216,192 178,214 128,214
      C 78,214 40,192 36,120
      Z

      M 106,160
      A 9,9 0 1,1 105.9,160
      Z
    "/>

    <!-- Bowl Rim in Olive -->
    <rect x="28" y="108" width="200" height="18" rx="9" fill="{C_OLIVE}"/>

    <!-- Bowl Foot Stand in Olive -->
    <rect x="98" y="214" width="60" height="10" rx="5" fill="{C_OLIVE}"/>

    <!-- Spoon forming the upper loop & inner crossbar of 'G' in Sage -->
    <path fill-rule="evenodd" fill="{C_SAGE}" d="
      M 88,108
      C 88,64 120,40 160,40
      C 196,40 216,64 216,98
      L 216,108
      H 192
      V 98
      C 192,76 178,60 160,60
      C 134,60 112,78 112,108
      Z
    "/>

    <!-- Dipping Spoon Head entering into center forming G's bar -->
    <g transform="translate(154, 96)">
      <rect x="0" y="3" width="56" height="18" rx="9" fill="{C_SAGE}"/>
      <ellipse cx="6" cy="12" rx="20" ry="15" fill="{C_SAGE}"/>
      <ellipse cx="6" cy="12" rx="11" ry="8" fill="{C_CREAM}"/>
    </g>
  </g>"""

def get_symbol_body_3():
    return f"""<g id="symbol">
    <!-- Outer G-Bowl Loop (Olive) -->
    <path fill-rule="evenodd" fill="{C_OLIVE}" d="
      M 186,66
      A 84,84 0 1,0 212,130
      L 212,142
      A 84,84 0 0,1 128,212
      C 81.6,212 44,174.4 44,128
      C 44,81.6 81.6,44 128,44
      C 149,44 169,52 186,66
      Z

      M 128,68
      C 94.8,68 68,94.8 68,128
      C 68,161.2 94.8,188 128,188
      C 152,188 173,174 182,152
      L 182,130
      A 24,24 0 0,0 158,106
      L 138,106
      A 14,14 0 0,0 124,120
      L 124,124
      A 14,14 0 0,0 138,138
      L 160,138
      C 154,152 142,162 128,162
      C 109.2,162 94,146.8 94,128
      C 94,109.2 109.2,94 128,94
      C 137,94 145,97 151,103
      L 168,86
      C 157,75 143,68 128,68
      Z
    "/>

    <!-- Dipping Spoon in Sage entering at the inner opening -->
    <g transform="rotate(-30 156 128)">
      <rect x="146" y="80" width="16" height="58" rx="8" fill="{C_SAGE}"/>
      <ellipse cx="154" cy="144" rx="20" ry="16" fill="{C_SAGE}"/>
      <ellipse cx="154" cy="144" rx="11" ry="9" fill="{C_CREAM}"/>
    </g>

    <!-- Single eye dot in Olive -->
    <circle cx="106" cy="114" r="9" fill="{C_OLIVE}"/>

    <!-- Foot stand in Olive -->
    <rect x="98" y="212" width="60" height="10" rx="5" fill="{C_OLIVE}"/>
  </g>"""

def wrap_svg(body, title):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img">
  <title>{title}</title>
  {body}
</svg>"""

def wrap_lockup(body, title, out_view_w=610):
    wordmark = make_wordmark_colored(ox=236, oy=70)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {out_view_w} 256" width="{out_view_w}" height="256" role="img">
  <title>{title}</title>
  <g transform="translate(38, 43) scale(0.6640625)">
    {body}
  </g>
  {wordmark}
</svg>"""

def main():
    os.makedirs("logo-v3/gbowl", exist_ok=True)
    b1 = get_symbol_body_1()
    b2 = get_symbol_body_2()
    b3 = get_symbol_body_3()

    with open("logo-v3/gbowl/g1-symbol.svg", "w") as f:
        f.write(wrap_svg(b1, "mumukg G-Bowl 1: G-Spoon Bowl"))
    with open("logo-v3/gbowl/g2-symbol.svg", "w") as f:
        f.write(wrap_svg(b2, "mumukg G-Bowl 2: Rising Spoon G-Bowl"))
    with open("logo-v3/gbowl/g3-symbol.svg", "w") as f:
        f.write(wrap_svg(b3, "mumukg G-Bowl 3: Smiling Spoon G"))

    with open("logo-v3/gbowl/g1-lockup.svg", "w") as f:
        f.write(wrap_lockup(b1, "G-Bowl 1 Lockup"))
    with open("logo-v3/gbowl/g2-lockup.svg", "w") as f:
        f.write(wrap_lockup(b2, "G-Bowl 2 Lockup"))
    with open("logo-v3/gbowl/g3-lockup.svg", "w") as f:
        f.write(wrap_lockup(b3, "G-Bowl 3 Lockup"))

    print("Regenerated cleanly!")

if __name__ == "__main__":
    main()
