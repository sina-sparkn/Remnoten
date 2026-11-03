import { cronSources } from './sources.js';

export default {
  // 1. Native Cron Trigger — runs automatically every 1 minute in Cloudflare's cloud
  async scheduled(event, env, ctx) {
    const token = env.TGCLOUD_TOKEN;
    if (!token) {
      console.error('Missing TGCLOUD_TOKEN environment secret');
      return;
    }

    const appId = token.split(':')[0];
    const url = `https://cloud.telegram.org/${appId}/manage/run`;

    const body = {
      module: 'endpoints/cron',
      sources: cronSources,
      args: {},
      ctx: {},
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      console.log('Cron check result:', JSON.stringify(data?.result?.result || data));
    } catch (err) {
      console.error('Failed to trigger tgcloud cron:', err);
    }
  },

  // 2. HTTP handler — provides an instant health check and manual trigger URL
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/trigger') {
      await this.scheduled(null, env, ctx);
      return new Response(JSON.stringify({ ok: true, message: 'Triggered cron check' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('Remnoten Cloudflare Cron Worker is running.', { status: 200 });
  },
};
