C_OLIVE = "#4d5b3c"
C_IVORY = "#efe6d4"

g_path = "M 378.2,41.8 A 54.0,54.0 0 1 0 394.0,80.0 V 73.0 H 340.0 V 87.0 H 379.4 A 40.0,40.0 0 1 1 368.3,51.7 Z"

svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 200" width="100%" height="100%">
  <rect width="100%" height="100%" fill="{C_IVORY}"/>
  <path d="{g_path}" fill="{C_OLIVE}"/>
</svg>"""

with open("logo-concepts/test_g.svg", "w", encoding="utf-8") as f:
    f.write(svg)
