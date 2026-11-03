#!/usr/bin/env python3
"""
scripts/render_story_templates.py
Uses headless Chromium to render pixel-perfect, world-class HTML/CSS/SVG Story Banners.
Outputs 1080x1920 full-bleed images matching native iOS/Telegram story design.
"""
import os
import subprocess
import base64

OUTPUT_DIR = "public"
DIST_DIR = "dist"

THEMES = [
    {
        "id": "banner",
        "name": "Obsidian",
        "primary": "#8B5CF6",
        "secondary": "#A855F7",
        "glow": "rgba(139, 92, 246, 0.4)",
        "badge_bg": "rgba(139, 92, 246, 0.15)",
        "badge_border": "rgba(139, 92, 246, 0.35)",
        "bg_gradient": "linear-gradient(180deg, #0A0A10 0%, #151326 40%, #1A1730 60%, #08080E 100%)",
        "badge_text": "UNSTOPPABLE STREAK",
    },
    {
        "id": "obsidian",
        "name": "Obsidian",
        "primary": "#8B5CF6",
        "secondary": "#A855F7",
        "glow": "rgba(139, 92, 246, 0.4)",
        "badge_bg": "rgba(139, 92, 246, 0.15)",
        "badge_border": "rgba(139, 92, 246, 0.35)",
        "bg_gradient": "linear-gradient(180deg, #0A0A10 0%, #151326 40%, #1A1730 60%, #08080E 100%)",
        "badge_text": "UNSTOPPABLE STREAK",
    },
    {
        "id": "flame",
        "name": "Flame",
        "primary": "#FF5722",
        "secondary": "#FF8A65",
        "glow": "rgba(255, 87, 34, 0.4)",
        "badge_bg": "rgba(255, 87, 34, 0.15)",
        "badge_border": "rgba(255, 87, 34, 0.35)",
        "bg_gradient": "linear-gradient(180deg, #0E0604 0%, #24110A 40%, #2A140C 60%, #0A0403 100%)",
        "badge_text": "ON FIRE",
    },
    {
        "id": "emerald",
        "name": "Emerald",
        "primary": "#10B981",
        "secondary": "#34D399",
        "glow": "rgba(16, 185, 129, 0.4)",
        "badge_bg": "rgba(16, 185, 129, 0.15)",
        "badge_border": "rgba(16, 185, 129, 0.35)",
        "bg_gradient": "linear-gradient(180deg, #050E09 0%, #0D2619 40%, #112F20 60%, #030A06 100%)",
        "badge_text": "CONSISTENCY MASTER",
    },
    {
        "id": "violet",
        "name": "Violet",
        "primary": "#EC4899",
        "secondary": "#F472B6",
        "glow": "rgba(236, 72, 153, 0.4)",
        "badge_bg": "rgba(236, 72, 153, 0.15)",
        "badge_border": "rgba(236, 72, 153, 0.35)",
        "bg_gradient": "linear-gradient(180deg, #0F060D 0%, #281023 40%, #2F1329 60%, #0B0409 100%)",
        "badge_text": "HABIT CHAMPION",
    },
    {
        "id": "cyan",
        "name": "Cyan",
        "primary": "#06B6D4",
        "secondary": "#38BDF8",
        "glow": "rgba(6, 182, 212, 0.4)",
        "badge_bg": "rgba(6, 182, 212, 0.15)",
        "badge_border": "rgba(6, 182, 212, 0.35)",
        "bg_gradient": "linear-gradient(180deg, #040C12 0%, #0D2534 40%, #112E40 60%, #02080D 100%)",
        "badge_text": "DAILY DISCIPLINE",
    },
]

