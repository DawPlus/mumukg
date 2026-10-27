import os

C_OLIVE = "#4D5B3C"  # Primary Ink / Dark Olive
C_SAGE  = "#D9D8B8"  # Sage / Muted Khaki
C_CREAM = "#EFE6D4"  # Cream / Warm Oatmeal
C_HONEY = "#E5A83B"  # Warm Honey Mustard / Golden Yellow
C_CORAL = "#D66843"  # Warm Terracotta / Coral Red
C_FOREST= "#333D29"  # Deep Forest Olive

def bowl_face_path():
    return """
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
    """

def make_wordmark(ox=236, oy=70):
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

    return f"""
    <g id="wordmark">
      {m1}
      {eo1_branch}
      {eo1_stem}
      {m2}
      {eo2_branch}
      {eo2_stem}
      {g_batchim}
    </g>
    """

# 1. Golden Honey Rim
def make_v1_symbol(bg=C_CREAM):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <title>머먹 심볼 - 변형 1 (골든 옐로우 림)</title>
  <rect width="256" height="256" rx="56" fill="{bg}"/>
  <g transform="translate(18, 14) scale(0.86)">
    <g transform="rotate(-30 168 76)">
      <rect x="160" y="20" width="16" height="66" rx="8" fill="{C_SAGE}"/>
      <ellipse cx="168" cy="90" rx="22" ry="26" fill="{C_SAGE}"/>
    </g>
    <path fill-rule="evenodd" fill="{C_OLIVE}" d="{bowl_face_path()}"/>
    <rect x="24" y="106" width="208" height="18" rx="9" fill="{C_HONEY}"/>
    <rect x="96" y="214" width="64" height="10" rx="5" fill="{C_HONEY}"/>
  </g>
</svg>"""

def make_v1_lockup():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 470 256" width="470" height="256">
  <title>머먹 락업 - 골든 옐로우 림</title>
  <g transform="translate(38, 43) scale(0.6640625)">
    <g transform="rotate(-30 168 76)">
      <rect x="160" y="20" width="16" height="66" rx="8" fill="{C_SAGE}"/>
      <ellipse cx="168" cy="90" rx="22" ry="26" fill="{C_SAGE}"/>
    </g>
    <path fill-rule="evenodd" fill="{C_OLIVE}" d="{bowl_face_path()}"/>
    <rect x="24" y="106" width="208" height="18" rx="9" fill="{C_HONEY}"/>
    <rect x="96" y="214" width="64" height="10" rx="5" fill="{C_HONEY}"/>
  </g>
  {make_wordmark(ox=236, oy=70)}
</svg>"""

# 2. Coral Terracotta Rim
def make_v2_symbol(bg=C_CREAM):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <title>머먹 심볼 - 변형 2 (코랄 테라코타 림)</title>
  <rect width="256" height="256" rx="56" fill="{bg}"/>
  <g transform="translate(18, 14) scale(0.86)">
    <g transform="rotate(-30 168 76)">
      <rect x="160" y="20" width="16" height="66" rx="8" fill="{C_SAGE}"/>
      <ellipse cx="168" cy="90" rx="22" ry="26" fill="{C_SAGE}"/>
    </g>
    <path fill-rule="evenodd" fill="{C_OLIVE}" d="{bowl_face_path()}"/>
    <rect x="24" y="106" width="208" height="18" rx="9" fill="{C_CORAL}"/>
    <rect x="96" y="214" width="64" height="10" rx="5" fill="{C_CORAL}"/>
  </g>
</svg>"""

def make_v2_lockup():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 470 256" width="470" height="256">
  <title>머먹 락업 - 코랄 테라코타 림</title>
  <g transform="translate(38, 43) scale(0.6640625)">
    <g transform="rotate(-30 168 76)">
      <rect x="160" y="20" width="16" height="66" rx="8" fill="{C_SAGE}"/>
      <ellipse cx="168" cy="90" rx="22" ry="26" fill="{C_SAGE}"/>
    </g>
    <path fill-rule="evenodd" fill="{C_OLIVE}" d="{bowl_face_path()}"/>
    <rect x="24" y="106" width="208" height="18" rx="9" fill="{C_CORAL}"/>
    <rect x="96" y="214" width="64" height="10" rx="5" fill="{C_CORAL}"/>
  </g>
  {make_wordmark(ox=236, oy=70)}
</svg>"""

