import { api } from 'sdk';
import { ensureBotConfigured } from '../lib/setup.js';

export default async function (input) {
  const text = input?.text || 'Open';
  const res = await api.setChatMenuButton({
    menu_button: {
      type: 'web_app',
      text,
      web_app: { url: 'https://app8837501303.tgcloud.ai' },
    },
  });
  if (input?.full) {
    await ensureBotConfigured();
  }
  const current = await api.getChatMenuButton({});
  return { ok: true, setRes: res, currentMenu: current };
}
