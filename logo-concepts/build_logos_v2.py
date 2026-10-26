import os

# Colors
C_OLIVE = "#4d5b3c"  # Signature Deep Olive Green
C_IVORY = "#efe6d4"  # Signature Warm Oatmeal Ivory
C_SAGE  = "#d9d8b8"  # Signature Soft Sage Cream

# Let's write a generator that uses clean separate SVG shapes (clean SVG hierarchy)
# No even-odd invert bugs!

def build_svg_a():
    # Concept A: Bite & Smile Wordmark
    # Width 500, Height 160
    # Baseline & Cap-height: Letters sit from Y=25 to Y=135 (Height = 110)
    # Olive Green fill
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490 160" width="100%" height="100%">
  <title>머먹G 로고 - 콘셉트 A (얌얌 G)</title>
  <rect width="100%" height="100%" fill="none"/>

  <!-- Syllable 1: 머 (X: 35 ~ 130) -->
  <g fill="{C_OLIVE}">
    <!-- ㅁ : Outer 50x52, Inner 24x26, Stroke 13 -->
    <path d="M 47,45 h 26 a 12,12 0 0 1 12,12 v 28 a 12,12 0 0 1 -12,12 h -26 a 12,12 0 0 1 -12,-12 v -28 a 12,12 0 0 1 12,-12 z
             M 49,58 a 4,4 0 0 0 -4,4 v 18 a 4,4 0 0 0 4,4 h 22 a 4,4 0 0 0 4,-4 v -18 a 4,4 0 0 0 -4,-4 z" fill-rule="evenodd"/>
    <!-- ㅓ Horizontal connector -->
    <rect x="80" y="66" width="22" height="13" rx="4"/>
    <!-- ㅓ Vertical stem -->
    <rect x="97" y="25" width="14" height="110" rx="7"/>
  </g>

  <!-- Syllable 2: 먹 (X: 145 ~ 240) -->
  <g fill="{C_OLIVE}">
    <!-- ㅁ : Outer 46x40, Inner 22x16, Stroke 12 -->
    <path d="M 157,25 h 22 a 10,10 0 0 1 10,10 v 20 a 10,10 0 0 1 -10,10 h -22 a 10,10 0 0 1 -10,-10 v -20 a 10,10 0 0 1 10,-10 z
             M 159,37 a 3,3 0 0 0 -3,3 v 10 a 3,3 0 0 0 3,3 h 18 a 3,3 0 0 0 3,-3 v -10 a 3,3 0 0 0 -3,-3 z" fill-rule="evenodd"/>
    <!-- ㅓ Horizontal connector -->
    <rect x="185" y="44" width="18" height="12" rx="3"/>
    <!-- ㅓ Vertical stem (short) -->
    <rect x="199" y="25" width="13" height="60" rx="6.5"/>
    <!-- 종성 ㄱ 받침 : Smooth rounded corner -->
    <path d="M 152,98 h 50 a 8,8 0 0 1 8,8 v 24 a 6,6 0 0 1 -12,0 v -18 a 2,2 0 0 0 -2,-2 h -44 a 6,6 0 0 1 0,-12 z"/>
  </g>

  <!-- Letter 3: Witty Bite & Smile G (X: 270 ~ 410, Center: 345, 80) -->
  <g>
    <!-- G Body with teeth bite cutouts -->
    <!-- Center (340, 80), R_out = 55, R_in = 40, sw = 15 -->
    <mask id="bite-cutout-a">
      <rect width="100%" height="100%" fill="white"/>
      <!-- Crisp bite marks at top right -->
      <circle cx="388" cy="42" r="16" fill="black"/>
      <circle cx="399" cy="31" r="12" fill="black"/>
      <circle cx="379" cy="56" r="11" fill="black"/>
    </mask>

    <!-- G Shape -->
    <path mask="url(#bite-cutout-a)" fill="{C_OLIVE}" d="
      M 377,48
      A 55,55 0 1 0 395,80
      H 345
      a 7.5,7.5 0 0 1 0,-15
      h 35
      v -2
      A 40,40 0 1 1 368,57
      a 7.5,7.5 0 0 1 9,-9 z
    "/>

    <!-- Witty Crumbs flying in signature accent colors -->
    <circle cx="414" cy="34" r="5" fill="{C_OLIVE}"/>
    <circle cx="428" cy="48" r="3.5" fill="{C_SAGE}"/>
    <circle cx="406" cy="18" r="2.5" fill="{C_OLIVE}"/>
  </g>
