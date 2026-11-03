# Remnoten Cloudflare Cron Worker

A lightweight, 100% free Cloudflare Worker that triggers `endpoints/cron` every **1 minute** on the dot using Cloudflare's native Cron Triggers (`* * * * *`).

- Runs 24/7/365 in Cloudflare's global cloud.
- Zero servers to manage, zero cost (1,440 requests/day well under Cloudflare's free limit of 100,000/day).
- Works continuously even when your laptop is turned off or asleep.

## Setup Instructions

1. **Navigate to this folder and install dependencies**:
   ```bash
   cd cloudflare-cron
   npm install
   ```

2. **Add your tgcloud token to Cloudflare**:
   ```bash
   npx wrangler secret put TGCLOUD_TOKEN
   ```
   *(Paste your tgcloud token `app8837501303:...` when prompted)*

3. **Deploy**:
   ```bash
   npm run deploy
   ```

Once deployed, Cloudflare will automatically fire the reminder checks every minute with zero latency!
