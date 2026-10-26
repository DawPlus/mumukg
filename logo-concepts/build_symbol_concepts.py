import math
import os

C_OLIVE = "#4d5b3c"  # Signature Deep Olive Green
C_IVORY = "#efe6d4"  # Signature Warm Oatmeal Ivory
C_SAGE  = "#d9d8b8"  # Signature Soft Sage Cream

# Common '머먹' Hangul Letterforms
def hangul_meomeok(ox=160, oy=42):
    return f"""
    <!-- '머' (Width: ~90px) -->
    <g fill="{C_OLIVE}">
      <path d="M {ox+10},{oy+10} h 24 a 8,8 0 0 1 8,8 v 26 a 8,8 0 0 1 -8,8 h -24 a 8,8 0 0 1 -8,-8 v -26 a 8,8 0 0 1 8,-8 z
               M {ox+12},{oy+20} a 2.5,2.5 0 0 0 -2.5,2.5 v 15 a 2.5,2.5 0 0 0 2.5,2.5 h 19 a 2.5,2.5 0 0 0 2.5,-2.5 v -15 a 2.5,2.5 0 0 0 -2.5,-2.5 z" fill-rule="evenodd"/>
      <rect x="{ox+38}" y="{oy+26}" width="18" height="11" rx="3.5"/>
      <rect x="{ox+52}" y="{oy}" width="12" height="84" rx="6"/>
    </g>

    <!-- '먹' (Width: ~90px) -->
    <g fill="{C_OLIVE}">
      <path d="M {ox+102},{oy} h 22 a 8,8 0 0 1 8,8 v 18 a 8,8 0 0 1 -8,8 h -22 a 8,8 0 0 1 -8,-8 v -18 a 8,8 0 0 1 8,-8 z
               M {ox+104},{oy+10} a 2.5,2.5 0 0 0 -2.5,2.5 v 10 a 2.5,2.5 0 0 0 2.5,2.5 h 16 a 2.5,2.5 0 0 0 2.5,-2.5 v -10 a 2.5,2.5 0 0 0 -2.5,-2.5 z" fill-rule="evenodd"/>
      <rect x="{ox+126}" y="{oy+14}" width="16" height="10" rx="3"/>
      <rect x="{ox+138}" y="{oy}" width="11" height="48" rx="5.5"/>
      <path d="M {ox+98},{oy+56} h 42 a 7,7 0 0 1 7,7 v 18 a 5,5 0 0 1 -10,0 v -13 a 2,2 0 0 0 -2,-2 h -37 a 5,5 0 0 1 0,-10 z"/>
    </g>
    """

# ========================================================
# CONCEPT A: 식판 주사위 (The Meal Dice)
# "골라보자"의 주사위 + 밥그릇/음식의 위트 있는 결합
# ========================================================
def symbol_a():
    # Isometric 3D rounded dice with food elements on each face
    # Center (128, 128)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%">
  <title>머먹 - 식판 주사위 심볼</title>
  <rect width="256" height="256" rx="56" fill="{C_IVORY}"/>
  <rect x="8" y="8" width="240" height="240" rx="48" fill="none" stroke="{C_SAGE}" stroke-width="2"/>

  <!-- Isometric Dice Body -->
  <!-- Top Face (Warm Sage Tint) -->
  <path d="M 128,42 L 194,80 L 128,118 L 62,80 Z" fill="{C_SAGE}"/>
  
  <!-- Left Face (Deep Olive) -->
  <path d="M 62,80 L 128,118 L 128,198 L 62,160 Z" fill="{C_OLIVE}"/>
  
  <!-- Right Face (Olive Accent - medium tone / shaded) -->
  <path d="M 128,118 L 194,80 L 194,160 L 128,198 Z" fill="{C_OLIVE}" opacity="0.88"/>

  <!-- Face Details (The "Food" Pips) -->
  <!-- Top Face: Steaming Rice Bowl Pip -->
  <g transform="translate(128, 80) scale(0.9)">
    <!-- Bowl silhouette in Olive -->
    <path d="M -22,-4 a 22,18 0 0 0 44,0 h -44 z" fill="{C_OLIVE}"/>
    <!-- Steam swirls in Ivory -->
    <path d="M -8,-10 q 4,-6 0,-12" stroke="{C_OLIVE}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M 2,-10 q 4,-6 0,-12" stroke="{C_OLIVE}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M 12,-10 q 4,-6 0,-12" stroke="{C_OLIVE}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  </g>

  <!-- Left Face: 2 Food Pips (Peas / Fried Eggs in Ivory) -->
  <circle cx="85" cy="120" r="9" fill="{C_IVORY}"/>
  <circle cx="85" cy="120" r="4.5" fill="{C_SAGE}"/>
  <circle cx="105" cy="158" r="9" fill="{C_IVORY}"/>
  <circle cx="105" cy="158" r="4.5" fill="{C_SAGE}"/>

  <!-- Right Face: 3 Dice Pips as Dining Utensils / Dots -->
  <circle cx="148" cy="140" r="7" fill="{C_IVORY}"/>
  <circle cx="168" cy="120" r="7" fill="{C_IVORY}"/>
  <circle cx="168" cy="160" r="7" fill="{C_IVORY}"/>
