import os

C_OLIVE = "#4d5b3c"  # Signature Deep Olive Green
C_IVORY = "#efe6d4"  # Signature Warm Oatmeal Ivory
C_SAGE  = "#d9d8b8"  # Signature Soft Sage Cream

# ==========================================
# Common Hangul Letterforms for '머' and '먹'
# ==========================================
def hangul_letters(offset_x=40, offset_y=28):
    # '머' and '먹' in clean geometric vector paths
    # Baseline: y=offset_y to offset_y+104 (height=104)
    ox = offset_x
    oy = offset_y
    return f"""
    <!-- '머' (Width: ~100px) -->
    <g fill="{C_OLIVE}">
      <!-- 초성 ㅁ: x={ox}, y={oy+12}, w=48, h=52, sw=13, r=10 -->
      <path d="M {ox+10},{oy+12} h 28 a 10,10 0 0 1 10,10 v 32 a 10,10 0 0 1 -10,10 h -28 a 10,10 0 0 1 -10,-10 v -32 a 10,10 0 0 1 10,-10 z
               M {ox+12},{oy+25} a 3,3 0 0 0 -3,3 v 20 a 3,3 0 0 0 3,3 h 22 a 3,3 0 0 0 3,-3 v -20 a 3,3 0 0 0 -3,-3 z" fill-rule="evenodd"/>
      <!-- 중성 ㅓ branch -->
      <rect x="{ox+44}" y="{oy+32}" width="22" height="13" rx="4"/>
      <!-- 중성 ㅓ stem -->
      <rect x="{ox+62}" y="{oy}" width="14" height="104" rx="7"/>
    </g>

    <!-- '먹' (Width: ~100px) -->
    <g fill="{C_OLIVE}">
      <!-- 초성 ㅁ: x={ox+115}, y={oy}, w=44, h=40, sw=12, r=9 -->
      <path d="M {ox+124},{oy} h 24 a 9,9 0 0 1 9,9 v 22 a 9,9 0 0 1 -9,9 h -24 a 9,9 0 0 1 -9,-9 v -22 a 9,9 0 0 1 9,-9 z
               M {ox+126},{oy+12} a 3,3 0 0 0 -3,3 v 12 a 3,3 0 0 0 3,3 h 18 a 3,3 0 0 0 3,-3 v -12 a 3,3 0 0 0 -3,-3 z" fill-rule="evenodd"/>
      <!-- 중성 ㅓ branch -->
      <rect x="{ox+152}" y="{oy+16}" width="18" height="12" rx="3.5"/>
      <!-- 중성 ㅓ stem (short) -->
      <rect x="{ox+166}" y="{oy}" width="13" height="58" rx="6.5"/>
      <!-- 종성 ㄱ 받침 -->
      <path d="M {ox+120},{oy+68} h 48 a 8,8 0 0 1 8,8 v 22 a 6,6 0 0 1 -12,0 v -16 a 2,2 0 0 0 -2,-2 h -42 a 6,6 0 0 1 0,-12 z"/>
    </g>
    """

# ==========================================
# CONCEPT A: 얌얌(Bite & Smile) G
# ==========================================
def build_concept_a_lockup():
    cx, cy = 350, 80
    # Clean geometric G with bite mask and crumbs
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490 160" width="100%" height="100%">
  <title>머먹G 로고 - 콘셉트 A (얌얌 Bite G)</title>
  <rect width="100%" height="100%" fill="none"/>
  
  {hangul_letters(45, 28)}

  <defs>
    <mask id="bite-mask-lockup-a">
      <rect width="100%" height="100%" fill="white"/>
      <circle cx="390" cy="46" r="16" fill="black"/>
      <circle cx="400" cy="34" r="11" fill="black"/>
      <circle cx="379" cy="58" r="11" fill="black"/>
    </mask>
  </defs>

  <!-- G Letterform -->
  <g mask="url(#bite-mask-lockup-a)" fill="{C_OLIVE}">
    <path d="M 378,42 A 54,54 0 1 0 404,80 H 348 a 7,7 0 0 1 0,-14 h 42 A 40,40 0 1 1 368,52 a 7,7 0 0 1 10,-10 Z"/>
  </g>

  <!-- Witty Crumbs in Brand Colors -->
  <circle cx="414" cy="38" r="5" fill="{C_OLIVE}"/>
  <circle cx="426" cy="52" r="3.5" fill="{C_SAGE}"/>
  <circle cx="406" cy="20" r="3" fill="{C_OLIVE}"/>
