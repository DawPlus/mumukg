import os
import sys

C_OLIVE = "#4D5B3C"
C_SAGE  = "#D9D8B8"
C_CREAM = "#EFE6D4"
C_HONEY = "#E5A83B"

C_SILVER_LIGHT = "#E8ECEF"
C_SILVER_MID   = "#BFC7CE"
C_SILVER_DEEP  = "#8D98A2"

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

def bowl_body():
    return f"""
    <path fill-rule="evenodd" fill="{C_OLIVE}" d="
      M 32,118
      H 224
      C 220,192 180,214 128,214
      C 76,214 36,192 32,118
      Z
      M 86,146 A 8,8 0 1,1 85.9,146 Z
      M 170,146 A 8,8 0 1,1 169.9,146 Z
      M 106,164 Q 128,184 150,164 Q 128,174 106,164 Z
    "/>
    <rect x="24" y="106" width="208" height="18" rx="9" fill="{C_HONEY}"/>
    <rect x="96" y="214" width="64" height="10" rx="5" fill="{C_HONEY}"/>
    """

def spoon_s1():
    return f"""
    <g transform="rotate(-30 168 76)">
      <rect x="159" y="19" width="18" height="68" rx="9" fill="{C_SILVER_MID}"/>
      <ellipse cx="168" cy="90" rx="24" ry="28" fill="{C_SILVER_MID}"/>
      <rect x="161" y="21" width="14" height="64" rx="7" fill="{C_SAGE}"/>
      <ellipse cx="168" cy="90" rx="20.5" ry="24.5" fill="{C_SAGE}"/>
      <path d="M 160,78 a 16,20 0 0 0 14,28" fill="none" stroke="{C_SILVER_LIGHT}" stroke-width="2.5" stroke-linecap="round"/>
    </g>
    """

def spoon_s2():
    return f"""
    <g transform="rotate(-30 168 76)">
      <rect x="160" y="20" width="16" height="66" rx="8" fill="{C_SILVER_MID}"/>
      <ellipse cx="168" cy="90" rx="22" ry="26" fill="{C_SILVER_MID}"/>
      <ellipse cx="168" cy="90" rx="16" ry="19" fill="{C_SILVER_LIGHT}"/>
      <ellipse cx="168" cy="90" rx="19" ry="22.5" fill="none" stroke="{C_SILVER_DEEP}" stroke-width="1.8"/>
    </g>
    """

def spoon_s3():
    return f"""
    <g transform="rotate(-30 168 76)">
      <rect x="160" y="20" width="16" height="66" rx="8" fill="{C_SAGE}"/>
      <ellipse cx="168" cy="90" rx="23" ry="27" fill="{C_SILVER_MID}"/>
      <ellipse cx="168" cy="90" rx="18.5" ry="22.5" fill="{C_SAGE}"/>
      <ellipse cx="168" cy="90" rx="13" ry="16" fill="{C_SILVER_LIGHT}" opacity="0.65"/>
    </g>
    """

def make_lockup(spoon_markup):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 470 256" width="470" height="256">
  <g transform="translate(38, 43) scale(0.6640625)">
    {spoon_markup}
    {bowl_body()}
  </g>
  {make_wordmark(ox=236, oy=70)}
</svg>"""

out_dir = "logo-v3/silver-spoon-options"
with open(f"{out_dir}/s1-lockup.svg", "w", encoding="utf-8") as f:
    f.write(make_lockup(spoon_s1()))
with open(f"{out_dir}/s2-lockup.svg", "w", encoding="utf-8") as f:
    f.write(make_lockup(spoon_s2()))
with open(f"{out_dir}/s3-lockup.svg", "w", encoding="utf-8") as f:
    f.write(make_lockup(spoon_s3()))

print("Lockups written successfully")