</svg>"""

def lockup_a():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 150" width="100%" height="100%">
  <title>머먹 로고 - 콘셉트 A (식판 주사위)</title>
  <rect width="100%" height="100%" fill="none"/>

  <!-- Mini Dice Symbol on Left (Center: 75, 75, scale: 0.55) -->
  <g transform="translate(15, 15) scale(0.48)">
    <rect width="256" height="256" rx="56" fill="{C_IVORY}"/>
    <rect x="8" y="8" width="240" height="240" rx="48" fill="none" stroke="{C_SAGE}" stroke-width="3"/>
    <path d="M 128,42 L 194,80 L 128,118 L 62,80 Z" fill="{C_SAGE}"/>
    <path d="M 62,80 L 128,118 L 128,198 L 62,160 Z" fill="{C_OLIVE}"/>
    <path d="M 128,118 L 194,80 L 194,160 L 128,198 Z" fill="{C_OLIVE}" opacity="0.88"/>
    <g transform="translate(128, 80) scale(0.9)">
      <path d="M -22,-4 a 22,18 0 0 0 44,0 h -44 z" fill="{C_OLIVE}"/>
      <path d="M -8,-10 q 4,-6 0,-12" stroke="{C_OLIVE}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M 2,-10 q 4,-6 0,-12" stroke="{C_OLIVE}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    </g>
    <circle cx="85" cy="120" r="9" fill="{C_IVORY}"/>
    <circle cx="105" cy="158" r="9" fill="{C_IVORY}"/>
    <circle cx="148" cy="140" r="7" fill="{C_IVORY}"/>
    <circle cx="168" cy="120" r="7" fill="{C_IVORY}"/>
    <circle cx="168" cy="160" r="7" fill="{C_IVORY}"/>
  </g>

  <!-- Typography '머먹' -->
  {hangul_meomeok(165, 33)}

  <!-- Tagline Badge -->
  <g transform="translate(330, 48)">
    <rect width="72" height="24" rx="12" fill="{C_SAGE}"/>
    <text x="36" y="16" font-family="sans-serif" font-size="10" font-weight="bold" fill="{C_OLIVE}" text-anchor="middle">PICK!</text>
  </g>
</svg>"""

# ========================================================
# CONCEPT B: 메뉴 결정 나침반 (The Dining Compass)
# "어디 갈까? 뭐 먹지?" 길잡이가 되어주는 숟가락 나침반
# ========================================================
def symbol_b():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%">
  <title>머먹 - 메뉴 나침반 심볼</title>
  <rect width="256" height="256" rx="56" fill="{C_OLIVE}"/>
  
  <!-- Outer Compass Dial (Rim in Sage) -->
  <circle cx="128" cy="128" r="92" fill="none" stroke="{C_SAGE}" stroke-width="4"/>
  
  <!-- Dial Notches (N, E, S, W & Intercardinal Dots) -->
  <circle cx="128" cy="46" r="4.5" fill="{C_IVORY}"/>
  <circle cx="210" cy="128" r="4.5" fill="{C_IVORY}"/>
  <circle cx="128" cy="210" r="4.5" fill="{C_IVORY}"/>
  <circle cx="46" cy="128" r="4.5" fill="{C_IVORY}"/>
  
  <circle cx="186" cy="70" r="3" fill="{C_SAGE}"/>
  <circle cx="186" cy="186" r="3" fill="{C_SAGE}"/>
  <circle cx="70" cy="186" r="3" fill="{C_SAGE}"/>
  <circle cx="70" cy="70" r="3" fill="{C_SAGE}"/>

  <!-- Central Compass Needle: Dynamic Angle (~35 degrees, pointing North-East to victory/pick) -->
  <g transform="translate(128, 128) rotate(-40)">
    <!-- Pointer Needle Tip: Sleek Spoon Arrow in Ivory -->
    <path d="M 0,-76 C 14,-60 16,-35 12,0 L -12,0 C -16,-35 -14,-60 0,-76 Z" fill="{C_IVORY}"/>
    
    <!-- Tail: Sleek Fork in Sage -->
    <path d="M 6,0 L 8,50 C 8,62 5,68 0,72 C -5,68 -8,62 -8,50 L -6,0 Z" fill="{C_SAGE}"/>
    <!-- Fork Slit cutouts -->
    <line x1="-3" y1="52" x2="-3" y2="68" stroke="{C_OLIVE}" stroke-width="1.8"/>
    <line x1="3" y1="52" x2="3" y2="68" stroke="{C_OLIVE}" stroke-width="1.8"/>

    <!-- Center Pivot Pin -->
    <circle cx="0" cy="0" r="16" fill="{C_IVORY}"/>
    <circle cx="0" cy="0" r="8" fill="{C_OLIVE}"/>
    <circle cx="0" cy="0" r="3" fill="{C_SAGE}"/>
  </g>
