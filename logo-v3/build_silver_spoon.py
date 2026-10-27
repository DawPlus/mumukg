import os

C_OLIVE = "#4D5B3C"  # Primary Ink / Dark Olive
C_SAGE  = "#D9D8B8"  # Sage / Muted Khaki
C_CREAM = "#EFE6D4"  # Cream / Warm Oatmeal
C_HONEY = "#E5A83B"  # Warm Honey Mustard / Golden Yellow

# Silver metallic palette
C_SILVER_LIGHT = "#E8ECEF"  # Bright silver sheen
C_SILVER_MID   = "#BFC7CE"  # Neutral polished silver
C_SILVER_DEEP  = "#8D98A2"  # Contoured silver shade

def bowl_body_with_honey_rim():
    return f"""
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

    <!-- Bowl Rim in Warm Honey Gold -->
    <rect x="24" y="106" width="208" height="18" rx="9" fill="{C_HONEY}"/>

    <!-- Bowl Foot Stand in Warm Honey Gold -->
    <rect x="96" y="214" width="64" height="10" rx="5" fill="{C_HONEY}"/>
    """

# ---------------------------------------------------------------------------
# S1: Spoon Head Outline Rim (스푼 머리에 깔끔한 실버 테두리 림)
# Sage spoon body with a refined 3.5px silver rim stroke + inner reflection
# ---------------------------------------------------------------------------
def make_s1(bg=C_CREAM):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <title>머먹 - 실버 림 스푼 S1 (스푼 외곽 실버 림)</title>
  <rect width="256" height="256" rx="56" fill="{bg}"/>
  <g transform="translate(18, 14) scale(0.86)">
    <!-- Dipping Spoon in Sage with Silver Rim Outline -->
    <g transform="rotate(-30 168 76)">
      <!-- Silver Rim Layer (Stroke) -->
      <rect x="159" y="19" width="18" height="68" rx="9" fill="{C_SILVER_MID}"/>
      <ellipse cx="168" cy="90" rx="24" ry="28" fill="{C_SILVER_MID}"/>
      
      <!-- Inner Sage Spoon Body -->
      <rect x="161" y="21" width="14" height="64" rx="7" fill="{C_SAGE}"/>
      <ellipse cx="168" cy="90" rx="20.5" ry="24.5" fill="{C_SAGE}"/>
      
      <!-- Subtle Silver Sheen Highlight Curve -->
      <path d="M 160,78 a 16,20 0 0 0 14,28" fill="none" stroke="{C_SILVER_LIGHT}" stroke-width="2.5" stroke-linecap="round"/>
    </g>

    {bowl_body_with_honey_rim()}
  </g>
</svg>"""

# ---------------------------------------------------------------------------
# S2: Silver Stainless Cutlery Spoon (스푼 전체가 세련된 실버 스테인리스 스틸)
# Polished silver spoon body with light silver highlight rim
# ---------------------------------------------------------------------------
def make_s2(bg=C_CREAM):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <title>머먹 - 실버 림 스푼 S2 (풀 실버 스테인리스 스푼)</title>
  <rect width="256" height="256" rx="56" fill="{bg}"/>
  <g transform="translate(18, 14) scale(0.86)">
    <!-- Full Silver Cutlery Spoon -->
    <g transform="rotate(-30 168 76)">
      <!-- Outer silver base -->
      <rect x="160" y="20" width="16" height="66" rx="8" fill="{C_SILVER_MID}"/>
      <ellipse cx="168" cy="90" rx="22" ry="26" fill="{C_SILVER_MID}"/>
      
      <!-- Inner bowl dish depression -->
      <ellipse cx="168" cy="90" rx="16" ry="19" fill="{C_SILVER_LIGHT}"/>
      <!-- Silver Rim Edge Accent -->
      <ellipse cx="168" cy="90" rx="19" ry="22.5" fill="none" stroke="{C_SILVER_DEEP}" stroke-width="1.8"/>
    </g>

    {bowl_body_with_honey_rim()}
  </g>
</svg>"""

# ---------------------------------------------------------------------------
# S3: Sage Spoon + Sleek Metallic Silver Head Rim & Tip (세이지 바디 + 실버 헤드 림)
# Handle stays soft Sage, and the spoon head has a distinct polished silver rim & bowl
# ---------------------------------------------------------------------------
def make_s3(bg=C_CREAM):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <title>머먹 - 실버 림 스푼 S3 (세이지 손잡이 + 실버 림 헤드)</title>
  <rect width="256" height="256" rx="56" fill="{bg}"/>
  <g transform="translate(18, 14) scale(0.86)">
    <!-- Spoon: Sage handle + Silver rimmed head -->
    <g transform="rotate(-30 168 76)">
      <!-- Handle in Sage -->
      <rect x="160" y="20" width="16" height="66" rx="8" fill="{C_SAGE}"/>
      
      <!-- Head: Outer Silver Rim -->
      <ellipse cx="168" cy="90" rx="23" ry="27" fill="{C_SILVER_MID}"/>
      <!-- Head: Inner Sage Fill -->
      <ellipse cx="168" cy="90" rx="18.5" ry="22.5" fill="{C_SAGE}"/>
      <!-- Silver inner reflection lip -->
      <ellipse cx="168" cy="90" rx="13" ry="16" fill="{C_SILVER_LIGHT}" opacity="0.65"/>
    </g>

    {bowl_body_with_honey_rim()}
  </g>
</svg>"""

if __name__ == "__main__":
    out_dir = "logo-v3/silver-spoon-options"
    os.makedirs(out_dir, exist_ok=True)
    
    files = {
        "s1-silver-outline.svg": make_s1(),
        "s2-full-silver.svg": make_s2(),
        "s3-silver-head-rim.svg": make_s3(),
    }
    for name, content in files.items():
        p = os.path.join(out_dir, name)
        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        print("Wrote", p)