</svg>"""

def build_svg_a_icon():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%">
  <title>머먹G 아이콘 - 콘셉트 A</title>
  <rect width="256" height="256" rx="56" fill="{C_IVORY}"/>
  
  <mask id="icon-bite-a">
    <rect width="100%" height="100%" fill="white"/>
    <circle cx="196" cy="72" r="24" fill="black"/>
    <circle cx="212" cy="56" r="18" fill="black"/>
    <circle cx="182" cy="94" r="17" fill="black"/>
  </mask>

  <!-- Big App Icon G with Bite -->
  <!-- Center (125, 132), R_out=82, R_in=58, sw=24 -->
  <path mask="url(#icon-bite-a)" fill="{C_OLIVE}" d="
    M 180,84
    A 82,82 0 1 0 207,132
    H 135
    a 12,12 0 0 1 0,-24
    h 54
    v -3
    A 58,58 0 1 1 168,97
    a 11,11 0 0 1 12,-13 z
  "/>

  <!-- Floating Crumbs -->
  <circle cx="228" cy="62" r="7.5" fill="{C_OLIVE}"/>
  <circle cx="240" cy="84" r="5" fill="{C_SAGE}"/>
  <circle cx="216" cy="38" r="4" fill="{C_OLIVE}"/>
</svg>"""

# Concept B: The Pick Roulette / Arrow G
def build_svg_b():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490 160" width="100%" height="100%">
  <title>머먹G 로고 - 콘셉트 B (골라보자 픽 G)</title>
  <rect width="100%" height="100%" fill="none"/>

  <!-- 머 (X: 35 ~ 130) -->
  <g fill="{C_OLIVE}">
    <path d="M 47,45 h 26 a 12,12 0 0 1 12,12 v 28 a 12,12 0 0 1 -12,12 h -26 a 12,12 0 0 1 -12,-12 v -28 a 12,12 0 0 1 12,-12 z
             M 49,58 a 4,4 0 0 0 -4,4 v 18 a 4,4 0 0 0 4,4 h 22 a 4,4 0 0 0 4,-4 v -18 a 4,4 0 0 0 -4,-4 z" fill-rule="evenodd"/>
    <rect x="80" y="66" width="22" height="13" rx="4"/>
    <rect x="97" y="25" width="14" height="110" rx="7"/>
  </g>

  <!-- 먹 (X: 145 ~ 240) -->
  <g fill="{C_OLIVE}">
    <path d="M 157,25 h 22 a 10,10 0 0 1 10,10 v 20 a 10,10 0 0 1 -10,10 h -22 a 10,10 0 0 1 -10,-10 v -20 a 10,10 0 0 1 10,-10 z
             M 159,37 a 3,3 0 0 0 -3,3 v 10 a 3,3 0 0 0 3,3 h 18 a 3,3 0 0 0 3,-3 v -10 a 3,3 0 0 0 -3,-3 z" fill-rule="evenodd"/>
    <rect x="185" y="44" width="18" height="12" rx="3"/>
    <rect x="199" y="25" width="13" height="60" rx="6.5"/>
    <path d="M 152,98 h 50 a 8,8 0 0 1 8,8 v 24 a 6,6 0 0 1 -12,0 v -18 a 2,2 0 0 0 -2,-2 h -44 a 6,6 0 0 1 0,-12 z"/>
  </g>

  <!-- G with Decisive Selection Arrow (Pick!) -->
  <!-- Center: (340, 80), R_out = 55, R_in = 40 -->
  <g fill="{C_OLIVE}">
    <!-- Circular track of G -->
    <path d="
      M 379,41
      A 55,55 0 1 0 395,80
      H 340
      a 7.5,7.5 0 0 1 0,-15
      h 40
      A 40,40 0 1 1 368,52
      a 7.5,7.5 0 0 1 11,-11 z
    "/>
    <!-- The Pick Selector: An arrow pointer inside pointing right into G's shelf -->
    <path d="
      M 330,80
      L 312,68
      a 5,5 0 0 0 -8,4
      v 16
      a 5,5 0 0 0 8,4
      z
    " fill="{C_OLIVE}"/>
    <!-- Accent Dial Tick Marks representing roulette options -->
    <circle cx="395" cy="55" r="4" fill="{C_SAGE}"/>
    <circle cx="392" cy="108" r="4" fill="{C_SAGE}"/>
  </g>
