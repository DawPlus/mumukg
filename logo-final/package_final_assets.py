import os
import shutil
import subprocess

C_OLIVE = "#4D5B3C"  # Dark Olive
C_SAGE  = "#D9D8B8"  # Sage / Muted Khaki
C_CREAM = "#EFE6D4"  # Cream / Warm Oatmeal
C_HONEY = "#E5A83B"  # Warm Honey Mustard / Golden Yellow

C_SILVER_LIGHT = "#E8ECEF"
C_SILVER_MID   = "#BFC7CE"
C_SILVER_DEEP  = "#8D98A2"

# Master SVG with Tile (App Icon)
def get_app_icon_svg():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-label="mumukg App Icon">
  <title>머먹 (mumukg) 공식 앱 아이콘</title>
  <!-- Background Tile in Cream -->
  <rect width="256" height="256" rx="56" fill="{C_CREAM}"/>
  
  <g transform="translate(18, 14) scale(0.86)">
    <!-- Full Stainless Silver Cutlery Spoon -->
    <g transform="rotate(-30 168 76)">
      <rect x="160" y="20" width="16" height="66" rx="8" fill="{C_SILVER_MID}"/>
      <ellipse cx="168" cy="90" rx="22" ry="26" fill="{C_SILVER_MID}"/>
      <ellipse cx="168" cy="90" rx="16" ry="19" fill="{C_SILVER_LIGHT}"/>
      <ellipse cx="168" cy="90" rx="19" ry="22.5" fill="none" stroke="{C_SILVER_DEEP}" stroke-width="1.8"/>
    </g>

    <!-- Olive Bowl Body -->
    <path fill="{C_OLIVE}" d="
      M 32,118
      H 224
      C 220,192 180,214 128,214
      C 76,214 36,192 32,118
      Z
    "/>

    <!-- Ditto Face Features in Cream -->
    <circle cx="98" cy="154" r="5.5" fill="{C_CREAM}"/>
    <circle cx="158" cy="154" r="5.5" fill="{C_CREAM}"/>
    <path d="M 116,166 Q 128,171 140,166" fill="none" stroke="{C_CREAM}" stroke-width="4.5" stroke-linecap="round"/>

    <!-- Bowl Rim in Warm Honey Gold -->
    <rect x="24" y="106" width="208" height="18" rx="9" fill="{C_HONEY}"/>
    <!-- Bowl Foot Stand in Warm Honey Gold -->
    <rect x="96" y="214" width="64" height="10" rx="5" fill="{C_HONEY}"/>
  </g>
</svg>"""

# Master SVG Transparent (Symbol Only)
def get_symbol_transparent_svg():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-label="mumukg Symbol">
  <title>머먹 (mumukg) 공식 심볼 (투명 배경)</title>
  <g transform="translate(18, 14) scale(0.86)">
    <!-- Full Stainless Silver Cutlery Spoon -->
    <g transform="rotate(-30 168 76)">
      <rect x="160" y="20" width="16" height="66" rx="8" fill="{C_SILVER_MID}"/>
      <ellipse cx="168" cy="90" rx="22" ry="26" fill="{C_SILVER_MID}"/>
      <ellipse cx="168" cy="90" rx="16" ry="19" fill="{C_SILVER_LIGHT}"/>
      <ellipse cx="168" cy="90" rx="19" ry="22.5" fill="none" stroke="{C_SILVER_DEEP}" stroke-width="1.8"/>
    </g>

    <!-- Olive Bowl Body -->
    <path fill="{C_OLIVE}" d="
      M 32,118
      H 224
      C 220,192 180,214 128,214
      C 76,214 36,192 32,118
      Z
    "/>

    <!-- Ditto Face Features in Cream -->
    <circle cx="98" cy="154" r="5.5" fill="{C_CREAM}"/>
    <circle cx="158" cy="154" r="5.5" fill="{C_CREAM}"/>
    <path d="M 116,166 Q 128,171 140,166" fill="none" stroke="{C_CREAM}" stroke-width="4.5" stroke-linecap="round"/>

    <!-- Bowl Rim in Warm Honey Gold -->
    <rect x="24" y="106" width="208" height="18" rx="9" fill="{C_HONEY}"/>
    <!-- Bowl Foot Stand in Warm Honey Gold -->
    <rect x="96" y="214" width="64" height="10" rx="5" fill="{C_HONEY}"/>
  </g>
</svg>"""

def main():
    os.makedirs("logo-final", exist_ok=True)
    os.makedirs("public", exist_ok=True)

    app_icon_svg = get_app_icon_svg()
    symbol_svg = get_symbol_transparent_svg()

    # Save to logo-final
    with open("logo-final/mumukg-app-icon.svg", "w", encoding="utf-8") as f:
        f.write(app_icon_svg)
    with open("logo-final/mumukg-symbol.svg", "w", encoding="utf-8") as f:
        f.write(symbol_svg)

    # Save to public
    with open("public/app-icon.svg", "w", encoding="utf-8") as f:
        f.write(app_icon_svg)
    with open("public/symbol.svg", "w", encoding="utf-8") as f:
        f.write(symbol_svg)

    print("Master SVGs written to logo-final/ and public/")

if __name__ == "__main__":
    main()