</svg>"""

def build_concept_a_symbol():
    cx, cy = 124, 130
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%">
  <title>머먹G 심볼 - 콘셉트 A (얌얌 Bite G)</title>
  <rect width="256" height="256" rx="56" fill="{C_IVORY}"/>
  <rect x="8" y="8" width="240" height="240" rx="48" fill="none" stroke="{C_SAGE}" stroke-width="2"/>

  <defs>
    <mask id="bite-mask-symbol-a">
      <rect width="100%" height="100%" fill="white"/>
      <circle cx="186" cy="74" r="24" fill="black"/>
      <circle cx="202" cy="56" r="18" fill="black"/>
      <circle cx="170" cy="92" r="16" fill="black"/>
    </mask>
  </defs>

  <!-- Big App Icon G -->
  <g mask="url(#bite-mask-symbol-a)" fill="{C_OLIVE}">
    <path d="M 172,70 A 82,82 0 1 0 206,130 H 122 a 12,12 0 0 1 0,-24 h 64 A 58,58 0 1 1 157,86 a 11,11 0 0 1 15,-16 Z"/>
  </g>

  <!-- Flying Crumbs -->
  <circle cx="222" cy="62" r="7.5" fill="{C_OLIVE}"/>
  <circle cx="238" cy="84" r="5" fill="{C_SAGE}"/>
  <circle cx="210" cy="36" r="4" fill="{C_OLIVE}"/>
</svg>"""

# ==========================================
# CONCEPT B: 골라보자(Pick & Roulette) G
# ==========================================
def build_concept_b_lockup():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490 160" width="100%" height="100%">
  <title>머먹G 로고 - 콘셉트 B (골라보자 Pick G)</title>
  <rect width="100%" height="100%" fill="none"/>
  
  {hangul_letters(45, 28)}

  <!-- G Letterform with Roulette Pin Pointer -->
  <g fill="{C_OLIVE}">
    <!-- Circular track of G -->
    <path d="M 378,42 A 54,54 0 1 0 404,80 H 348 a 7,7 0 0 1 0,-14 h 42 A 40,40 0 1 1 368,52 a 7,7 0 0 1 10,-10 Z"/>
    
    <!-- The Roulette Selection Pointer (Pin at top right pointing inward) -->
    <path d="M 390,32 L 372,46 a 3,3 0 0 1 -4,-4 L 382,24 a 4,4 0 0 1 6,2 z" fill="{C_OLIVE}"/>
    <circle cx="394" cy="28" r="6" fill="{C_OLIVE}"/>
    <circle cx="394" cy="28" r="2.5" fill="{C_IVORY}"/>

    <!-- Dial Tick Marks around G (Menu options) -->
    <circle cx="414" cy="72" r="3.5" fill="{C_SAGE}"/>
    <circle cx="408" cy="98" r="3.5" fill="{C_SAGE}"/>
    <circle cx="388" cy="120" r="3.5" fill="{C_SAGE}"/>
  </g>
</svg>"""

def build_concept_b_symbol():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%">
  <title>머먹G 심볼 - 콘셉트 B (골라보자 Pick G)</title>
  <rect width="256" height="256" rx="56" fill="{C_OLIVE}"/>
  <rect x="8" y="8" width="240" height="240" rx="48" fill="none" stroke="{C_SAGE}" stroke-width="2" opacity="0.4"/>

  <!-- G in Warm Ivory with Pin Pointer -->
  <g fill="{C_IVORY}">
    <path d="M 172,70 A 82,82 0 1 0 206,130 H 122 a 12,12 0 0 1 0,-24 h 64 A 58,58 0 1 1 157,86 a 11,11 0 0 1 15,-16 Z"/>
    
    <!-- Selector Pin -->
    <path d="M 194,54 L 166,76 a 4,4 0 0 1 -6,-6 L 182,42 a 6,6 0 0 1 9,3 z" fill="{C_IVORY}"/>
    <circle cx="198" cy="48" r="9" fill="{C_IVORY}"/>
    <circle cx="198" cy="48" r="4" fill="{C_OLIVE}"/>

    <!-- Dial Tick Marks -->
    <circle cx="224" cy="116" r="5" fill="{C_SAGE}"/>
    <circle cx="216" cy="158" r="5" fill="{C_SAGE}"/>
    <circle cx="186" cy="192" r="5" fill="{C_SAGE}"/>
  </g>
</svg>"""