</svg>"""

def build_svg_b_icon():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%">
  <title>머먹G 아이콘 - 콘셉트 B</title>
  <rect width="256" height="256" rx="56" fill="{C_OLIVE}"/>
  
  <!-- G in Ivory with Pointer -->
  <!-- Center (128, 128), R_out=82, R_in=58 -->
  <g fill="{C_IVORY}">
    <path d="
      M 186,70
      A 82,82 0 1 0 210,128
      H 128
      a 12,12 0 0 1 0,-24
      h 60
      A 58,58 0 1 1 170,87
      a 11,11 0 0 1 16,-17 z
    "/>
    <!-- Pointer -->
    <path d="
      M 112,128
      L 86,110
      a 8,8 0 0 0 -13,6
      v 24
      a 8,8 0 0 0 13,6
      z
    "/>
    <!-- Dial Accent Dots -->
    <circle cx="210" cy="90" r="6" fill="{C_SAGE}"/>
    <circle cx="206" cy="170" r="6" fill="{C_SAGE}"/>
  </g>
</svg>"""

# Concept C: Platter / Ticket Stamp Badge Lockup
def build_svg_c():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490 160" width="100%" height="100%">
  <title>머먹G 로고 - 콘셉트 C (테이블 플레이트 뱃지)</title>
  <!-- Rounded Platter Tray Frame -->
  <rect x="8" y="10" width="474" height="140" rx="36" fill="{C_IVORY}" stroke="{C_OLIVE}" stroke-width="6"/>

  <!-- Subtle Rim Inset -->
  <rect x="16" y="18" width="458" height="124" rx="28" fill="none" stroke="{C_SAGE}" stroke-width="2" stroke-dasharray="8 6"/>

  <!-- 머 (X: 52 ~ 140) -->
  <g fill="{C_OLIVE}">
    <path d="M 64,48 h 24 a 10,10 0 0 1 10,10 v 24 a 10,10 0 0 1 -10,10 h -24 a 10,10 0 0 1 -10,-10 v -24 a 10,10 0 0 1 10,-10 z
             M 66,59 a 3,3 0 0 0 -3,3 v 14 a 3,3 0 0 0 3,3 h 20 a 3,3 0 0 0 3,-3 v -14 a 3,3 0 0 0 -3,-3 z" fill-rule="evenodd"/>
    <rect x="94" y="67" width="18" height="11" rx="3.5"/>
    <rect x="108" y="32" width="12" height="96" rx="6"/>
  </g>

  <!-- 먹 (X: 155 ~ 245) -->
  <g fill="{C_OLIVE}">
    <path d="M 166,32 h 20 a 8,8 0 0 1 8,8 v 18 a 8,8 0 0 1 -8,8 h -20 a 8,8 0 0 1 -8,-8 v -18 a 8,8 0 0 1 8,-8 z
             M 168,42 a 2.5,2.5 0 0 0 -2.5,2.5 v 9 a 2.5,2.5 0 0 0 2.5,2.5 h 15 a 2.5,2.5 0 0 0 2.5,-2.5 v -9 a 2.5,2.5 0 0 0 -2.5,-2.5 z" fill-rule="evenodd"/>
    <rect x="190" y="49" width="16" height="10" rx="3"/>
    <rect x="202" y="32" width="11" height="52" rx="5.5"/>
    <path d="M 162,95 h 44 a 7,7 0 0 1 7,7 v 21 a 5,5 0 0 1 -10,0 v -16 a 2,2 0 0 0 -2,-2 h -39 a 5,5 0 0 1 0,-10 z"/>
  </g>

  <!-- G (X: 270 ~ 380, Center: 325, 80) -->
  <g fill="{C_OLIVE}">
    <!-- Center (325, 80), R_out=48, R_in=35, sw=13 -->
    <path d="
      M 360,46
      A 48,48 0 1 0 373,80
      H 325
      a 6.5,6.5 0 0 1 0,-13
      h 35
      A 35,35 0 1 1 350,55
      a 6.5,6.5 0 0 1 10,-9 z
    "/>
  </g>

  <!-- Subtitle Tag: "골라보자" Pill Badge on Right -->
  <g transform="translate(390, 48)">
    <rect width="64" height="64" rx="20" fill="{C_OLIVE}"/>
    <!-- Fork & Spoon Icon in Badge -->
    <path d="M 18,22 v 12 a 6,6 0 0 0 5,6 v 14 a 3,3 0 0 0 6,0 v -14 a 6,6 0 0 0 5,-6 v -12 a 2,2 0 0 0 -4,0 v 9 a 1,1 0 0 1 -2,0 v -9 a 2,2 0 0 0 -4,0 v 9 a 1,1 0 0 1 -2,0 v -9 a 2,2 0 0 0 -4,0 z" fill="{C_IVORY}"/>
    <path d="M 45,20 a 6,9 0 0 0 -6,9 c 0,5 4,8 5,9 v 16 a 3,3 0 0 0 6,0 v -16 c 1,-1 5,-4 5,-9 a 6,9 0 0 0 -6,-9 z" fill="{C_SAGE}"/>
  </g>
