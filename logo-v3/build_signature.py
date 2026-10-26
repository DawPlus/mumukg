import os

C_OLIVE = "#4D5B3C"  # Primary Ink / Active UI
C_SAGE  = "#D9D8B8"  # Sage / Khaki (Secondary / Surface)
C_CREAM = "#EFE6D4"  # Cream / Beige (Base Background / Contrast)

def make_wordmark_colored(ox=236, oy=70):
    # '머'
    m1_outer = f"M {ox+10},{oy+16} h 36 a 10,10 0 0 1 10,10 v 38 a 10,10 0 0 1 -10,10 h -36 a 10,10 0 0 1 -10,-10 v -38 a 10,10 0 0 1 10,-10 z"
    m1_inner = f"M {ox+14},{oy+30} a 3,3 0 0 0 -3,3 v 22 a 3,3 0 0 0 3,3 h 26 a 3,3 0 0 0 3,-3 v -22 a 3,3 0 0 0 -3,-3 z"
    m1 = f'<path d="{m1_outer} {m1_inner}" fill-rule="evenodd" fill="{C_OLIVE}"/>'
    eo1_branch = f'<rect x="{ox+50}" y="{oy+40}" width="24" height="15" rx="5" fill="{C_OLIVE}"/>'
    eo1_stem = f'<rect x="{ox+70}" y="{oy}" width="16" height="116" rx="8" fill="{C_OLIVE}"/>'

    # '먹'
    m2_outer = f"M {ox+120},{oy} h 34 a 9,9 0 0 1 9,9 v 30 a 9,9 0 0 1 -9,9 h -34 a 9,9 0 0 1 -9,-9 v -30 a 9,9 0 0 1 9,-9 z"
    m2_inner = f"M {ox+123},{oy+13} a 3,3 0 0 0 -3,3 v 14 a 3,3 0 0 0 3,3 h 20 a 3,3 0 0 0 3,-3 v -14 a 3,3 0 0 0 -3,-3 z"
    m2 = f'<path d="{m2_outer} {m2_inner}" fill-rule="evenodd" fill="{C_OLIVE}"/>'
    eo2_branch = f'<rect x="{ox+158}" y="{oy+19}" width="20" height="14" rx="4.5" fill="{C_OLIVE}"/>'
    eo2_stem = f'<rect x="{ox+174}" y="{oy}" width="15" height="66" rx="7.5" fill="{C_OLIVE}"/>'
    g_batchim = f'<path d="M {ox+118},{oy+72} h 50 a 8,8 0 0 1 8,8 v 26 a 6,6 0 0 1 -12,0 v -19 a 2,2 0 0 0 -2,-2 h -44 a 6,6 0 0 1 0,-13 z" fill="{C_OLIVE}"/>'

    # 'G' in Olive
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