# ==========================================
# CONCEPT C: 테이블 플레이트(Plate Badge) 뱃지
# ==========================================
def build_concept_c_lockup():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490 160" width="100%" height="100%">
  <title>머먹G 로고 - 콘셉트 C (테이블 플레이트 뱃지)</title>
  <!-- Rounded Lunch Tray / Plate Border -->
  <rect x="6" y="8" width="478" height="144" rx="36" fill="{C_IVORY}" stroke="{C_OLIVE}" stroke-width="6"/>
  <rect x="14" y="16" width="462" height="128" rx="28" fill="none" stroke="{C_SAGE}" stroke-width="2" stroke-dasharray="6 5"/>

  {hangul_letters(45, 28)}

  <!-- G in Plate -->
  <g fill="{C_OLIVE}">
    <path d="M 378,42 A 54,54 0 1 0 404,80 H 348 a 7,7 0 0 1 0,-14 h 42 A 40,40 0 1 1 368,52 a 7,7 0 0 1 10,-10 Z"/>
  </g>

  <!-- Elegant Dining Stamp on the Right Edge -->
  <g transform="translate(424, 52)">
    <!-- Small Spoon & Fork Seal -->
    <rect width="36" height="56" rx="10" fill="{C_OLIVE}"/>
    <!-- Fork -->
    <path d="M 11,12 v 8 a 4,4 0 0 0 3,4 v 16 a 2,2 0 0 0 4,0 v -16 a 4,4 0 0 0 3,-4 v -8 a 1.5,1.5 0 0 0 -3,0 v 6 a 0.8,0.8 0 0 1 -1.6,0 v -6 a 1.5,1.5 0 0 0 -3,0 v 6 a 0.8,0.8 0 0 1 -1.6,0 v -6 a 1.5,1.5 0 0 0 -3,0 z" fill="{C_IVORY}"/>
    <!-- Spoon -->
    <path d="M 25,12 a 4.5,6.5 0 0 0 -4.5,6.5 c 0,3.5 2.5,5.5 3.5,6.5 v 15 a 2,2 0 0 0 4,0 v -15 c 1,-1 3.5,-3 3.5,-6.5 a 4.5,6.5 0 0 0 -4.5,-6.5 z" fill="{C_SAGE}"/>
  </g>
</svg>"""

def build_concept_c_symbol():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%">
  <title>머먹G 심볼 - 콘셉트 C (테이블 플레이트 뱃지)</title>
  <rect width="256" height="256" rx="56" fill="{C_IVORY}"/>
  <rect x="12" y="12" width="232" height="232" rx="46" fill="none" stroke="{C_OLIVE}" stroke-width="8"/>
  <rect x="22" y="22" width="212" height="212" rx="36" fill="none" stroke="{C_SAGE}" stroke-width="2" stroke-dasharray="6 5"/>

  <!-- G in Center with Dining Seal -->
  <g fill="{C_OLIVE}">
    <path d="M 166,66 A 76,76 0 1 0 198,124 H 122 a 11,11 0 0 1 0,-22 h 58 A 54,54 0 1 1 152,80 a 10,10 0 0 1 14,-14 Z"/>
  </g>

  <!-- Mini Spoon & Fork Accent in Center of G -->
  <g transform="translate(142, 114)">
    <circle cx="16" cy="16" r="18" fill="{C_OLIVE}"/>
    <!-- Fork -->
    <path d="M 10,6 v 5 a 2.5,2.5 0 0 0 2,2.5 v 10 a 1.2,1.2 0 0 0 2.4,0 v -10 a 2.5,2.5 0 0 0 2,-2.5 v -5 a 1,1 0 0 0 -2,0 v 4 a 0.5,0.5 0 0 1 -1,0 v -4 a 1,1 0 0 0 -2,0 v 4 a 0.5,0.5 0 0 1 -1,0 v -4 a 1,1 0 0 0 -2,0 z" fill="{C_IVORY}"/>
    <!-- Spoon -->
    <path d="M 20,6 a 3,4.5 0 0 0 -3,4.5 c 0,2.5 1.8,3.8 2.5,4.5 v 9 a 1.2,1.2 0 0 0 2.4,0 v -9 c 0.7,-0.7 2.5,-2 2.5,-4.5 a 3,4.5 0 0 0 -3,-4.5 z" fill="{C_SAGE}"/>
  </g>
</svg>"""

if __name__ == "__main__":
    files = {
        "concept-a-lockup.svg": build_concept_a_lockup(),
        "concept-a-symbol.svg": build_concept_a_symbol(),
        "concept-b-lockup.svg": build_concept_b_lockup(),
        "concept-b-symbol.svg": build_concept_b_symbol(),
        "concept-c-lockup.svg": build_concept_c_lockup(),
        "concept-c-symbol.svg": build_concept_c_symbol(),
    }
    for name, content in files.items():
        p = os.path.join("logo-concepts", name)
        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        print("Wrote", p)
