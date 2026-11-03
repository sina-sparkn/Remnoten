#!/usr/bin/env python3
"""
scripts/generate_story_banners.py
Generates pixel-perfect, ultra-premium 1080x1920 Story Banners for Remnoten.
Fully compliant with Telegram Story safe zones (top 220px, bottom 320px).
"""
import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT_DIR = "public"
DIST_DIR = "dist"

THEMES = [
    {
        "id": "banner", # default
        "accent": (139, 92, 246),      # #8B5CF6 (Purple)
        "accent_hex": "#8B5CF6",
        "bg_top": (10, 10, 16),
        "bg_bot": (18, 17, 30),
        "badge": "🔥 UNSTOPPABLE STREAK",
    },
    {
        "id": "obsidian",
        "accent": (139, 92, 246),      # #8B5CF6
        "accent_hex": "#8B5CF6",
        "bg_top": (10, 10, 16),
        "bg_bot": (18, 17, 30),
        "badge": "🔥 UNSTOPPABLE STREAK",
    },
    {
        "id": "flame",
        "accent": (255, 87, 34),       # #FF5722 (Flame Orange)
        "accent_hex": "#FF5722",
        "bg_top": (14, 7, 5),
        "bg_bot": (28, 13, 8),
        "badge": "🔥 ON FIRE",
    },
    {
        "id": "emerald",
        "accent": (16, 185, 129),      # #10B981 (Emerald Mint)
        "accent_hex": "#10B981",
        "bg_top": (6, 15, 10),
        "bg_bot": (12, 30, 20),
        "badge": "⚡ CONSISTENCY MASTER",
    },
    {
        "id": "violet",
        "accent": (236, 72, 153),      # #EC4899 (Pink Pastel / Violet)
        "accent_hex": "#EC4899",
        "bg_top": (16, 7, 14),
        "bg_bot": (32, 12, 28),
        "badge": "✨ HABIT CHAMPION",
    },
    {
        "id": "cyan",
        "accent": (6, 182, 212),       # #06B6D4 (Electric Cyan)
        "accent_hex": "#06B6D4",
        "bg_top": (5, 13, 19),
        "bg_bot": (10, 26, 38),
        "badge": "💎 DAILY DISCIPLINE",
    },
]

# Load fonts
FONT_BLACK = "/usr/share/fonts/noto/NotoSans-Black.ttf"
FONT_BOLD = "/usr/share/fonts/noto/NotoSans-Bold.ttf"
FONT_MEDIUM = "/usr/share/fonts/noto/NotoSans-Medium.ttf"
FONT_REGULAR = "/usr/share/fonts/noto/NotoSans-Regular.ttf"

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

def draw_flame(draw, cx, cy, scale, color):
    """Draw a stylized vector flame centered at (cx, cy)."""
    # SVG-like flame path approximation scaled
    flame_points = [
        (cx, cy - 65 * scale),
        (cx + 15 * scale, cy - 35 * scale),
        (cx + 42 * scale, cy - 10 * scale),
        (cx + 52 * scale, cy + 25 * scale),
        (cx + 40 * scale, cy + 55 * scale),
        (cx + 18 * scale, cy + 70 * scale),
        (cx - 18 * scale, cy + 70 * scale),
        (cx - 40 * scale, cy + 55 * scale),
        (cx - 52 * scale, cy + 25 * scale),
        (cx - 42 * scale, cy - 10 * scale),
        (cx - 25 * scale, cy - 15 * scale),
        (cx - 15 * scale, cy + 5 * scale),
        (cx - 5 * scale, cy - 35 * scale),
    ]
    draw.polygon(flame_points, fill=color)

    # Inner flame
    inner_color = (255, 255, 255)
    inner_points = [
        (cx, cy + 5 * scale),
        (cx + 14 * scale, cy + 28 * scale),
        (cx + 10 * scale, cy + 52 * scale),
        (cx - 10 * scale, cy + 52 * scale),
        (cx - 14 * scale, cy + 28 * scale),
    ]
    draw.polygon(inner_points, fill=inner_color)