def build_symbol_c_colored():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-c-color">
  <title id="title-c-color">머먹G Concept C - Joyful Bowl and Spoon (Signature Colors)</title>
  
  <!-- Dipping Spoon in Sage/Khaki -->
  <g transform="rotate(-30 168 76)">
    <rect x="160" y="20" width="16" height="66" rx="8" fill="{C_SAGE}"/>
    <ellipse cx="168" cy="90" rx="22" ry="26" fill="{C_SAGE}"/>
  </g>

  <!-- Bowl Body with Smile Cutout in Olive (#4D5B3C) -->
  <path fill-rule="evenodd" fill="{C_OLIVE}" d="
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

  <!-- Cheerful Sage Accent Cheeks -->
  <circle cx="68" cy="154" r="8" fill="{C_SAGE}"/>
  <circle cx="188" cy="154" r="8" fill="{C_SAGE}"/>

  <!-- Bowl Rim in Olive -->
  <rect x="24" y="106" width="208" height="18" rx="9" fill="{C_OLIVE}"/>

  <!-- Bowl Foot Stand in Olive -->
  <rect x="96" y="214" width="64" height="10" rx="5" fill="{C_OLIVE}"/>
</svg>"""

def build_symbol_c_app_icon():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-app-icon">
  <title id="title-app-icon">mumukg App Icon (Signature Colors)</title>
  <rect width="256" height="256" rx="56" fill="{C_CREAM}"/>

  <g transform="translate(18, 14) scale(0.86)">
    <!-- Dipping Spoon in Sage -->
    <g transform="rotate(-30 168 76)">
      <rect x="160" y="20" width="16" height="66" rx="8" fill="{C_SAGE}"/>
      <ellipse cx="168" cy="90" rx="22" ry="26" fill="{C_SAGE}"/>
    </g>

    <!-- Bowl Body in Olive -->
    <path fill-rule="evenodd" fill="{C_OLIVE}" d="
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

    <!-- Sage Accent Cheeks -->
    <circle cx="68" cy="154" r="8" fill="{C_SAGE}"/>
    <circle cx="188" cy="154" r="8" fill="{C_SAGE}"/>

    <!-- Bowl Rim in Olive -->
    <rect x="24" y="106" width="208" height="18" rx="9" fill="{C_OLIVE}"/>

    <!-- Bowl Foot Stand in Olive -->
    <rect x="96" y="214" width="64" height="10" rx="5" fill="{C_OLIVE}"/>
  </g>
</svg>"""

def build_symbol_c_reversed():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-c-reversed">
  <title id="title-c-reversed">mumukg Concept C - Reversed (Olive Background)</title>
  <rect width="256" height="256" rx="56" fill="{C_OLIVE}"/>

  <g transform="translate(18, 14) scale(0.86)">
    <!-- Spoon in Sage -->
    <g transform="rotate(-30 168 76)">
      <rect x="160" y="20" width="16" height="66" rx="8" fill="{C_SAGE}"/>
      <ellipse cx="168" cy="90" rx="22" ry="26" fill="{C_SAGE}"/>
    </g>

    <!-- Bowl Body in Cream (#EFE6D4) -->
    <path fill-rule="evenodd" fill="{C_CREAM}" d="
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

    <!-- Sage Accent Cheeks -->
    <circle cx="68" cy="154" r="8" fill="{C_SAGE}"/>
    <circle cx="188" cy="154" r="8" fill="{C_SAGE}"/>

    <!-- Bowl Rim in Cream -->
    <rect x="24" y="106" width="208" height="18" rx="9" fill="{C_CREAM}"/>

    <!-- Bowl Foot Stand in Cream -->
    <rect x="96" y="214" width="64" height="10" rx="5" fill="{C_CREAM}"/>
  </g>
</svg>"""

def build_lockup_colored(out_view_w=610):
    wordmark = make_wordmark_colored(ox=236, oy=70)
    symbol_body = f"""
    <!-- Spoon in Sage -->
    <g transform="rotate(-30 168 76)">
      <rect x="160" y="20" width="16" height="66" rx="8" fill="{C_SAGE}"/>
      <ellipse cx="168" cy="90" rx="22" ry="26" fill="{C_SAGE}"/>
    </g>

    <!-- Bowl Body in Olive -->
    <path fill-rule="evenodd" fill="{C_OLIVE}" d="
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

    <circle cx="68" cy="154" r="8" fill="{C_SAGE}"/>
    <circle cx="188" cy="154" r="8" fill="{C_SAGE}"/>
    <rect x="24" y="106" width="208" height="18" rx="9" fill="{C_OLIVE}"/>
    <rect x="96" y="214" width="64" height="10" rx="5" fill="{C_OLIVE}"/>
    """

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {out_view_w} 256" width="{out_view_w}" height="256" role="img">
  <title>머먹G Logo Lockup (Signature Colors)</title>
  <g transform="translate(38, 43) scale(0.6640625)">
    {symbol_body}
  </g>
  {wordmark}
</svg>"""

def main():
    os.makedirs("logo-v3/signature", exist_ok=True)
    with open("logo-v3/signature/symbol-color.svg", "w") as f:
        f.write(build_symbol_c_colored())
    with open("logo-v3/signature/app-icon.svg", "w") as f:
        f.write(build_symbol_c_app_icon())
    with open("logo-v3/signature/symbol-reversed.svg", "w") as f:
        f.write(build_symbol_c_reversed())
    with open("logo-v3/signature/lockup-color.svg", "w") as f:
        f.write(build_lockup_colored())

    print("Signature colored SVGs regenerated!")

if __name__ == "__main__":
    main()
