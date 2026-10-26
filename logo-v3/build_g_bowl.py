import os
import math

C_OLIVE = "#4D5B3C"  # Primary Ink
C_SAGE  = "#D9D8B8"  # Sage / Khaki
C_CREAM = "#EFE6D4"  # Cream / Beige

def build_g_bowl_v1():
    """
    Concept G1: 'The Inward Spoon G'
    - The outer loop is a clean geometric 'G' shaped like a warm dining bowl.
    - The inward horizontal crossbar is a dipping spoon (Sage handle + rounded spoon scoop).
    - The bowl body features a single clean, smiling eye (no extra dots/cheeks).
    - 256x256 canvas.
    """
    # Outer circle: center (128, 128), R=84, r=56 (sw=28)
    # The bowl starts at upper-right (187, 69) [angle 45°],
    # curves smoothly ccw around left to bottom (128, 212),
    # then rises on the right to (212, 128).
    # From (212, 128), the spoon enters horizontally to x=124!
    # Spoon scoop: ellipse centered at (132, 128), rx=20, ry=15.
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-g1">
  <title id="title-g1">mumukg G-Bowl Concept 1 (Inward Spoon G)</title>
  
  <!-- Outer G-Bowl Body in Olive -->
  <path fill-rule="evenodd" fill="{C_OLIVE}" d="
    M 187,69
    A 84,84 0 1,0 212,128
    L 184,128
    A 56,56 0 1,1 167,88
    A 14,14 0 0,0 187,69
    Z
  "/>

  <!-- Inward Spoon in Sage (Crossbar of G) -->
  <g id="spoon-crossbar">
    <!-- Spoon stem entering from right rim -->
    <rect x="148" y="120" width="64" height="16" rx="8" fill="{C_SAGE}"/>
    <!-- Spoon scoop at center of G -->
    <ellipse cx="140" cy="128" rx="22" ry="17" fill="{C_SAGE}"/>
    <circle cx="140" cy="128" r="9" fill="{C_CREAM}"/>
  </g>

  <!-- Single Minimal Winking/Joyful Eye inside the Bowl -->
  <circle cx="104" cy="112" r="8" fill="{C_OLIVE}"/>

  <!-- Subtle Bowl Foot Stand at bottom -->
  <rect x="100" y="214" width="56" height="10" rx="5" fill="{C_OLIVE}"/>
</svg>"""

def build_g_bowl_v2():
    """
    Concept G2: 'The Joyful G-Bowl & Spoon Combo'
    - Lower half is a solid dining bowl with a cute appetite smile + single eye.
    - The upper contour and spoon handle rise up and curl to form the top and crossbar of 'G'.
    - Unmistakable 'G' at 16px, unmistakable bowl & spoon at large sizes.
    """
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-g2">
  <title id="title-g2">mumukg G-Bowl Concept 2 (Curved Spoon G)</title>
  
  <!-- Main G-Bowl: Lower half is bowl, upper-right is G's upright -->
  <path fill-rule="evenodd" fill="{C_OLIVE}" d="
    M 44,116
    H 212
    V 136
    A 84,84 0 0,1 128,220
    C 81.5,220 44,182.5 44,136
    Z

    M 100,162
    A 8,8 0 1,1 99.9,162
    Z

    M 122,176
    Q 138,190 154,176
    Q 138,182 122,176
    Z
  "/>

  <!-- Rim of Bowl -->
  <rect x="36" y="104" width="184" height="16" rx="8" fill="{C_OLIVE}"/>

  <!-- Spoon forming the upper loop & inner shelf of 'G' in Sage -->
  <!-- Arc rising from left, looping over top, spoon head entering at right -->
  <path fill-rule="evenodd" fill="{C_SAGE}" d="
    M 68,104
    C 68,54 104,36 148,36
    C 188,36 212,58 212,96
    L 212,104
    H 188
    V 96
    C 188,72 172,58 148,58
    C 118,58 92,72 92,104
    Z
  "/>

  <!-- Spoon scoop entering right waist -->
  <g transform="translate(160, 92)">
    <rect x="0" y="4" width="46" height="16" rx="8" fill="{C_SAGE}"/>
    <ellipse cx="6" cy="12" rx="16" ry="12" fill="{C_SAGE}"/>
    <circle cx="6" cy="12" r="6" fill="{C_CREAM}"/>
  </g>

  <!-- Base foot -->
  <rect x="100" y="220" width="56" height="10" rx="5" fill="{C_OLIVE}"/>
</svg>"""

def build_g_bowl_v3():
    """
    Concept G3: 'Pure Minimal G-Bowl'
    - A harmonious, modern geometric letter 'G' where:
      - The body is a deep rounded bowl.
      - A dipping spoon (Sage) enters diagonally/horizontally from the right.
      - A single clean eye dot inside creates an adorable character face without clutter.
    """
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-g3">
  <title id="title-g3">mumukg G-Bowl Concept 3 (Pure Minimal G-Bowl)</title>
  
  <!-- Outer G-Bowl Path in Olive: Thickness 28px -->
  <path fill-rule="evenodd" fill="{C_OLIVE}" d="
    M 184,66
    A 84,84 0 1,0 212,130
    L 212,142
    A 84,84 0 0,1 128,212
    C 81.6,212 44,174.4 44,128
    C 44,81.6 81.6,44 128,44
    C 148,44 168,51 184,66
    Z
  "/>

  <!-- Dipping Spoon in Sage entering at waist (forming G's crossbar) -->
  <g transform="translate(112, 116)">
    <!-- Spoon stem -->
    <rect x="24" y="4" width="76" height="16" rx="8" fill="{C_SAGE}"/>
    <!-- Spoon bowl / scoop head -->
    <ellipse cx="20" cy="12" rx="20" ry="15" fill="{C_SAGE}"/>
    <ellipse cx="20" cy="12" rx="12" ry="8" fill="{C_CREAM}"/>
  </g>

  <!-- Single joyful character eye -->
  <circle cx="106" cy="100" r="9" fill="{C_OLIVE}"/>

  <!-- Bowl foot stand -->
  <rect x="98" y="212" width="60" height="10" rx="5" fill="{C_OLIVE}"/>
</svg>"""

def main():
    os.makedirs("logo-v3/gbowl", exist_ok=True)
    with open("logo-v3/gbowl/g1.svg", "w") as f:
        f.write(build_g_bowl_v1())
    with open("logo-v3/gbowl/g2.svg", "w") as f:
        f.write(build_g_bowl_v2())
    with open("logo-v3/gbowl/g3.svg", "w") as f:
        f.write(build_g_bowl_v3())
    print("G-Bowl concepts written to logo-v3/gbowl/")

if __name__ == "__main__":
    main()