# 3. Dual Rim + Inset Tile Frame
def make_v3_symbol(bg=C_CREAM):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <title>머먹 심볼 - 변형 3 (골든 림과 타일 테두리 프레임)</title>
  <rect width="256" height="256" rx="56" fill="{bg}"/>
  <rect x="10" y="10" width="236" height="236" rx="46" fill="none" stroke="{C_HONEY}" stroke-width="4"/>
  <g transform="translate(18, 14) scale(0.86)">
    <g transform="rotate(-30 168 76)">
      <rect x="160" y="20" width="16" height="66" rx="8" fill="{C_SAGE}"/>
      <ellipse cx="168" cy="90" rx="22" ry="26" fill="{C_SAGE}"/>
    </g>
    <path fill-rule="evenodd" fill="{C_OLIVE}" d="{bowl_face_path()}"/>
    <rect x="24" y="106" width="208" height="18" rx="9" fill="{C_HONEY}"/>
    <rect x="96" y="214" width="64" height="10" rx="5" fill="{C_HONEY}"/>
  </g>
</svg>"""

def make_v3_lockup():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 470 256" width="470" height="256">
  <title>머먹 락업 - 골든 림과 프레임</title>
  <g transform="translate(38, 43) scale(0.6640625)">
    <g transform="rotate(-30 168 76)">
      <rect x="160" y="20" width="16" height="66" rx="8" fill="{C_SAGE}"/>
      <ellipse cx="168" cy="90" rx="22" ry="26" fill="{C_SAGE}"/>
    </g>
    <path fill-rule="evenodd" fill="{C_OLIVE}" d="{bowl_face_path()}"/>
    <rect x="24" y="106" width="208" height="18" rx="9" fill="{C_HONEY}"/>
    <rect x="96" y="214" width="64" height="10" rx="5" fill="{C_HONEY}"/>
  </g>
  {make_wordmark(ox=236, oy=70)}
</svg>"""

# 4. Sage & Olive Rim
def make_v4_symbol(bg=C_CREAM):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <title>머먹 심볼 - 변형 4 (시그니처 세이지 림)</title>
  <rect width="256" height="256" rx="56" fill="{bg}"/>
  <g transform="translate(18, 14) scale(0.86)">
    <g transform="rotate(-30 168 76)">
      <rect x="160" y="20" width="16" height="66" rx="8" fill="{C_SAGE}"/>
      <ellipse cx="168" cy="90" rx="22" ry="26" fill="{C_SAGE}"/>
    </g>
    <path fill-rule="evenodd" fill="{C_OLIVE}" d="{bowl_face_path()}"/>
    <rect x="24" y="106" width="208" height="18" rx="9" fill="{C_SAGE}" stroke="{C_FOREST}" stroke-width="2.5"/>
    <rect x="96" y="214" width="64" height="10" rx="5" fill="{C_SAGE}"/>
  </g>
</svg>"""

def make_v4_lockup():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 470 256" width="470" height="256">
  <title>머먹 락업 - 시그니처 세이지 림</title>
  <g transform="translate(38, 43) scale(0.6640625)">
    <g transform="rotate(-30 168 76)">
      <rect x="160" y="20" width="16" height="66" rx="8" fill="{C_SAGE}"/>
      <ellipse cx="168" cy="90" rx="22" ry="26" fill="{C_SAGE}"/>
    </g>
    <path fill-rule="evenodd" fill="{C_OLIVE}" d="{bowl_face_path()}"/>
    <rect x="24" y="106" width="208" height="18" rx="9" fill="{C_SAGE}" stroke="{C_FOREST}" stroke-width="2.5"/>
    <rect x="96" y="214" width="64" height="10" rx="5" fill="{C_SAGE}"/>
  </g>
  {make_wordmark(ox=236, oy=70)}
</svg>"""

if __name__ == "__main__":
    out_dir = "logo-v3/border-options"
    os.makedirs(out_dir, exist_ok=True)
    
    files = {
        "v1-symbol.svg": make_v1_symbol(),
        "v1-lockup.svg": make_v1_lockup(),
        "v2-symbol.svg": make_v2_symbol(),
        "v2-lockup.svg": make_v2_lockup(),
        "v3-symbol.svg": make_v3_symbol(),
        "v3-lockup.svg": make_v3_lockup(),
        "v4-symbol.svg": make_v4_symbol(),
        "v4-lockup.svg": make_v4_lockup(),
    }
    
    for name, content in files.items():
        p = os.path.join(out_dir, name)
        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        print("Wrote", p)