def generate_banner(theme, output_path):
    W, H = 1080, 1920
    im = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    draw = ImageDraw.Draw(im)

    accent = theme["accent"]
    bg_top = theme["bg_top"]
    bg_bot = theme["bg_bot"]

    # 1. Background Vertical Gradient
    for y in range(H):
        t = y / (H - 1)
        r = int(bg_top[0] * (1 - t) + bg_bot[0] * t)
        g = int(bg_top[1] * (1 - t) + bg_bot[1] * t)
        b = int(bg_top[2] * (1 - t) + bg_bot[2] * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # 2. Ambient Radial Glow Layer
    glow_im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_im)
    glow_cx, glow_cy = 540, 720
    for r in range(480, 0, -20):
        alpha = int(45 * (1 - r / 480))
        glow_draw.ellipse(
            [glow_cx - r, glow_cy - r, glow_cx + r, glow_cy + r],
            fill=(accent[0], accent[1], accent[2], alpha)
        )
    glow_im = glow_im.filter(ImageFilter.GaussianBlur(60))
    im = Image.alpha_composite(im, glow_im)
    draw = ImageDraw.Draw(im)

    # 3. Concentric Rings in Background
    ring_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ring_draw = ImageDraw.Draw(ring_layer)
    for rad in [280, 420, 580]:
        ring_draw.ellipse(
            [glow_cx - rad, glow_cy - rad, glow_cx + rad, glow_cy + rad],
            outline=(accent[0], accent[1], accent[2], 25),
            width=2
        )
    im = Image.alpha_composite(im, ring_layer)
    draw = ImageDraw.Draw(im)

    # 4. Main Story Card Frame
    # Safe zones: Telegram top bar ends at ~220px, bottom reply box starts at ~1600px
    card_x1, card_y1 = 64, 250
    card_x2, card_y2 = W - 64, 1570
    card_radius = 48

    # Card background (dark translucent glassmorphism)
    card_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    card_draw = ImageDraw.Draw(card_layer)
    card_draw.rounded_rectangle(
        [card_x1, card_y1, card_x2, card_y2],
        radius=card_radius,
        fill=(16, 16, 24, 235),
        outline=(255, 255, 255, 30),
        width=2
    )
    # Accent top border highlight
    card_draw.rounded_rectangle(
        [card_x1 + 4, card_y1 + 4, card_x2 - 4, card_y1 + 10],
        radius=4,
        fill=(accent[0], accent[1], accent[2], 70)
    )
    im = Image.alpha_composite(im, card_layer)
    draw = ImageDraw.Draw(im)

    # 5. Card Header (Branding & User Tag)
    # Load bell mark logo
    logo_path = "public/logo.png"
    if os.path.exists(logo_path):
        try:
            raw_logo = Image.open(logo_path).convert("RGBA")
            # Crop the bell mark from logo (around 350, 200, 900, 750)
            bell_crop = raw_logo.crop((350, 200, 900, 750))
            bell_icon = bell_crop.resize((76, 76), Image.Resampling.LANCZOS)

            # Squircle badge background for logo
            draw.rounded_rectangle(
                [card_x1 + 44, card_y1 + 40, card_x1 + 44 + 86, card_y1 + 40 + 86],
                radius=22,
                fill=(24, 24, 34, 255),
                outline=(255, 255, 255, 35),
                width=1
            )
            im.paste(bell_icon, (card_x1 + 49, card_y1 + 45), bell_icon)
            draw = ImageDraw.Draw(im)
        except Exception as e:
            print("Logo load error:", e)

    # Brand Title: "REM" in pure white, "NOTEN" in accent
    f_title = get_font(FONT_BLACK, 38)
    f_subtitle = get_font(FONT_BOLD, 17)

    text_x = card_x1 + 148
    text_y = card_y1 + 48
    draw.text((text_x, text_y), "REM", font=f_title, fill=(255, 255, 255, 255))
    w_rem = draw.textlength("REM", font=f_title)
    draw.text((text_x + w_rem, text_y), "NOTEN", font=f_title, fill=accent)
    draw.text((text_x, text_y + 46), "HABIT TRACKER & STREAKS", font=f_subtitle, fill=(142, 142, 152, 255))

    # Top Right Pill: "@remnotenbot"
    f_handle = get_font(FONT_BOLD, 22)
    handle_text = "@remnotenbot"
    h_w = draw.textlength(handle_text, font=f_handle)
    pill_rx = card_x2 - 44
    pill_lx = pill_rx - h_w - 36
    draw.rounded_rectangle(
        [pill_lx, card_y1 + 52, pill_rx, card_y1 + 104],
        radius=18,
        fill=(25, 25, 36, 255),
        outline=(255, 255, 255, 30),
        width=1
    )
    draw.text((pill_lx + 18, card_y1 + 65), handle_text, font=f_handle, fill=(212, 212, 216, 255))

    # Divider line
    draw.line([(card_x1 + 44, card_y1 + 150), (card_x2 - 44, card_y1 + 150)], fill=(255, 255, 255, 20), width=1)

    # 6. Hero Emblem (Center Circle with Vector Flame)
    hero_cy = card_y1 + 430
    circle_r = 115

    # Glowing outer ring
    draw.ellipse(
        [540 - circle_r - 20, hero_cy - circle_r - 20, 540 + circle_r + 20, hero_cy + circle_r + 20],
        outline=(accent[0], accent[1], accent[2], 60),
        width=4
    )
    # Main container circle
    draw.ellipse(
        [540 - circle_r, hero_cy - circle_r, 540 + circle_r, hero_cy + circle_r],
        fill=(22, 22, 32, 255),
        outline=accent,
        width=4
    )

    # Draw Flame vector
    draw_flame(draw, 540, hero_cy - 8, scale=1.1, color=accent)

    # 7. Hero Badge Pill
    f_badge = get_font(FONT_BLACK, 24)
    badge_text = theme["badge"]
    badge_w = draw.textlength(badge_text, font=f_badge)
    badge_pad_x = 36
    badge_h = 50
    badge_x1 = 540 - (badge_w + badge_pad_x * 2) / 2
    badge_x2 = 540 + (badge_w + badge_pad_x * 2) / 2
    badge_y1 = hero_cy + circle_r + 34
    badge_y2 = badge_y1 + badge_h

    draw.rounded_rectangle(
        [badge_x1, badge_y1, badge_x2, badge_y2],
        radius=25,
        fill=accent
    )
    draw.text(
        (540 - badge_w / 2, badge_y1 + 11),
        badge_text,
        font=f_badge,
        fill=(0, 0, 0, 255)
    )

    # 8. Main Headline & Subtitle
    f_headline = get_font(FONT_BLACK, 46)
    headline_text = "BUILD BETTER HABITS"
    hw = draw.textlength(headline_text, font=f_headline)
    draw.text((540 - hw / 2, badge_y2 + 42), headline_text, font=f_headline, fill=(255, 255, 255, 255))

    f_sub = get_font(FONT_MEDIUM, 25)
    sub_text = "Small daily disciplines create extraordinary results."
    sw = draw.textlength(sub_text, font=f_sub)
    draw.text((540 - sw / 2, badge_y2 + 104), sub_text, font=f_sub, fill=(156, 163, 175, 255))

    # 9. 7-Day Consistency Tracker Box
    box_w = 840
    box_h = 135
    box_x1 = 540 - box_w / 2
    box_x2 = 540 + box_w / 2
    box_y1 = badge_y2 + 160
    box_y2 = box_y1 + box_h

    draw.rounded_rectangle(
        [box_x1, box_y1, box_x2, box_y2],
        radius=26,
        fill=(22, 22, 32, 255),
        outline=(255, 255, 255, 25),
        width=1
    )

    # 7 Days nodes
    days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
    f_day = get_font(FONT_BOLD, 17)
    node_spacing = box_w / 7.5
    start_nx = 540 - 3 * node_spacing

    for i, d in enumerate(days):
        nx = start_nx + i * node_spacing
        ny = box_y1 + 42

        # Label
        dw = draw.textlength(d, font=f_day)
        draw.text((nx - dw / 2, ny - 24), d, font=f_day, fill=(142, 142, 152, 255))

        # Node Circle (R=20)
        nr = 20
        is_completed = (i < 6)
        if is_completed:
            draw.ellipse([nx - nr, ny + 16 - nr, nx + nr, ny + 16 + nr], fill=accent)
            # checkmark
            draw.line([(nx - 7, ny + 16), (nx - 2, ny + 21)], fill=(0, 0, 0, 255), width=3)
            draw.line([(nx - 2, ny + 21), (nx + 8, ny + 10)], fill=(0, 0, 0, 255), width=3)
        else:
            # Active today ring
            draw.ellipse(
                [nx - nr, ny + 16 - nr, nx + nr, ny + 16 + nr],
                fill=(30, 30, 42, 255),
                outline=accent,
                width=3
            )

    # 10. Call-to-Action Button
    btn_w = 840
    btn_h = 92
    btn_x1 = 540 - btn_w / 2
    btn_x2 = 540 + btn_w / 2
    btn_y1 = box_y2 + 36
    btn_y2 = btn_y1 + btn_h

    draw.rounded_rectangle(
        [btn_x1, btn_y1, btn_x2, btn_y2],
        radius=28,
        fill=(26, 26, 38, 255),
        outline=accent,
        width=2
    )

    f_btn = get_font(FONT_BLACK, 27)
    btn_text = "🚀 Join on Telegram  •  @remnotenbot"
    bw = draw.textlength(btn_text, font=f_btn)
    draw.text((540 - bw / 2, btn_y1 + 27), btn_text, font=f_btn, fill=(255, 255, 255, 255))

    # 11. Footer Slogan
    f_footer = get_font(FONT_MEDIUM, 23)
    footer_text = "Better habits. A sharper you."
    fw = draw.textlength(footer_text, font=f_footer)
    draw.text((540 - fw / 2, btn_y2 + 28), footer_text, font=f_footer, fill=(113, 113, 122, 255))

    # Save output
    im = im.convert("RGB")
    im.save(output_path, "PNG", quality=95)
    print(f"✓ Generated {output_path} ({W}x{H})")

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(DIST_DIR, exist_ok=True)

    for theme in THEMES:
        filename = f"story-{theme['id']}.png"
        pub_path = os.path.join(OUTPUT_DIR, filename)
        dist_path = os.path.join(DIST_DIR, filename)
        generate_banner(theme, pub_path)
        # copy to dist as well
        generate_banner(theme, dist_path)

if __name__ == "__main__":
    main()