def load_logo_base64():
    logo_path = "public/logo.png"
    if os.path.exists(logo_path):
        with open(logo_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    return ""

def build_html(theme, logo_b64):
    p = theme["primary"]
    s = theme["secondary"]
    glow = theme["glow"]
    badge_bg = theme["badge_bg"]
    badge_border = theme["badge_border"]
    bg_grad = theme["bg_gradient"]
    badge_text = theme["badge_text"]

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    width: 1080px;
    height: 1920px;
    background: {bg_grad};
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    color: #FFFFFF;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 240px 60px 300px 60px; /* Precise Telegram Story Safe Zones */
  }}

  /* Ambient Atmospheric Glow Orbs */
  .glow-top {{
    position: absolute;
    top: 200px;
    left: 50%;
    transform: translateX(-50%);
    width: 700px;
    height: 700px;
    background: radial-gradient(circle, {glow} 0%, rgba(0,0,0,0) 70%);
    filter: blur(80px);
    pointer-events: none;
    z-index: 1;
  }}

  .glow-bottom {{
    position: absolute;
    bottom: 350px;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 400px;
    background: radial-gradient(circle, {glow} 0%, rgba(0,0,0,0) 70%);
    filter: blur(100px);
    pointer-events: none;
    z-index: 1;
  }}

  /* Content Wrapper */
  .container {{
    width: 100%;
    max-width: 960px;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 10;
    position: relative;
    gap: 36px;
  }}

  /* Top Bar Branding */
  .header-bar {{
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 10px;
  }}

  .brand-group {{
    display: flex;
    align-items: center;
    gap: 20px;
  }}

  .logo-box {{
    width: 80px;
    height: 80px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 12px 30px rgba(0,0,0,0.4);
    overflow: hidden;
  }}

  .logo-box img {{
    width: 70px;
    height: 70px;
    object-fit: contain;
  }}

  .brand-text {{
    display: flex;
    flex-direction: column;
    gap: 2px;
  }}

  .brand-name {{
    font-size: 38px;
    font-weight: 900;
    letter-spacing: -0.5px;
    display: flex;
    align-items: center;
  }}

  .brand-name .rem {{
    color: #FFFFFF;
  }}

  .brand-name .noten {{
    color: {p};
    margin-left: 1px;
  }}

  .brand-tag {{
    font-size: 16px;
    font-weight: 700;
    color: #A1A1AA;
    letter-spacing: 2px;
    text-transform: uppercase;
  }}

  .handle-badge {{
    padding: 12px 24px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.15);
    font-size: 20px;
    font-weight: 700;
    color: #E4E4E7;
    backdrop-filter: blur(20px);
  }}

  /* Main Hero Centerpiece */
  .hero-card {{
    width: 100%;
    border-radius: 44px;
    background: rgba(18, 18, 26, 0.65);
    border: 1.5px solid rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(40px);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15);
    padding: 56px 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
  }}

  /* Flame Emblem */
  .flame-emblem-wrap {{
    position: relative;
    width: 220px;
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 28px;
  }}

  .flame-halo {{
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: radial-gradient(circle, {glow} 0%, rgba(0,0,0,0) 70%);
    filter: blur(20px);
  }}

  .flame-circle {{
    position: relative;
    width: 170px;
    height: 170px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(30, 28, 48, 0.9) 0%, rgba(18, 16, 30, 0.95) 100%);
    border: 3px solid {p};
    box-shadow: 0 15px 40px {glow};
    display: flex;
    align-items: center;
    justify-content: center;
  }}

  .flame-svg {{
    width: 96px;
    height: 96px;
    filter: drop-shadow(0 4px 16px {p});
  }}

  /* Badge Pill */
  .streak-pill {{
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 28px;
    border-radius: 999px;
    background: {badge_bg};
    border: 1.5px solid {badge_border};
    color: {p};
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 24px;
    box-shadow: 0 8px 24px {glow};
  }}

  .pill-icon {{
    width: 20px;
    height: 20px;
  }}

  /* Headlines */
  .hero-title {{
    font-size: 56px;
    font-weight: 900;
    letter-spacing: -1px;
    line-height: 1.15;
    color: #FFFFFF;
    margin-bottom: 14px;
  }}

  .hero-subtitle {{
    font-size: 24px;
    font-weight: 500;
    color: #A1A1AA;
    line-height: 1.4;
    max-width: 680px;
    margin-bottom: 40px;
  }}

  /* 7-Day Consistency Tracker */
  .tracker-box {{
    width: 100%;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 30px;
    padding: 28px 24px;
    display: flex;
    justify-content: space-around;
    align-items: center;
  }}

  .day-col {{
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }}

  .day-label {{
    font-size: 17px;
    font-weight: 700;
    color: #71717A;
    letter-spacing: 1px;
  }}

  .day-circle {{
    width: 52px;
    height: 52px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }}

  .day-circle.completed {{
    background: linear-gradient(135deg, {p} 0%, {s} 100%);
    box-shadow: 0 6px 20px {glow};
  }}

  .day-circle.active {{
    background: rgba(255, 255, 255, 0.06);
    border: 2.5px solid {p};
    box-shadow: 0 0 20px {glow};
  }}

  .check-icon {{
    width: 24px;
    height: 24px;
    stroke: #000000;
    stroke-width: 3.5;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }}

  /* Bottom Call to Action Card */
  .bottom-cta {{
    width: 100%;
    border-radius: 30px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
    border: 1.5px solid rgba(255, 255, 255, 0.15);
    padding: 26px 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
  }}

  .cta-text {{
    font-size: 26px;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: 0.2px;
  }}

  .cta-highlight {{
    color: {p};
  }}

  /* Slogan Footer */
  .slogan-footer {{
    font-size: 20px;
    font-weight: 600;
    color: #71717A;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }}
</style>
</head>
<body>

  <!-- Atmospheric Glow Lighting -->
  <div class="glow-top"></div>
  <div class="glow-bottom"></div>

  <!-- Content Container -->
  <div class="container">

    <!-- Top Bar -->
    <div class="header-bar">
      <div class="brand-group">
        <div class="logo-box">
          <img src="data:image/png;base64,{logo_b64}" alt="Logo" />
        </div>
        <div class="brand-text">
          <div class="brand-name">
            <span class="rem">Rem</span><span class="noten">noten</span>
          </div>
          <div class="brand-tag">Habit Tracker &amp; Streaks</div>
        </div>
      </div>
      <div class="handle-badge">@remnotenbot</div>
    </div>

    <!-- Main Glassmorphic Hero Card -->
    <div class="hero-card">

      <!-- Glowing Flame Emblem -->
      <div class="flame-emblem-wrap">
        <div class="flame-halo"></div>
        <div class="flame-circle">
          <!-- Curated Vector SVG Flame -->
          <svg class="flame-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C9.5 5.5 7 8 7 12C7 15.5 9.5 18.5 12 22C14.5 18.5 17 15.5 17 12C17 8 14.5 5.5 12 2Z" fill="{p}"/>
            <path d="M12 8C10.5 10 9 12 9 14.5C9 16.5 10.5 18.5 12 20.5C13.5 18.5 15 16.5 15 14.5C15 12 13.5 10 12 8Z" fill="#FFFFFF"/>
          </svg>
        </div>
      </div>

      <!-- Badge Pill -->
      <div class="streak-pill">
        <!-- SVG Sparkle Icon -->
        <svg class="pill-icon" viewBox="0 0 24 24" fill="{p}">
          <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
        </svg>
        <span>{badge_text}</span>
      </div>

      <!-- Hero Headline -->
      <h1 class="hero-title">Build Better Habits.</h1>
      <p class="hero-subtitle">Small daily disciplines create extraordinary lifelong results.</p>

      <!-- 7-Day Consistency Tracker -->
      <div class="tracker-box">
        <div class="day-col">
          <span class="day-label">MON</span>
          <div class="day-circle completed">
            <svg class="check-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>
        <div class="day-col">
          <span class="day-label">TUE</span>
          <div class="day-circle completed">
            <svg class="check-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>
        <div class="day-col">
          <span class="day-label">WED</span>
          <div class="day-circle completed">
            <svg class="check-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>
        <div class="day-col">
          <span class="day-label">THU</span>
          <div class="day-circle completed">
            <svg class="check-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>
        <div class="day-col">
          <span class="day-label">FRI</span>
          <div class="day-circle completed">
            <svg class="check-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>
        <div class="day-col">
          <span class="day-label">SAT</span>
          <div class="day-circle completed">
            <svg class="check-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>
        <div class="day-col">
          <span class="day-label">SUN</span>
          <div class="day-circle active">
            <div style="width: 14px; height: 14px; border-radius: 50%; background: {p};"></div>
          </div>
        </div>
      </div>

    </div>

    <!-- Bottom CTA Card -->
    <div class="bottom-cta">
      <!-- Telegram Icon SVG -->
      <svg width="34" height="34" viewBox="0 0 24 24" fill="{p}">
        <path d="M21.5 2.5L2.5 10.5L9.5 13.5L18.5 6.5L11.5 15.5L19.5 21.5L21.5 2.5Z"/>
      </svg>
      <span class="cta-text">Start your streak on Telegram &bull; <span class="cta-highlight">@remnotenbot</span></span>
    </div>

    <!-- Slogan Footer -->
    <div class="slogan-footer">
      Better habits &bull; A sharper you
    </div>

  </div>

</body>
</html>"""

def render_banner(theme, logo_b64):
    html_content = build_html(theme, logo_b64)
    tmp_html = f"/tmp/story_{theme['id']}.html"
    out_pub = os.path.join(OUTPUT_DIR, f"story-{theme['id']}.png")
    out_dist = os.path.join(DIST_DIR, f"story-{theme['id']}.png")

    with open(tmp_html, "w", encoding="utf-8") as f:
        f.write(html_content)

    cmd = [
        "chromium",
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        f"--user-data-dir=/tmp/chromium-story-profile-{theme['id']}",
        "--hide-scrollbars",
        "--window-size=1080,1920",
        f"--screenshot={out_pub}",
        f"file://{tmp_html}"
    ]

    subprocess.run(cmd, check=True)

    # Copy to dist
    with open(out_pub, "rb") as src, open(out_dist, "wb") as dst:
        dst.write(src.read())

    # Cleanup tmp html
    try:
        os.remove(tmp_html)
    except:
        pass

    print(f"✓ Rendered story-{theme['id']}.png (1080x1920)")

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(DIST_DIR, exist_ok=True)
    logo_b64 = load_logo_base64()

    for theme in THEMES:
        render_banner(theme, logo_b64)

if __name__ == "__main__":
    main()
