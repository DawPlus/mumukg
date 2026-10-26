import os

C_OLIVE = "#4d5b3c"
C_IVORY = "#efe6d4"
C_SAGE  = "#d9d8b8"

# Test G path
g_clean = "M 368,52 L 378,42 A 54,54 0 1 0 394,80 H 338 v 14 H 379 A 39,39 0 1 1 368,52 Z"

svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 200" width="100%" height="100%">
  <rect width="100%" height="100%" fill="{C_IVORY}"/>
  <path d="{g_clean}" fill="{C_OLIVE}"/>
  <circle cx="340" cy="80" r="3" fill="red"/>
</svg>"""

with open("logo-concepts/test_g.svg", "w", encoding="utf-8") as f:
    f.write(svg)