</svg>"""

def build_svg_c_icon():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%">
  <title>머먹G 아이콘 - 콘셉트 C</title>
  <rect width="256" height="256" rx="56" fill="{C_IVORY}"/>
  <rect x="14" y="14" width="228" height="228" rx="44" fill="none" stroke="{C_OLIVE}" stroke-width="8"/>
  <rect x="24" y="24" width="208" height="208" rx="36" fill="none" stroke="{C_SAGE}" stroke-width="2" stroke-dasharray="6 5"/>
  
  <!-- Central G with Fork & Spoon Touch -->
  <g fill="{C_OLIVE}">
    <path d="
      M 182,74
      A 76,76 0 1 0 204,128
      H 128
      a 11,11 0 0 1 0,-22
      h 55
      A 55,55 0 1 1 167,89
      a 10,10 0 0 1 15,-15 z
    "/>
  </g>
  <circle cx="56" cy="56" r="5" fill="{C_OLIVE}"/>
  <circle cx="200" cy="56" r="5" fill="{C_OLIVE}"/>
</svg>"""

if __name__ == "__main__":
    files = {
        "concept-a-wordmark.svg": build_svg_a(),
        "concept-a-icon.svg": build_svg_a_icon(),
        "concept-b-wordmark.svg": build_svg_b(),
        "concept-b-icon.svg": build_svg_b_icon(),
        "concept-c-wordmark.svg": build_svg_c(),
        "concept-c-icon.svg": build_svg_c_icon(),
    }
    for name, content in files.items():
        p = os.path.join("logo-concepts", name)
        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        print("Wrote", p)