</svg>"""

def lockup_b():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 150" width="100%" height="100%">
  <title>머먹 로고 - 콘셉트 B (메뉴 나침반)</title>
  <rect width="100%" height="100%" fill="none"/>

  <!-- Compass Symbol on Left -->
  <g transform="translate(15, 15) scale(0.48)">
    <rect width="256" height="256" rx="56" fill="{C_OLIVE}"/>
    <circle cx="128" cy="128" r="92" fill="none" stroke="{C_SAGE}" stroke-width="4"/>
    <circle cx="128" cy="46" r="5" fill="{C_IVORY}"/>
    <circle cx="210" cy="128" r="5" fill="{C_IVORY}"/>
    <circle cx="128" cy="210" r="5" fill="{C_IVORY}"/>
    <circle cx="46" cy="128" r="5" fill="{C_IVORY}"/>
    <g transform="translate(128, 128) rotate(-40)">
      <path d="M 0,-76 C 14,-60 16,-35 12,0 L -12,0 C -16,-35 -14,-60 0,-76 Z" fill="{C_IVORY}"/>
      <path d="M 6,0 L 8,50 C 8,62 5,68 0,72 C -5,68 -8,62 -8,50 L -6,0 Z" fill="{C_SAGE}"/>
      <circle cx="0" cy="0" r="16" fill="{C_IVORY}"/>
      <circle cx="0" cy="0" r="8" fill="{C_OLIVE}"/>
    </g>
  </g>

  <!-- Typography '머먹' -->
  {hangul_meomeok(165, 33)}

  <!-- Decided Accent Needle -->
  <g transform="translate(345, 60)">
    <circle cx="16" cy="16" r="14" fill="{C_IVORY}" stroke="{C_OLIVE}" stroke-width="2"/>
    <path d="M 16,5 L 23,22 L 16,18 L 9,22 Z" fill="{C_OLIVE}"/>
  </g>
</svg>"""

