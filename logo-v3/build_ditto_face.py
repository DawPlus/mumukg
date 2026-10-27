import os

C_OLIVE = "#4D5B3C"  # Dark Olive
C_SAGE  = "#D9D8B8"  # Sage / Muted Khaki
C_CREAM = "#EFE6D4"  # Cream / Warm Oatmeal
C_HONEY = "#E5A83B"  # Warm Honey Mustard / Golden Yellow

C_SILVER_LIGHT = "#E8ECEF"
C_SILVER_MID   = "#BFC7CE"
C_SILVER_DEEP  = "#8D98A2"

# B-style full silver spoon
def spoon_b():
    return f"""
    <g transform="rotate(-30 168 76)">
      <rect x="160" y="20" width="16" height="66" rx="8" fill="{C_SILVER_MID}"/>
      <ellipse cx="168" cy="90" rx="22" ry="26" fill="{C_SILVER_MID}"/>
      <ellipse cx="168" cy="90" rx="16" ry="19" fill="{C_SILVER_LIGHT}"/>
      <ellipse cx="168" cy="90" rx="19" ry="22.5" fill="none" stroke="{C_SILVER_DEEP}" stroke-width="1.8"/>
    </g>
    """

# Common bowl background & rims
def bowl_rims():
    return f"""
    <!-- Bowl Rim in Warm Honey Gold -->
    <rect x="24" y="106" width="208" height="18" rx="9" fill="{C_HONEY}"/>
    <!-- Bowl Foot Stand in Warm Honey Gold -->
    <rect x="96" y="214" width="64" height="10" rx="5" fill="{C_HONEY}"/>
    """

# -------------------------------------------------------------
# D1: 정석 메타몽 (Classic Ditto Face)
# Two small beady eyes (radius 5) + subtle gentle soft curved mouth line
# -------------------------------------------------------------
def make_ditto_1():
    # Bowl body outline
    bowl_path = f"""
    <path fill="{C_OLIVE}" d="
      M 32,118
      H 224
      C 220,192 180,214 128,214
      C 76,214 36,192 32,118
      Z
    "/>
    """
    # Ditto face features in Cream:
    # Eyes: cx=98, cx=158, cy=154, r=5.5 (pure beady dots)
    # Mouth: clean monoline stroke with round caps from x=116 to 140, cy=166
    face = f"""
    <!-- Ditto Eyes -->
    <circle cx="98" cy="154" r="5.5" fill="{C_CREAM}"/>
    <circle cx="158" cy="154" r="5.5" fill="{C_CREAM}"/>
    <!-- Classic Ditto Soft Gentle Mouth Line -->
    <path d="M 116,166 Q 128,171 140,166" fill="none" stroke="{C_CREAM}" stroke-width="4.5" stroke-linecap="round"/>
    """
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <title>머먹 - D1 정석 메타몽 표정</title>
  <rect width="256" height="256" rx="56" fill="{C_CREAM}"/>
  <g transform="translate(18, 14) scale(0.86)">
    {spoon_b()}
    {bowl_path}
    {face}
    {bowl_rims()}
  </g>
</svg>"""

# -------------------------------------------------------------
# D2: 방긋 메타몽 (Happy Cheerful Ditto Face)
# Small beady dots + sweet upturned smile curve
# -------------------------------------------------------------
def make_ditto_2():
    bowl_path = f"""
    <path fill="{C_OLIVE}" d="
      M 32,118
      H 224
      C 220,192 180,214 128,214
      C 76,214 36,192 32,118
      Z
    "/>
    """
    # Slightly wider, upturned smile
    face = f"""
    <circle cx="96" cy="152" r="5.5" fill="{C_CREAM}"/>
    <circle cx="160" cy="152" r="5.5" fill="{C_CREAM}"/>
    <path d="M 114,163 Q 128,175 142,163" fill="none" stroke="{C_CREAM}" stroke-width="4.5" stroke-linecap="round"/>
    """
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <title>머먹 - D2 방긋 메타몽 표정</title>
  <rect width="256" height="256" rx="56" fill="{C_CREAM}"/>
  <g transform="translate(18, 14) scale(0.86)">
    {spoon_b()}
    {bowl_path}
    {face}
    {bowl_rims()}
  </g>
</svg>"""

# -------------------------------------------------------------
# D3: 메타몽 웨이브 (Ditto Wavy Smile ~)
# Iconic Ditto wavy mouth with slight organic asymmetry
# -------------------------------------------------------------
def make_ditto_3():
    bowl_path = f"""
    <path fill="{C_OLIVE}" d="
      M 32,118
      H 224
      C 220,192 180,214 128,214
      C 76,214 36,192 32,118
      Z
    "/>
    """
    # Wave line mouth like ~
    face = f"""
    <circle cx="98" cy="153" r="5.5" fill="{C_CREAM}"/>
    <circle cx="158" cy="153" r="5.5" fill="{C_CREAM}"/>
    <path d="M 116,165 Q 122,169 128,166 Q 134,163 140,167" fill="none" stroke="{C_CREAM}" stroke-width="4.5" stroke-linecap="round"/>
    """
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <title>머먹 - D3 앙증 메타몽 웨이브</title>
  <rect width="256" height="256" rx="56" fill="{C_CREAM}"/>
  <g transform="translate(18, 14) scale(0.86)">
    {spoon_b()}
    {bowl_path}
    {face}
    {bowl_rims()}
  </g>
</svg>"""

if __name__ == "__main__":
    out_dir = "logo-v3/ditto-face-options"
    os.makedirs(out_dir, exist_ok=True)
    
    files = {
        "d1-classic-ditto.svg": make_ditto_1(),
        "d2-happy-ditto.svg": make_ditto_2(),
        "d3-wavy-ditto.svg": make_ditto_3(),
    }
    for name, content in files.items():
        p = os.path.join(out_dir, name)
        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        print("Wrote", p)
