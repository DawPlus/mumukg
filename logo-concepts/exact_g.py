import math

def generate_g_path(cx, cy, R_out=54, sw=14, angle_deg=45):
    # Crossbar is centered at cy, height is sw (from cy - sw/2 to cy + sw/2)
    # The right vertical stem of G rises from bottom up to cy + sw/2 at x = cx + R_out
    # Then crossbar goes inward from cx + R_out to cx, y from cy - sw/2 to cy + sw/2
    # Let's find the exact intersection of inner circle with y = cy + sw/2:
    R_in = R_out - sw
    y_cross_top = cy - sw/2
    y_cross_bot = cy + sw/2
    
    # Intersection of inner circle with y_cross_bot:
    dy_bot = sw / 2
    dx_in_bot = math.sqrt(max(0, R_in**2 - dy_bot**2))
    x_in_bot = cx + dx_in_bot
    
    # Top opening angle
    rad = math.radians(angle_deg)
    x_out_top = cx + R_out * math.cos(rad)
    y_out_top = cy - R_out * math.sin(rad)
    
    x_in_top = cx + R_in * math.cos(rad)
    y_in_top = cy - R_in * math.sin(rad)
    
    # Outer arc goes from (x_out_top, y_out_top) CCW to (cx + R_out, cy):
    # In SVG (y down), moving CCW is sweep=0
    # Then line up to (cx + R_out, y_cross_top)
    # Then H to cx (inward crossbar)
    # Then V to y_cross_bot
    # Then H to x_in_bot
    # Then inner arc CW (sweep=1) from (x_in_bot, y_cross_bot) to (x_in_top, y_in_top)
    # Then close to (x_out_top, y_out_top)
    
    path = (
        f"M {x_out_top:.1f},{y_out_top:.1f} "
        f"A {R_out:.1f},{R_out:.1f} 0 1 0 {cx + R_out:.1f},{cy:.1f} "
        f"V {y_cross_top:.1f} "
        f"H {cx:.1f} "
        f"V {y_cross_bot:.1f} "
        f"H {x_in_bot:.1f} "
        f"A {R_in:.1f},{R_in:.1f} 0 1 1 {x_in_top:.1f},{y_in_top:.1f} "
        f"Z"
    )
    return path

print("Testing exact G path:")
print(generate_g_path(340, 80))