# ========================================================
# CONCEPT C: 얌얌 스마일 볼 (The Yummy Smile Bowl)
# "고민 끝! 행복하게 먹자" - 기분 좋은 윙크 그릇과 느낌표 김
# ========================================================
def symbol_c():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%">
  <title>머먹 - 얌얌 볼 심볼</title>
  <rect width="256" height="256" rx="56" fill="{C_IVORY}"/>
  <rect x="8" y="8" width="240" height="240" rx="48" fill="none" stroke="{C_SAGE}" stroke-width="2"/>

  <!-- Steam rising that forms a witty '!' (Exclamation of decision: '이거 먹자!') -->
  <g transform="translate(128, 55)">
    <!-- Left Steam -->
    <path d="M -32,24 C -36,8 -24,-2 -28,-18" fill="none" stroke="{C_SAGE}" stroke-width="5" stroke-linecap="round"/>
    <!-- Center Exclamation Steam: Decision Eureka! -->
    <path d="M 0,22 C -2,6 4,-2 0,-16" fill="none" stroke="{C_OLIVE}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="0" cy="-28" r="4.5" fill="{C_OLIVE}"/>
    <!-- Right Steam -->
    <path d="M 32,24 C 28,8 40,-2 36,-18" fill="none" stroke="{C_SAGE}" stroke-width="5" stroke-linecap="round"/>
  </g>

  <!-- Chunky Delicious Bowl in Olive -->
  <!-- Center (128, 150) -->
  <g fill="{C_OLIVE}">
    <!-- Bowl Body: Top Rim 156px wide, Height 68px -->
    <path d="M 46,120 H 210 C 206,172 168,190 128,190 C 88,190 50,172 46,120 Z"/>
    <!-- Foot stand -->
    <rect x="98" y="190" width="60" height="10" rx="5"/>
    <!-- Rim Highlight line -->
    <path d="M 42,118 H 214 a 6,6 0 0 1 0,12 H 42 a 6,6 0 0 1 0,-12 Z" fill="{C_OLIVE}"/>
  </g>

  <!-- Witty Smile Face on Bowl (Ivory) -->
  <!-- Left Eye: Winking Smile Arc (^_~) -->
  <path d="M 85,152 Q 95,142 105,152" fill="none" stroke="{C_IVORY}" stroke-width="4.5" stroke-linecap="round"/>
  <!-- Right Eye: Decisive Wink / Star / Joy dot -->
  <circle cx="152" cy="150" r="5" fill="{C_IVORY}"/>
  <!-- Cheerful Smile Mouth -->
  <path d="M 112,165 Q 128,178 144,165" fill="none" stroke="{C_IVORY}" stroke-width="4.5" stroke-linecap="round"/>
  
  <!-- Cute Blush Cheeks in Sage -->
  <circle cx="76" cy="158" r="6" fill="{C_SAGE}"/>
  <circle cx="174" cy="158" r="6" fill="{C_SAGE}"/>
</svg>"""

def lockup_c():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 150" width="100%" height="100%">
  <title>머먹 로고 - 콘셉트 C (얌얌 볼)</title>
  <rect width="100%" height="100%" fill="none"/>

  <!-- Bowl Symbol on Left -->
  <g transform="translate(15, 15) scale(0.48)">
    <rect width="256" height="256" rx="56" fill="{C_IVORY}"/>
    <rect x="8" y="8" width="240" height="240" rx="48" fill="none" stroke="{C_SAGE}" stroke-width="2"/>
    <g transform="translate(128, 55)">
      <path d="M -32,24 C -36,8 -24,-2 -28,-18" fill="none" stroke="{C_SAGE}" stroke-width="5" stroke-linecap="round"/>
      <path d="M 0,22 C -2,6 4,-2 0,-16" fill="none" stroke="{C_OLIVE}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="0" cy="-28" r="4.5" fill="{C_OLIVE}"/>
      <path d="M 32,24 C 28,8 40,-2 36,-18" fill="none" stroke="{C_SAGE}" stroke-width="5" stroke-linecap="round"/>
    </g>
    <path d="M 46,120 H 210 C 206,172 168,190 128,190 C 88,190 50,172 46,120 Z" fill="{C_OLIVE}"/>
    <rect x="98" y="190" width="60" height="10" rx="5" fill="{C_OLIVE}"/>
    <path d="M 42,118 H 214 a 6,6 0 0 1 0,12 H 42 a 6,6 0 0 1 0,-12 Z" fill="{C_OLIVE}"/>
    <path d="M 85,152 Q 95,142 105,152" fill="none" stroke="{C_IVORY}" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="152" cy="150" r="5" fill="{C_IVORY}"/>
    <path d="M 112,165 Q 128,178 144,165" fill="none" stroke="{C_IVORY}" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="76" cy="158" r="6" fill="{C_SAGE}"/>
    <circle cx="174" cy="158" r="6" fill="{C_SAGE}"/>
  </g>

  <!-- Typography '머먹' -->
  {hangul_meomeok(165, 33)}

  <!-- Cheerful Dining Accent Badge -->
  <g transform="translate(332, 50)">
    <rect width="66" height="26" rx="13" fill="{C_OLIVE}"/>
    <text x="33" y="17" font-family="sans-serif" font-size="11" font-weight="bold" fill="{C_IVORY}" text-anchor="middle">YUM!</text>
  </g>
</svg>"""

if __name__ == "__main__":
    out_dir = "logo-concepts-v2"
    os.makedirs(out_dir, exist_ok=True)
    
    files = {
        "symbol-a.svg": symbol_a(),
        "lockup-a.svg": lockup_a(),
        "symbol-b.svg": symbol_b(),
        "lockup-b.svg": lockup_b(),
        "symbol-c.svg": symbol_c(),
        "lockup-c.svg": lockup_c(),
    }
    
    for name, content in files.items():
        p = os.path.join(out_dir, name)
        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        print("Generated", p)
